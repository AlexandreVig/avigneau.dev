import {
  createMenuBar,
  type MenuBarOptions,
  type MenuSchema,
} from '../../lib/menubar';

const SCHEMA: MenuSchema = {
  File: [
    { type: 'item', text: 'New', disabled: true },
    { type: 'item', text: 'Create Shortcut', disabled: true },
    { type: 'item', text: 'Delete', disabled: true },
    { type: 'item', text: 'Rename', disabled: true },
    { type: 'item', text: 'Properties', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Close', action: 'exit' },
  ],
  Edit: [
    { type: 'item', text: 'Undo', hotkey: 'Ctrl+Z', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Cut', hotkey: 'Ctrl+X', disabled: true },
    { type: 'item', text: 'Copy', hotkey: 'Ctrl+C', disabled: true },
    { type: 'item', text: 'Paste', hotkey: 'Ctrl+V', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Select All', hotkey: 'Ctrl+A', disabled: true },
    { type: 'item', text: 'Invert Selection', disabled: true },
  ],
  View: [
    { type: 'item', text: 'Toolbars', disabled: true },
    { type: 'item', text: 'Status Bar', disabled: true },
    { type: 'item', text: 'Explorer Bar', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Thumbnails', disabled: true },
    { type: 'item', text: 'Tiles', disabled: true },
    { type: 'item', text: 'Icons', disabled: true },
    { type: 'item', text: 'List', disabled: true },
    { type: 'item', text: 'Details', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Refresh', action: 'refresh' },
  ],
  Favorites: [
    { type: 'item', text: 'Add to Favorites...', disabled: true },
    { type: 'item', text: 'Organize Favorites...', disabled: true },
  ],
  Tools: [
    { type: 'item', text: 'Map Network Drive...', disabled: true },
    { type: 'item', text: 'Disconnect Network Drive...', disabled: true },
    { type: 'item', text: 'Synchronize...', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Folder Options...', disabled: true },
  ],
  Help: [
    { type: 'item', text: 'Help and Support Center', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'About Windows', action: 'about-windows' },
  ],
};

export type MenuOptions = Omit<MenuBarOptions, 'schema'>;

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  return createMenuBar({ ...opts, schema: SCHEMA }, signal);
}
