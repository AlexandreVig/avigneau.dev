import type { IpodAppInstance, IpodAppManifest, IpodAppMountContext } from '../apps/types';
import type { AppFrame } from './appFrame';
import { createAppFrame } from './appFrame';
import { createIpodHost } from './ipod-host';
import { t } from '../../../i18n';

/**
 * A screen on the iPod's navigation stack.
 *
 * Represented as a tagged union so the home screen and a mounted app
 * can coexist in one uniform stack — keeps the navigator's `current()`
 * API total without `null` / `undefined` edge cases.
 */
export type IpodScreen =
  | { kind: 'home' }
  | {
      kind: 'app';
      instanceId: string;
      manifest: IpodAppManifest;
      frame: AppFrame;
      abort: AbortController;
      /** Resolved after the app module's `mount()` returns. */
      instance: IpodAppInstance | null;
    };

/**
 * The iPod shell's equivalent of `windowManager` — radically simpler.
 *
 * There is exactly one visible screen at a time, navigation is a linear
 * stack (home ↔ app), and there is no drag / resize / z-index / cascade
 * logic to maintain. The stack starts at `home` and never empties.
 */
export class IpodNavigator {
  private stack: IpodScreen[] = [{ kind: 'home' }];
  /** Guards against concurrent open/close while an animation is in flight. */
  private busy = false;
  /** Monotonic counter used to hand out unique instance ids. */
  private nextInstanceId = 1;

  /** Top-of-stack screen. Never null — the home screen is always the base. */
  current(): IpodScreen {
    return this.stack[this.stack.length - 1]!;
  }

  /**
   * Launch an app.
   *
   * Creates an AppFrame, dynamic-imports the app module, calls its
   * `mount()` hook with a context bound to the frame, pushes the
   * resulting screen onto the stack, and plays the slide-up animation.
   *
   * Guarded against re-entrancy: taps during an in-flight animation
   * or while another app is already open are ignored. iOS 1 behaved
   * the same way — only one app visible at a time.
   */
  async openApp(manifest: IpodAppManifest): Promise<void> {
    if (this.busy) return;
    if (this.current().kind !== 'home') return;

    this.busy = true;

    const shellRoot = document.getElementById('ipod-shell');
    if (!shellRoot) {
      console.error('[ipod/navigator] #ipod-shell not found');
      this.busy = false;
      return;
    }

    const instanceId = `ipod-${manifest.id}-${this.nextInstanceId++}`;
    const abort = new AbortController();

    const frame = createAppFrame({
      title: manifest.titleKey ? t(manifest.titleKey) : manifest.title,
      onBack: () => {
        void this.goHome();
      },
    });

    // Push onto the stack *before* awaiting the loader so a second tap
    // sees `current().kind === 'app'` and is correctly ignored.
    const screen: IpodScreen = {
      kind: 'app',
      instanceId,
      manifest,
      frame,
      abort,
      instance: null,
    };
    this.stack.push(screen);

    shellRoot.appendChild(frame.element);

    // Kick the slide-up animation and load the module in parallel so the
    // frame is already on-screen by the time the app's `mount()` runs.
    const entered = frame.playEnter();

    let module;
    try {
      module = (await manifest.loader()).default;
    } catch (err) {
      console.error(`[ipod/navigator] failed to load "${manifest.id}"`, err);
      await entered;
      await this.tearDown(screen);
      this.busy = false;
      return;
    }

    const host = createIpodHost({ setNavBarTitle: (t) => frame.setNavBarTitle(t) }, this);

    const ctx: IpodAppMountContext = {
      root: frame.root,
      instanceId,
      args: {},
      signal: abort.signal,
      host,
    };

    try {
      const result = await module.mount(ctx);
      screen.instance = result ?? null;
    } catch (err) {
      console.error(`[ipod/navigator] "${manifest.id}".mount() threw`, err);
      await entered;
      await this.tearDown(screen);
      this.busy = false;
      return;
    }

    await entered;
    this.busy = false;
  }

  /**
   * Return to the home screen.
   *
   * Aborts the top app's AbortController (so in-flight listeners clean up),
   * calls its `unmount()` hook, plays the slide-down animation, then
   * removes the frame from the DOM and pops the stack.
   */
  async goHome(): Promise<void> {
    if (this.busy) return;
    const top = this.current();
    if (top.kind !== 'app') return;

    this.busy = true;
    await this.tearDown(top);
    this.busy = false;
  }

  /**
   * Unmount + animate-out + remove an app screen. Shared by the normal
   * `goHome` path and the loader/mount error paths in `openApp`.
   */
  private async tearDown(screen: Extract<IpodScreen, { kind: 'app' }>): Promise<void> {
    // Start the exit animation immediately so the user gets instant feedback.
    // We intentionally keep the app's DOM in place until the frame is fully
    // off-screen to avoid a "white flash" during the slide-down.
    const exited = screen.frame.playExit();

    // Signal early so signal-bound listeners and in-flight work stop while the
    // animation runs, but don't tear down the UI until it's no longer visible.
    try {
      screen.abort.abort();
    } catch (err) {
      console.warn('[ipod/navigator] abort failed', err);
    }

    await exited;

    try {
      screen.instance?.unmount?.();
    } catch (err) {
      console.error(`[ipod/navigator] "${screen.manifest.id}".unmount() threw`, err);
    }

    screen.frame.element.remove();

    // Pop only if it's still the top — defensive in case something
    // mutated the stack out from under us during the animation.
    const idx = this.stack.indexOf(screen);
    if (idx !== -1) this.stack.splice(idx, 1);
  }
}

/**
 * Singleton navigator instance. The iPod shell has one navigation stack
 * for the whole page, matching the desktop shell's one-`windowManager`
 * singleton pattern.
 */
export const ipodNavigator = new IpodNavigator();
