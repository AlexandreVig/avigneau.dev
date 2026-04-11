import type { FileHandle } from '../fs/types';
import type { WindowControl } from '../lib/types';

export type AppKind = 'singleton' | 'document' | 'multi';

export interface AppManifest {
  id: string;
  title: string;
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
  /** Dynamic import — each app ships as its own chunk. */
  loader: () => Promise<{ default: AppModule }>;
  /**
   * Optional pre-launch hook. Given the launch args, return the instanceId of
   * an already-open instance to focus, or null to fall through to the normal
   * instance-keying flow. Used by `multi`-kind apps that want to dedupe based
   * on live runtime state (e.g. explorer matching its current folder).
   */
  findExistingInstance?(args: Record<string, unknown>): string | null;
}

export interface AppModule {
  mount(ctx: AppMountContext): AppInstance | void | Promise<AppInstance | void>;
}

export interface AppMountContext {
  /** The .window-body element this app owns. */
  root: HTMLElement;
  instanceId: string;
  /** Present for document apps (notepad), null for singleton launches without a file. */
  file: FileHandle | null;
  /** Extra arguments passed from LaunchRequest.args (e.g. explorer start path). */
  args: Record<string, unknown>;
  host: AppHostAPI;
  /** Aborted when the app is unmounted. Use with addEventListener(..., { signal }). */
  signal: AbortSignal;
}

export interface AppInstance {
  unmount?(): void;
  onResize?(width: number, height: number): void;
  onFocus?(): void;
  onBlur?(): void;
  onMinimize?(): void;
  onRestore?(): void;
  /** Called when `launch()` targets an already-open singleton app with new args. */
  onLaunchArgs?(args: Record<string, unknown>): void;
}

export interface AppHostAPI {
  setTitle(title: string): void;
  setIcon(icon: string): void;
  setSize(width: number, height: number): void;
  close(): void;
}
