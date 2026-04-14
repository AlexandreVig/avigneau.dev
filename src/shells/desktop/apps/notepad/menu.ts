import {
  createMenuBar,
  type MenuBarOptions,
  type MenuSchema,
} from '../../lib/menubar';

const SCHEMA: MenuSchema = {
  File: [
    { type: 'item', text: 'New', hotkey: 'Ctrl+N', disabled: true },
    { type: 'item', text: 'Open...', hotkey: 'Ctrl+O', disabled: true },
    { type: 'item', text: 'Save', hotkey: 'Ctrl+S', disabled: true },
    { type: 'item', text: 'Save As...', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Page Setup...', disabled: true },
    { type: 'item', text: 'Print...', hotkey: 'Ctrl+P', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Exit', action: 'exit' },
  ],
  Edit: [
    { type: 'item', text: 'Undo', hotkey: 'Ctrl+Z', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Cut', hotkey: 'Ctrl+X', disabled: true },
    { type: 'item', text: 'Copy', hotkey: 'Ctrl+C', action: 'copy' },
    { type: 'item', text: 'Paste', hotkey: 'Ctrl+V', disabled: true },
    { type: 'item', text: 'Delete', hotkey: 'Del', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Find...', hotkey: 'Ctrl+F', disabled: true },
    { type: 'item', text: 'Find Next', hotkey: 'F3', disabled: true },
    { type: 'item', text: 'Replace...', hotkey: 'Ctrl+H', disabled: true },
    { type: 'item', text: 'Go To...', hotkey: 'Ctrl+G', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Select All', hotkey: 'Ctrl+A', action: 'select-all' },
    { type: 'item', text: 'Time/Date', hotkey: 'F5', disabled: true },
  ],
  Format: [
    { type: 'item', text: 'Word Wrap', disabled: true },
    { type: 'item', text: 'Font...', disabled: true },
  ],
  View: [
    { type: 'item', text: 'Status Bar', action: 'toggle-status-bar' },
  ],
  Help: [
    { type: 'item', text: 'Help Topics', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'About Notepad', action: 'about' },
  ],
};

export type MenuOptions = Omit<MenuBarOptions, 'schema' | 'logo'>;

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  return createMenuBar({ ...opts, schema: SCHEMA }, signal);
}
