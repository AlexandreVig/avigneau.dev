export type WindowControl = 'minimize' | 'maximize' | 'close';

export interface CreateWindowOptions {
  instanceId: string;
  title: string;
  icon: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  /** Which title-bar control buttons to render. Default: all three. */
  controls?: WindowControl[];
  /** Show the icon on the left of the title bar. Default: true. */
  showIcon?: boolean;
  /** Allow edge-drag resize and maximize. Default: true. */
  resizable?: boolean;
  /** Show a button for this window in the taskbar. Default: true. */
  showInTaskbar?: boolean;
}

export interface WindowState {
  /** Unique per-window-instance id (e.g. "explorer", "notepad:/Desktop/About.md"). */
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  openedAt?: number;
  resizable: boolean;
  showInTaskbar: boolean;
}

export interface XpEventDetail {
  id: string;
}

export type XpEventName =
  | 'xp:launch'
  | 'xp:close'
  | 'xp:minimize'
  | 'xp:maximize'
  | 'xp:focus'
  | 'xp:restore'
  | 'xp:taskbar-update';
