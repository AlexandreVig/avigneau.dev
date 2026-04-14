/**
 * Shared XP-style dropdown menu bar. Used by every desktop app.
 *
 * Apps provide a schema (label → items) plus callbacks. Optionally pass a
 * right-aligned logo (explorer uses this for the Windows flag).
 *
 * All listeners are bound to the caller's AbortSignal so they die on unmount.
 */
import '../styles/menubar.css';

export type MenuItem =
  | {
      type: 'item';
      text: string;
      hotkey?: string;
      disabled?: boolean;
      /** Action name forwarded to `onAction`. Omit for no-op rows. */
      action?: string;
    }
  | { type: 'separator' };

export type MenuSchema = Record<string, MenuItem[]>;

export interface MenuBarOptions {
  schema: MenuSchema;
  onAction: (action: string) => void;
  /** Called per-row when opening a panel to decide whether to render a checkmark. */
  isChecked?: (action: string) => boolean;
  /** Optional right-aligned logo (e.g. Explorer's Windows flag). */
  logo?: { src: string; alt?: string };
}

export function createMenuBar(opts: MenuBarOptions, signal: AbortSignal): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'xp-menubar';

  let openName: string | null = null;
  let openLabel: HTMLElement | null = null;
  let openPanel: HTMLElement | null = null;

  const closeMenu = (): void => {
    if (openPanel) openPanel.remove();
    if (openLabel) openLabel.classList.remove('xp-menubar-label--active');
    openName = null;
    openLabel = null;
    openPanel = null;
  };

  const openMenu = (name: string, labelEl: HTMLElement): void => {
    if (openName === name) return;
    closeMenu();
    const items = opts.schema[name];
    if (!items) return;
    const panel = buildPanel(
      items,
      (action) => {
        closeMenu();
        opts.onAction(action);
      },
      opts.isChecked,
    );
    labelEl.classList.add('xp-menubar-label--active');
    labelEl.appendChild(panel);
    openName = name;
    openLabel = labelEl;
    openPanel = panel;
  };

  for (const name of Object.keys(opts.schema)) {
    const label = document.createElement('div');
    label.className = 'xp-menubar-label';
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

  if (opts.logo) {
    const img = document.createElement('img');
    img.className = 'xp-menubar-logo';
    img.src = opts.logo.src;
    img.alt = opts.logo.alt ?? '';
    bar.appendChild(img);
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
  panel.className = 'xp-menubar-dropdown';

  // Stop mousedown from bubbling up to the parent label. Otherwise the label's
  // toggle handler would fire before our row's click can run, tearing down
  // the panel between mousedown and mouseup — which both swallows the click
  // entirely and closes the menu on disabled rows.
  panel.addEventListener('mousedown', (e) => e.stopPropagation());

  for (const item of items) {
    if (item.type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'xp-menubar-dropdown-separator';
      panel.appendChild(sep);
      continue;
    }

    const row = document.createElement('div');
    row.className = 'xp-menubar-dropdown-row';
    if (item.disabled) row.classList.add('xp-menubar-dropdown-row--disabled');

    const check = document.createElement('div');
    check.className = 'xp-menubar-dropdown-check';
    if (item.action && isChecked?.(item.action)) check.textContent = '✓';
    row.appendChild(check);

    const text = document.createElement('div');
    text.className = 'xp-menubar-dropdown-text';
    text.textContent = item.text;
    row.appendChild(text);

    const hotkey = document.createElement('div');
    hotkey.className = 'xp-menubar-dropdown-hotkey';
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
