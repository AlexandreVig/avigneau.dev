/**
 * AppFrame — the fullscreen chrome an iPod app lives inside.
 *
 * Built imperatively (not as an Astro component) because frames are
 * created and destroyed at runtime by the navigator as apps open/close,
 * and need to be mutated from both the navigator (animations, teardown)
 * and the per-app host binding (nav-bar title).
 *
 * Structure:
 *   <section class="ipod-app-frame">
 *     <header class="ipod-nav-bar">
 *       <button class="back">Home</button>
 *       <h1 class="title">…</h1>
 *     </header>
 *     <div class="ipod-app-root"> ← AppMountContext.root
 *     </div>
 *   </section>
 *
 * The frame is absolutely positioned over the home screen and slides up
 * from the bottom on enter / down on exit. Styles live in
 * `shells/ipod/styles/global.css`.
 */

import { t } from '../../../i18n';

export interface AppFrame {
  /** The outer `<section>` — appended to `#ipod-shell` by the navigator. */
  element: HTMLElement;
  /** Where the app mounts its content (`AppMountContext.root`). */
  root: HTMLElement;
  /** Update the nav-bar title. Called via the host's `setTitle`. */
  setNavBarTitle(title: string): void;
  /**
   * Slide the frame up into view. Resolves after the CSS transition ends
   * so callers can chain follow-up work.
   */
  playEnter(): Promise<void>;
  /**
   * Slide the frame back down off screen. Resolves after the transition
   * ends so the navigator can remove the element.
   */
  playExit(): Promise<void>;
}

export interface AppFrameOptions {
  /** Initial title — usually the manifest title; apps can override via host.setTitle. */
  title: string;
  /** Invoked when the user taps the nav-bar back button. */
  onBack: () => void;
}

/** Match the `.ipod-app-frame` CSS transition duration. Keep in sync. */
const SLIDE_MS = 280;

export function createAppFrame(opts: AppFrameOptions): AppFrame {
  const element = document.createElement('section');
  element.className = 'ipod-app-frame';
  // Start off-screen; `playEnter` removes this class after a reflow so
  // the transition runs on the first paint.
  element.classList.add('entering');

  const header = document.createElement('header');
  header.className = 'ipod-nav-bar';

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'back';
  backButton.textContent = t('ipod.nav.home');
  backButton.addEventListener('click', () => opts.onBack());

  const titleEl = document.createElement('h1');
  titleEl.className = 'title';
  titleEl.textContent = opts.title;

  header.append(backButton, titleEl);

  const root = document.createElement('div');
  root.className = 'ipod-app-root';

  element.append(header, root);

  return {
    element,
    root,
    setNavBarTitle(title) {
      titleEl.textContent = title;
    },
    playEnter() {
      return new Promise((resolve) => {
        // Force a reflow so the browser acknowledges the `.entering`
        // starting state before we remove it. Without this the transition
        // gets optimised away and the frame appears instantly.
        void element.offsetHeight;
        element.classList.remove('entering');
        window.setTimeout(resolve, SLIDE_MS);
      });
    },
    playExit() {
      return new Promise((resolve) => {
        element.classList.add('exiting');
        window.setTimeout(resolve, SLIDE_MS);
      });
    },
  };
}
