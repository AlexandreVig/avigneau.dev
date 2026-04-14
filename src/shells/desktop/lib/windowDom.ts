import type { CreateWindowOptions, WindowControl } from './types';

const DEFAULT_CONTROLS: WindowControl[] = ['minimize', 'maximize', 'close'];

/**
 * Imperatively builds a window DOM tree matching the old Window.astro template.
 * Returns the root element and the content body element (.window-body).
 */
export function createWindowElement(opts: CreateWindowOptions): {
  root: HTMLElement;
  body: HTMLElement;
} {
  const showIcon = opts.showIcon !== false;
  const resizable = opts.resizable !== false;
  const controlList = opts.controls ?? DEFAULT_CONTROLS;

  const root = document.createElement('div');
  root.className = 'window';
  root.dataset.windowId = opts.instanceId;
  root.dataset.resizable = String(resizable);
  root.style.width = `${opts.width}px`;
  root.style.height = `${opts.height}px`;
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.position = 'absolute';
  root.setAttribute('aria-hidden', 'false');

  // Title-bar gradient background
  const headerBg = document.createElement('div');
  headerBg.className = 'header__bg';
  root.appendChild(headerBg);

  // Title bar
  const titleBar = document.createElement('div');
  titleBar.className = 'title-bar';
  if (!showIcon || !opts.icon) titleBar.classList.add('title-bar--no-icon');

  if (opts.icon && showIcon) {
    const icon = document.createElement('img');
    icon.src = opts.icon;
    icon.alt = '';
    icon.className = 'title-bar-icon';
    icon.setAttribute('aria-hidden', 'true');
    titleBar.appendChild(icon);
  }

  const titleText = document.createElement('div');
  titleText.className = 'title-bar-text';
  titleText.textContent = opts.title;
  titleBar.appendChild(titleText);

  const controls = document.createElement('div');
  controls.className = 'title-bar-controls';
  for (const action of controlList) {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', action[0].toUpperCase() + action.slice(1));
    btn.dataset.action = action;
    btn.dataset.windowTarget = opts.instanceId;
    controls.appendChild(btn);
  }
  titleBar.appendChild(controls);
  root.appendChild(titleBar);

  // Body (app content goes here)
  const body = document.createElement('div');
  body.className = 'window-body';
  root.appendChild(body);

  return { root, body };
}
