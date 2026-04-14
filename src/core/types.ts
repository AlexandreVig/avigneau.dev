/**
 * Core, shell-agnostic contracts for portfolio apps.
 *
 * Both shells (Windows XP desktop and iPod Touch 1G mobile) implement these
 * interfaces so that individual apps can, in principle, be written against
 * the base types. In practice each shell extends them with its own
 * shell-specific surface (window sizing on desktop, nav-bar styling on iPod)
 * and apps target their shell's concrete types.
 *
 * Nothing in this file may import from a shell. Shells import from here.
 */

/**
 * The minimum API every shell exposes to a running app instance.
 * Shells may extend this (e.g. DesktopAppHostAPI adds `setSize`).
 */
export interface BaseAppHostAPI {
  /** Update the visible title of the app's frame (window title bar or nav bar). */
  setTitle(title: string): void;
  /** Update the icon shown in the app's frame, if the shell surfaces one. */
  setIcon(icon: string): void;
  /** Ask the shell to tear this instance down. */
  close(): void;
}

/**
 * The context an app receives when it is mounted.
 *
 * `Host` is generic so shells can narrow it to their extended host API without
 * apps needing casts. `args` is the bag of launch-time arguments passed through
 * from whatever triggered the launch (icon click, deep link, etc.).
 */
export interface BaseAppMountContext<
  Host extends BaseAppHostAPI = BaseAppHostAPI,
> {
  /** The DOM element this app owns and should render into. */
  root: HTMLElement;
  /** Unique per-instance id assigned by the shell. */
  instanceId: string;
  /** Launch-time arguments; shape is defined per-app. */
  args: Record<string, unknown>;
  /** Aborted when the app is unmounted. Use with addEventListener(..., { signal }). */
  signal: AbortSignal;
  /** Shell-provided API for controlling this instance's frame. */
  host: Host;
}

/**
 * The minimum lifecycle hooks an app can implement. Shells add their own
 * hooks (onResize, onMinimize, ...) via subinterfaces.
 */
export interface BaseAppInstance {
  /** Called when the shell tears down this instance. */
  unmount?(): void;
}

/**
 * The module contract: each app's entry file default-exports an object with
 * a `mount` method. Generic over the context so each shell can constrain it.
 */
export interface BaseAppModule<
  Ctx extends BaseAppMountContext = BaseAppMountContext,
  Inst extends BaseAppInstance = BaseAppInstance,
> {
  mount(ctx: Ctx): Inst | void | Promise<Inst | void>;
}

/**
 * The minimum manifest fields every shell's registry needs. Shells add their
 * own layout/chrome fields (defaultWidth on desktop, homePosition on iPod).
 * Generic over the module type so loaders stay precisely typed.
 */
export interface BaseAppManifest<Mod extends BaseAppModule = BaseAppModule> {
  /** Stable id used by the shell's launcher and for deduping instances. */
  id: string;
  /** Human-readable app name, shown in chrome (title bar, nav bar, dock). */
  title: string;
  /** Dynamic import — each app ships as its own chunk. */
  loader: () => Promise<{ default: Mod }>;
}
