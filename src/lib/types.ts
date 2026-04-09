export interface AppConfig {
  id: string;
  title: string;
  icon: string; // public path e.g. "/icons/folder.png"
  defaultWidth: number;
  defaultHeight: number;
  defaultX?: number; // omit → auto-cascade
  defaultY?: number;
}

export interface WindowState {
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
  openedAt?: number; // incremental counter — determines taskbar button order
}

// Custom event payload types
export interface XpEventDetail {
  id: string;
}

export type XpEventName =
  | 'xp:open'
  | 'xp:close'
  | 'xp:minimize'
  | 'xp:maximize'
  | 'xp:focus'
  | 'xp:taskbar-update';
