/**
 * XP-style dropdown menu bar for Explorer.
 *
 * Imperative DOM, no framework. Mirrors the notepad menu but uses
 * `explorer__` class names so the two apps stay independently styled.
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

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'explorer__menu';

  let openName: string | null = null;
  let openLabel: HTMLElement | null = null;
  let openPanel: HTMLElement | null = null;

  const closeMenu = (): void => {
    if (openPanel) openPanel.remove();
    if (openLabel) openLabel.classList.remove('explorer__menu-label--active');
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
    labelEl.classList.add('explorer__menu-label--active');
    labelEl.appendChild(panel);
    openName = name;
    openLabel = labelEl;
    openPanel = panel;
  };

  for (const name of Object.keys(MENU)) {
    const label = document.createElement('div');
    label.className = 'explorer__menu-label';
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
  panel.className = 'explorer__dropdown';

  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  for (const item of items) {
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'explorer__dropdown-separator';
      panel.appendChild(sep);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'explorer__dropdown-row';
    if (item.disabled) row.classList.add('explorer__dropdown-row--disabled');

    const text = document.createElement('div');
    text.className = 'explorer__dropdown-text';
    text.textContent = item.text;
    row.appendChild(text);

    const hotkey = document.createElement('div');
    hotkey.className = 'explorer__dropdown-hotkey';
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
