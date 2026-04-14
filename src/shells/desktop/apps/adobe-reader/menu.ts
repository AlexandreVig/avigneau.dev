import {
  createMenuBar,
  type MenuBarOptions,
  type MenuSchema,
} from '../../lib/menubar';

const SCHEMA: MenuSchema = {
  File: [
    { type: 'item', text: 'Open...', hotkey: 'Ctrl+O', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Save a Copy...', action: 'save' },
    { type: 'separator' },
    { type: 'item', text: 'Print...', hotkey: 'Ctrl+P', action: 'print' },
    { type: 'separator' },
    { type: 'item', text: 'Exit', action: 'exit' },
  ],
  View: [
    { type: 'item', text: 'Fit Page', action: 'fit-page' },
    { type: 'item', text: 'Fit Width', action: 'fit-width' },
    { type: 'separator' },
    { type: 'item', text: 'Zoom In', hotkey: 'Ctrl++', action: 'zoom-in' },
    { type: 'item', text: 'Zoom Out', hotkey: 'Ctrl+-', action: 'zoom-out' },
  ],
  Help: [
    { type: 'item', text: 'About Adobe Reader', action: 'about' },
  ],
};

export type MenuOptions = Omit<MenuBarOptions, 'schema' | 'logo'>;

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  return createMenuBar({ ...opts, schema: SCHEMA }, signal);
}
