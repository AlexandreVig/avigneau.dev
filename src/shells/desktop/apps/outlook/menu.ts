import {
  createMenuBar,
  type MenuBarOptions,
  type MenuSchema,
} from '../../lib/menubar';

const SCHEMA: MenuSchema = {
  File: [
    { type: 'item', text: 'New Mail Message', hotkey: 'Ctrl+N', action: 'new-mail' },
    { type: 'separator' },
    { type: 'item', text: 'Save As...', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Print', hotkey: 'Ctrl+P', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Properties', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Work Offline', disabled: true },
    { type: 'item', text: 'Exit', action: 'exit' },
  ],
  Edit: [
    { type: 'item', text: 'Copy', hotkey: 'Ctrl+C', disabled: true },
    { type: 'item', text: 'Select All', hotkey: 'Ctrl+A', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Find Message...', hotkey: 'Ctrl+Shift+F', disabled: true },
  ],
  View: [
    { type: 'item', text: 'Current View', disabled: true },
    { type: 'item', text: 'Sort By', disabled: true },
    { type: 'item', text: 'Columns...', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Layout...', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Refresh', action: 'refresh' },
  ],
  Tools: [
    { type: 'item', text: 'Send and Receive', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Address Book...', hotkey: 'Ctrl+Shift+B', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Message Rules', disabled: true },
    { type: 'item', text: 'Accounts...', disabled: true },
    { type: 'item', text: 'Options...', disabled: true },
  ],
  Message: [
    { type: 'item', text: 'New Message', hotkey: 'Ctrl+N', action: 'new-mail' },
    { type: 'separator' },
    { type: 'item', text: 'Reply to Sender', hotkey: 'Ctrl+R', disabled: true },
    { type: 'item', text: 'Reply to All', hotkey: 'Ctrl+Shift+R', disabled: true },
    { type: 'item', text: 'Forward', hotkey: 'Ctrl+F', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'Mark as Read', disabled: true },
    { type: 'item', text: 'Mark as Unread', disabled: true },
  ],
  Help: [
    { type: 'item', text: 'Contents and Index', disabled: true },
    { type: 'separator' },
    { type: 'item', text: 'About Outlook Express', action: 'about' },
  ],
};

export type MenuOptions = Omit<MenuBarOptions, 'schema' | 'logo'>;

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  return createMenuBar({ ...opts, schema: SCHEMA }, signal);
}
