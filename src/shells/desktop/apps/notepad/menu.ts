/**
 * XP-style dropdown menu bar for Notepad.
 *
 * Imperative DOM, no framework. Ported from the reference winXP repo's
 * WindowDropDowns component but simplified for a single use site.
 *
 * Lifecycle: all listeners are attached with the mount AbortSignal, so they
 * die automatically when the app unmounts.
 */

type MenuItem =
  | {
      type: 'item';
      text: string;
      hotkey?: string;
      disabled?: boolean;
      /** Action name forwarded to `onAction`. Omit for no-op rows. */
      action?: string;
    }
  | { type: 'separator' };

export interface MenuOptions {
  onAction: (action: string) => void;
  /** Called per-row when opening a panel to decide whether to render a checkmark. */
  isChecked?: (action: string) => boolean;
}

const MENU: Record<string, MenuItem[]> = {
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

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'notepad__menu';

  let openName: string | null = null;
  let openLabel: HTMLElement | null = null;
  let openPanel: HTMLElement | null = null;

  const closeMenu = (): void => {
    if (openPanel) openPanel.remove();
    if (openLabel) openLabel.classList.remove('notepad__menu-label--active');
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
    }, opts.isChecked);
    labelEl.classList.add('notepad__menu-label--active');
    labelEl.appendChild(panel);
    openName = name;
    openLabel = labelEl;
    openPanel = panel;
  };

  for (const name of Object.keys(MENU)) {
    const label = document.createElement('div');
    label.className = 'notepad__menu-label';
    label.textContent = name;

    label.addEventListener(
      'mousedown',
      (e) => {
        e.preventDefault(); // don't lose focus / select text
        if (openName === name) closeMenu();
        else openMenu(name, label);
      },
      { signal },
    );

    label.addEventListener(
      'mouseenter',
      () => {
        // Hover-to-switch: only while another menu is already open.
        if (openName && openName !== name) openMenu(name, label);
      },
      { signal },
    );

    bar.appendChild(label);
  }

  // Dismiss on outside click or Escape.
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
  isChecked?: (action: string) => boolean,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'notepad__dropdown';

  // Stop mousedown from bubbling up to the parent .notepad__menu-label.
  // Otherwise the label's toggle handler fires before our row's click can run,
  // tearing down the panel between mousedown and mouseup — which both (a)
  // swallows the click event entirely and (b) closes the menu on disabled rows.
  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  for (const item of items) {
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'notepad__dropdown-separator';
      panel.appendChild(sep);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'notepad__dropdown-row';
    if (item.disabled) row.classList.add('notepad__dropdown-row--disabled');

    const check = document.createElement('div');
    check.className = 'notepad__dropdown-check';
    if (item.action && isChecked?.(item.action)) check.textContent = '✓';
    row.appendChild(check);

    const text = document.createElement('div');
    text.className = 'notepad__dropdown-text';
    text.textContent = item.text;
    row.appendChild(text);

    const hotkey = document.createElement('div');
    hotkey.className = 'notepad__dropdown-hotkey';
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
