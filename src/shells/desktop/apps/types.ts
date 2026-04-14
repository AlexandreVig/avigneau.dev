import type {
  BaseAppHostAPI,
  BaseAppInstance,
  BaseAppManifest,
  BaseAppModule,
  BaseAppMountContext,
} from '../../../core/types';
import type { FileHandle } from '../../../fs/types';
import type { WindowControl } from '../lib/types';

export type AppKind = 'singleton' | 'document' | 'multi';

/**
 * Desktop-specific host API: adds `setSize` for window resizing, which has
 * no analogue on the iPod shell where apps are always fullscreen.
 */
export interface AppHostAPI extends BaseAppHostAPI {
  setSize(width: number, height: number): void;
}

/**
 * Desktop-specific mount context: narrows `host` to the desktop API and adds
 * `file`, since the desktop shell is the one that mounts the VFS.
 */
export interface AppMountContext extends BaseAppMountContext<AppHostAPI> {
  /** Present for document apps (notepad), null for singleton launches without a file. */
  file: FileHandle | null;
}

/**
 * Desktop-specific lifecycle hooks. These all correspond to window events
 * (resize, minimize, focus) that don't exist in the iPod shell.
 */
export interface AppInstance extends BaseAppInstance {
  onResize?(width: number, height: number): void;
  onFocus?(): void;
  onBlur?(): void;
  onMinimize?(): void;
  onRestore?(): void;
  /** Called when `launch()` targets an already-open singleton app with new args. */
  onLaunchArgs?(args: Record<string, unknown>): void;
}

/**
 * Desktop app module: re-states `mount` with the narrowed context so apps
 * don't need to annotate their mount function.
 */
export interface AppModule extends BaseAppModule<AppMountContext, AppInstance> {
  mount(ctx: AppMountContext): AppInstance | void | Promise<AppInstance | void>;
}

/**
 * Desktop app manifest: extends the base with all the window-chrome fields
 * the desktop shell needs to build a window for this app.
 */
export interface AppManifest extends BaseAppManifest<AppModule> {
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  /**
   * singleton: one instance at a time. Reopening focuses the existing window.
   * document: one instance per file (keyed by appId + path).
   * multi: every launch spawns a new independent instance.
   */
  kind: AppKind;
  /** File extensions this app can handle. Used by the shell for "Open with" resolution. */
  acceptsFileTypes?: string[];
  /** Optional: show in Start menu's left pane. */
  showInStartMenu?: boolean;
  /** Which title-bar buttons to show. Default: ['minimize','maximize','close']. */
  controls?: WindowControl[];
  /** Show the icon on the left of the title bar. Default: true. */
  showWindowIcon?: boolean;
  /** Allow edge-drag resize and maximize. Default: true. */
  resizable?: boolean;
  /** Show a button for this window in the taskbar. Default: true. */
  showInTaskbar?: boolean;
  /**
   * Optional pre-launch hook. Given the launch args, return the instanceId of
   * an already-open instance to focus, or null to fall through to the normal
   * instance-keying flow. Used by `multi`-kind apps that want to dedupe based
   * on live runtime state (e.g. explorer matching its current folder).
   */
  findExistingInstance?(args: Record<string, unknown>): string | null;
}
