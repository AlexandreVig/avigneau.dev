export type FsNode = FolderNode | FileNode | ShortcutNode;

/** Grid position for desktop icons (1-based row/col). */
export interface DesktopPosition {
  row: number;
  col: number;
}

export interface FolderNode {
  kind: 'folder';
  name: string;
  icon?: string;
  children: FsNode[];
  desktopPosition?: DesktopPosition;
}

export interface FileNode {
  kind: 'file';
  name: string;
  icon?: string;
  /** Extension including the dot, e.g. ".md". Drives default-app lookup. */
  ext: string;
  /** Lazy content loader — enables Vite code-splitting per file. */
  load: () => Promise<string>;
  desktopPosition?: DesktopPosition;
}

/**
 * A shortcut launches an app directly (optionally with a file).
 * Used for Desktop icons like "My Computer".
 */
export interface ShortcutNode {
  kind: 'shortcut';
  name: string;
  icon?: string;
  target: { appId: string; path?: string };
  desktopPosition?: DesktopPosition;
  displayShortcutArrow?: boolean; // Defaults to true
}

/** Resolved runtime handle passed to apps. */
export interface FileHandle {
  path: string;
  name: string;
  ext: string;
  icon: string;
  /** Returns content (string for text files). Memoized per handle. */
  read(): Promise<string>;
}
