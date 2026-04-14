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

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'ar__menu';

  let openName: string | null = null;
  let openLabel: HTMLElement | null = null;
  let openPanel: HTMLElement | null = null;

  const closeMenu = (): void => {
    if (openPanel) openPanel.remove();
    if (openLabel) openLabel.classList.remove('ar__menu-label--active');
    openName = null;
    openLabel = null;
    openPanel = null;
  };

  const openMenuPanel = (name: string, labelEl: HTMLElement): void => {
    if (openName === name) return;
    closeMenu();
    const items = MENU[name];
    if (!items) return;
    const panel = buildPanel(items, (action) => {
      closeMenu();
      opts.onAction(action);
    });
    labelEl.classList.add('ar__menu-label--active');
    labelEl.appendChild(panel);
    openName = name;
    openLabel = labelEl;
    openPanel = panel;
  };

  for (const name of Object.keys(MENU)) {
    const label = document.createElement('div');
    label.className = 'ar__menu-label';
    label.textContent = name;

    label.addEventListener(
      'mousedown',
      (e) => {
        e.preventDefault();
        if (openName === name) closeMenu();
        else openMenuPanel(name, label);
      },
      { signal },
    );

    label.addEventListener(
      'mouseenter',
      () => {
        if (openName && openName !== name) openMenuPanel(name, label);
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
  panel.className = 'ar__dropdown';

  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  for (const item of items) {
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'ar__dropdown-separator';
      panel.appendChild(sep);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'ar__dropdown-row';
    if (item.disabled) row.classList.add('ar__dropdown-row--disabled');

    const text = document.createElement('div');
    text.className = 'ar__dropdown-text';
    text.textContent = item.text;
    row.appendChild(text);

    const hotkey = document.createElement('div');
    hotkey.className = 'ar__dropdown-hotkey';
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
