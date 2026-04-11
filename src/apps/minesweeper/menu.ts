/**
 * XP-style dropdown menu bar for Minesweeper.
 * Mirrors the Notepad menu implementation with Minesweeper class names.
 */

type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

type MenuItem =
  | {
      type: 'item';
      text: string;
      disabled?: boolean;
      action?: string;
    }
  | { type: 'separator' };

export interface MenuOptions {
  onAction: (action: string) => void;
  isChecked?: (action: string) => boolean;
}

export type MinesweeperMenuAction =
  | 'new'
  | 'exit'
  | 'about'
  | `difficulty:${Difficulty}`;

const MENU: Record<string, MenuItem[]> = {
  Game: [
    { type: 'item', text: 'New', action: 'new' },
    { type: 'separator' },
    { type: 'item', text: 'Beginner', action: 'difficulty:Beginner' },
    { type: 'item', text: 'Intermediate', action: 'difficulty:Intermediate' },
    { type: 'item', text: 'Expert', action: 'difficulty:Expert' },
    { type: 'separator' },
    { type: 'item', text: 'Exit', action: 'exit' },
  ],
  Help: [{ type: 'item', text: 'About Minesweeper', action: 'about' }],
};

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'minesweeper__menu';

  let openName: string | null = null;
  let openLabel: HTMLElement | null = null;
  let openPanel: HTMLElement | null = null;

  const closeMenu = (): void => {
    if (openPanel) openPanel.remove();
    if (openLabel) openLabel.classList.remove('minesweeper__menu-label--active');
    openName = null;
    openLabel = null;
    openPanel = null;
  };

  const openMenu = (name: string, labelEl: HTMLElement): void => {
    if (openName === name) return;
    closeMenu();
    const items = MENU[name];
    if (!items) return;

    const panel = buildPanel(
      items,
      (action) => {
        closeMenu();
        opts.onAction(action);
      },
      opts.isChecked,
    );
    labelEl.classList.add('minesweeper__menu-label--active');
    labelEl.appendChild(panel);
    openName = name;
    openLabel = labelEl;
    openPanel = panel;
  };

  for (const name of Object.keys(MENU)) {
    const label = document.createElement('div');
    label.className = 'minesweeper__menu-label';
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
  isChecked?: (action: string) => boolean,
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'minesweeper__dropdown';
  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  for (const item of items) {
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'minesweeper__dropdown-separator';
      panel.appendChild(sep);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'minesweeper__dropdown-row';
    if (item.disabled) row.classList.add('minesweeper__dropdown-row--disabled');

    const check = document.createElement('div');
    check.className = 'minesweeper__dropdown-check';
    if (item.action && isChecked?.(item.action)) check.textContent = '✓';
    row.appendChild(check);

    const text = document.createElement('div');
    text.className = 'minesweeper__dropdown-text';
    text.textContent = item.text;
    row.appendChild(text);

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
