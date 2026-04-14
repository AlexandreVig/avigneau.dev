import type { CreateWindowOptions, WindowState } from './types';
import { createWindowElement } from './windowDom';

const CASCADE_BASE_X = 60;
const CASCADE_BASE_Y = 40;
const CASCADE_STEP = 30;

class WindowManager {
  private windows = new Map<string, WindowState>();
  private zCounter = 100;
  private cascadeIndex = 0;
  private focusedId: string | null = null;
  private openCounter = 0;

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Creates a new window DOM node, inserts it into #desktop, wires interactions. */
  create(opts: CreateWindowOptions): HTMLElement {
    const x = opts.x ?? CASCADE_BASE_X + (this.cascadeIndex % 8) * CASCADE_STEP;
    const y = opts.y ?? CASCADE_BASE_Y + (this.cascadeIndex % 8) * CASCADE_STEP;
    this.cascadeIndex++;

    const state: WindowState = {
      id: opts.instanceId,
      title: opts.title,
      icon: opts.icon,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: ++this.zCounter,
      x,
      y,
      width: opts.width,
      height: opts.height,
      openedAt: ++this.openCounter,
      resizable: opts.resizable !== false,
      showInTaskbar: opts.showInTaskbar !== false,
    };
    this.windows.set(opts.instanceId, state);

    const { root, body } = createWindowElement(opts);
    const desktop = document.getElementById('desktop') ?? document.body;
    desktop.appendChild(root);

    this.applyState(opts.instanceId);
    this.setupInteraction(root, opts.instanceId);
    this.focus(opts.instanceId);
    this.syncTaskbar();

    return body;
  }

  /** Removes the window DOM node and all tracked state. */
  destroy(id: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    const el = this.getElement(id);
    if (el) el.remove();
    if (this.focusedId === id) this.focusedId = null;
    this.windows.delete(id);
    this.syncTaskbar();
  }

  has(id: string): boolean {
    return this.windows.has(id);
  }

  minimize(id: string): void {
    const state = this.windows.get(id);
    if (!state || !state.isOpen) return;
    state.isMinimized = true;
    const el = this.getElement(id);
    if (el) el.classList.remove('is-focused', 'is-unfocused');
    if (this.focusedId === id) this.focusedId = null;
    this.applyState(id);
    this.syncTaskbar();
  }

  restore(id: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    state.isMinimized = false;
    this.applyState(id);
    this.focus(id);
    this.syncTaskbar();
  }

  maximize(id: string): void {
    const state = this.windows.get(id);
    if (!state || !state.isOpen) return;
    if (!state.resizable) return;
    state.isMaximized = !state.isMaximized;
    this.applyState(id);
    this.focus(id);
  }

  focus(id: string): void {
    this.windows.forEach((s, wid) => {
      if (!s.isOpen || s.isMinimized) return;
      const el = this.getElement(wid);
      if (el) {
        el.classList.remove('is-focused');
        el.classList.add('is-unfocused');
      }
    });
    const state = this.windows.get(id);
    const el = this.getElement(id);
    if (!state || !el) return;
    state.zIndex = ++this.zCounter;
    el.style.zIndex = String(state.zIndex);
    el.classList.add('is-focused');
    el.classList.remove('is-unfocused');
    this.focusedId = id;
    this.syncTaskbar();
  }

  setTitle(id: string, title: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    state.title = title;
    const el = this.getElement(id);
    if (el) {
      const textEl = el.querySelector<HTMLElement>('.title-bar-text');
      if (textEl) textEl.textContent = title;
    }
    this.syncTaskbar();
  }

  setIcon(id: string, icon: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    state.icon = icon;
    const el = this.getElement(id);
    if (el) {
      const iconEl = el.querySelector<HTMLImageElement>('.title-bar-icon');
      if (iconEl) iconEl.src = icon;
    }
    this.syncTaskbar();
  }

  /** Programmatically resize a window (content-box width/height). */
  setSize(id: string, width: number, height: number): void {
    const state = this.windows.get(id);
    if (!state || !state.isOpen) return;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    if (state.isMaximized) return;

    state.width = Math.max(0, Math.ceil(width));
    state.height = Math.max(0, Math.ceil(height));
    this.applyState(id);
  }

  getState(id: string): WindowState | undefined {
    return this.windows.get(id);
  }

  getAllStates(): WindowState[] {
    return Array.from(this.windows.values());
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  private getElement(id: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(
      `[data-window-id="${CSS.escape(id)}"]`,
    );
  }

  private applyState(id: string): void {
    const state = this.windows.get(id);
    const el = this.getElement(id);
    if (!state || !el) return;

    const visible = state.isOpen && !state.isMinimized;
    el.style.display = visible ? 'flex' : 'none';
    el.style.zIndex = String(state.zIndex);

    if (state.isMaximized) {
      el.style.width = '';
      el.style.height = '';
      el.style.transform = '';
    } else {
      el.style.width = `${state.width}px`;
      el.style.height = `${state.height}px`;
      el.style.transform = `translate(${state.x}px, ${state.y}px)`;
    }

    el.classList.toggle('is-maximized', state.isMaximized);
    el.setAttribute('aria-hidden', String(!visible));
  }

  private setupInteraction(el: HTMLElement, id: string): void {
    const RESIZE_THRESHOLD = 10;
    const MIN_WIDTH = 200;
    const MIN_HEIGHT = 120;

    let cursorPos = '';
    let isDragging = false;
    let isResizing = false;
    let originMouseX = 0;
    let originMouseY = 0;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    const cover = document.createElement('div');
    cover.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;';

    const getCursorPosition = (e: MouseEvent): string => {
      if (e.target !== el) return '';
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      if (x < RESIZE_THRESHOLD) {
        if (y < RESIZE_THRESHOLD) return 'topLeft';
        if (h - y < RESIZE_THRESHOLD) return 'bottomLeft';
        return 'left';
      }
      if (w - x < RESIZE_THRESHOLD) {
        if (y < RESIZE_THRESHOLD) return 'topRight';
        if (h - y < RESIZE_THRESHOLD) return 'bottomRight';
        return 'right';
      }
      if (y < RESIZE_THRESHOLD) return 'top';
      if (h - y < RESIZE_THRESHOLD) return 'bottom';
      return '';
    };

    const getCursorStyle = (pos: string): string => {
      const map: Record<string, string> = {
        top: 'var(--xp-cursor-resize-ns)',
        bottom: 'var(--xp-cursor-resize-ns)',
        left: 'var(--xp-cursor-resize-ew)',
        right: 'var(--xp-cursor-resize-ew)',
        topLeft: 'var(--xp-cursor-resize-nesw)',
        bottomRight: 'var(--xp-cursor-resize-nesw)',
        topRight: 'var(--xp-cursor-resize-nwse)',
        bottomLeft: 'var(--xp-cursor-resize-nwse)',
      };
      return map[pos] || '';
    };

    el.addEventListener('mousemove', (e) => {
      if (isDragging || isResizing) return;
      const state = this.windows.get(id);
      if (state?.isMaximized || !state?.resizable) {
        el.style.cursor = '';
        cursorPos = '';
        return;
      }
      cursorPos = getCursorPosition(e);
      el.style.cursor = getCursorStyle(cursorPos);
    });

    el.addEventListener('mouseleave', () => {
      if (!isDragging && !isResizing) el.style.cursor = '';
    });

    const onMouseMove = (e: MouseEvent) => {
      const state = this.windows.get(id);
      if (!state) return;
      const dx = e.pageX - originMouseX;
      const dy = e.pageY - originMouseY;

      if (isDragging) {
        state.x = startX + dx;
        state.y = startY + dy;
        el.style.transform = `translate(${state.x}px, ${state.y}px)`;
      } else if (isResizing) {
        let newX = startX;
        let newY = startY;
        let newW = startW;
        let newH = startH;

        if (cursorPos.includes('right') || cursorPos.includes('Right')) {
          newW = Math.max(MIN_WIDTH, startW + dx);
        }
        if (cursorPos.includes('left') || cursorPos.includes('Left')) {
          const w = Math.max(MIN_WIDTH, startW - dx);
          newX = startX + (startW - w);
          newW = w;
        }
        if (cursorPos.includes('bottom') || cursorPos.includes('Bottom')) {
          newH = Math.max(MIN_HEIGHT, startH + dy);
        }
        if (cursorPos.includes('top') || cursorPos.includes('Top')) {
          const h = Math.max(MIN_HEIGHT, startH - dy);
          newY = startY + (startH - h);
          newH = h;
        }

        state.x = newX;
        state.y = newY;
        state.width = newW;
        state.height = newH;
        el.style.transform = `translate(${state.x}px, ${state.y}px)`;
        el.style.width = `${state.width}px`;
        el.style.height = `${state.height}px`;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isResizing = false;
      cover.remove();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    el.addEventListener('mousedown', (e) => {
      this.focus(id);
      const state = this.windows.get(id);
      if (!state) return;

      originMouseX = e.pageX;
      originMouseY = e.pageY;
      startX = state.x;
      startY = state.y;
      startW = state.width;
      startH = state.height;

      const titleBar = (e.target as Element).closest('.title-bar');
      const isButton = (e.target as Element).closest('.title-bar-controls');

      if (titleBar && !isButton && !state.isMaximized) {
        isDragging = true;
        document.body.appendChild(cover);
        cover.style.cursor = 'var(--xp-cursor-default)';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return;
      }

      if (cursorPos && !state.isMaximized && e.target === el) {
        isResizing = true;
        document.body.appendChild(cover);
        cover.style.cursor = getCursorStyle(cursorPos);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
    });
  }

  private syncTaskbar(): void {
    const openWindows = Array.from(this.windows.values())
      .filter((s) => s.isOpen && s.showInTaskbar)
      .sort((a, b) => (a.openedAt ?? 0) - (b.openedAt ?? 0));
    document.dispatchEvent(
      new CustomEvent('xp:taskbar-update', {
        detail: { windows: openWindows, focusedId: this.focusedId },
      }),
    );
  }
}

export const windowManager = new WindowManager();
