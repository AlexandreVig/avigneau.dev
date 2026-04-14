/**
 * XP-style dropdown menu bar for Outlook Express.
 * Mirrors the explorer menu pattern with outlook-specific class names.
 */

type MenuItem =
  | {
      type: 'item';
      text: string;
      hotkey?: string;
      disabled?: boolean;
      action?: string;
    }
  | { type: 'separator' };

export interface MenuOptions {
  onAction: (action: string) => void;
}

const MENU: Record<string, MenuItem[]> = {
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

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'outlook__menu';

  let openName: string | null = null;
  let openLabel: HTMLElement | null = null;
  let openPanel: HTMLElement | null = null;

  const closeMenu = (): void => {
    if (openPanel) openPanel.remove();
    if (openLabel) openLabel.classList.remove('outlook__menu-label--active');
    openName = null;
    openLabel = null;
    openPanel = null;
  };

  const openMenu = (name: string, labelEl: HTMLElement): void => {
    if (openName === name) return;
    closeMenu();
    const items = MENU[name];
    if (!items) return;
    const panel = buildPanel(items, (action) => {
      closeMenu();
      opts.onAction(action);
    });
    labelEl.classList.add('outlook__menu-label--active');
    labelEl.appendChild(panel);
    openName = name;
    openLabel = labelEl;
    openPanel = panel;
  };

  for (const name of Object.keys(MENU)) {
    const label = document.createElement('div');
    label.className = 'outlook__menu-label';
    label.textContent = name;

    label.addEventListener(
      'mousedown',
      (e) => {
        e.preventDefault();
        if (openName === name) closeMenu();
        else openMenu(name, label);
      },
      { signal },
    );

    label.addEventListener(
      'mouseenter',
      () => {
        if (openName && openName !== name) openMenu(name, label);
      },
      { signal },
    );

    bar.appendChild(label);
  }

  document.addEventListener(
    'mousedown',
    (e) => {
      if (!bar.contains(e.target as Node)) closeMenu();
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') closeMenu();
    },
    { signal },
  );

  return bar;
}

function buildPanel(
  items: MenuItem[],
  onClick: (action: string) => void,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'outlook__dropdown';

  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  for (const item of items) {
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'outlook__dropdown-separator';
      panel.appendChild(sep);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'outlook__dropdown-row';
    if (item.disabled) row.classList.add('outlook__dropdown-row--disabled');

    const text = document.createElement('div');
    text.className = 'outlook__dropdown-text';
    text.textContent = item.text;
    row.appendChild(text);

    const hotkey = document.createElement('div');
    hotkey.className = 'outlook__dropdown-hotkey';
    hotkey.textContent = item.hotkey ?? '';
    row.appendChild(hotkey);

    if (!item.disabled && item.action) {
      const action = item.action;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(action);
      });
    }

    panel.appendChild(row);
  }

  return panel;
}
