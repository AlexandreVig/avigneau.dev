import type { AppConfig, WindowState } from './types';

const CASCADE_BASE_X = 60;
const CASCADE_BASE_Y = 40;
const CASCADE_STEP = 30;

class WindowManager {
  private windows = new Map<string, WindowState>();
  private zCounter = 100;
  private registrationOrder = 0;
  private focusedId: string | null = null;
  private openCounter = 0;

  // ─── Public API ────────────────────────────────────────────────────────────

  register(config: AppConfig): void {
    const index = this.registrationOrder++;
    const x = config.defaultX ?? CASCADE_BASE_X + index * CASCADE_STEP;
    const y = config.defaultY ?? CASCADE_BASE_Y + index * CASCADE_STEP;

    const state: WindowState = {
      id: config.id,
      title: config.title,
      icon: config.icon,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: this.zCounter,
      x,
      y,
      width: config.defaultWidth,
      height: config.defaultHeight,
    };

    this.windows.set(config.id, state);

    const el = this.getElement(config.id);
    if (el) {
      this.applyState(config.id);
      this.setupInteraction(el, config.id);
    }
  }

  open(id: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    if (!state.isOpen) state.openedAt = ++this.openCounter;
    state.isOpen = true;
    state.isMinimized = false;
    this.applyState(id);
    this.focus(id);
    this.syncTaskbar();
  }

  close(id: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    state.isOpen = false;
    state.isMinimized = false;
    state.isMaximized = false;
    const el = this.getElement(id);
    if (el) {
      el.classList.remove('is-focused', 'is-unfocused');
    }
    if (this.focusedId === id) this.focusedId = null;
    this.applyState(id);
    this.syncTaskbar();
  }

  minimize(id: string): void {
    const state = this.windows.get(id);
    if (!state || !state.isOpen) return;
    state.isMinimized = true;
    const el = this.getElement(id);
    if (el) {
      el.classList.remove('is-focused', 'is-unfocused');
    }
    if (this.focusedId === id) this.focusedId = null;
    this.applyState(id);
    this.syncTaskbar();
  }

  restore(id: string): void {
    const state = this.windows.get(id);
    if (!state) return;
    state.isOpen = true;
    state.isMinimized = false;
    this.applyState(id);
    this.focus(id);
    this.syncTaskbar();
  }

  maximize(id: string): void {
    const state = this.windows.get(id);
    if (!state || !state.isOpen) return;

    // Just toggle the flag — CSS handles the sizing via .is-maximized.
    // The pre-maximize geometry (state.x/y/width/height) is preserved
    // so restore returns to the original position/size automatically.
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

  getState(id: string): WindowState | undefined {
    return this.windows.get(id);
  }

  getAllStates(): WindowState[] {
    return Array.from(this.windows.values());
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  private getElement(id: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-window-id="${id}"]`);
  }

  private applyState(id: string): void {
    const state = this.windows.get(id);
    const el = this.getElement(id);
    if (!state || !el) return;

    const visible = state.isOpen && !state.isMinimized;

    el.style.display = visible ? 'flex' : 'none';
    el.style.zIndex = String(state.zIndex);

    if (state.isMaximized) {
      // Let CSS handle sizing/position so it follows viewport resizes
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

    // Cover div to capture mouse events during drag/resize
    const cover = document.createElement('div');
    cover.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;';

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
        top: 'n-resize', topRight: 'ne-resize', right: 'e-resize',
        bottomRight: 'se-resize', bottom: 's-resize', bottomLeft: 'sw-resize',
        left: 'w-resize', topLeft: 'nw-resize',
      };
      return map[pos] || 'auto';
    };

    // Hover cursor
    el.addEventListener('mousemove', (e) => {
      if (isDragging || isResizing) return;
      const state = this.windows.get(id);
      if (state?.isMaximized) { el.style.cursor = 'auto'; return; }
      cursorPos = getCursorPosition(e);
      el.style.cursor = getCursorStyle(cursorPos);
    });

    el.addEventListener('mouseleave', () => {
      if (!isDragging && !isResizing) el.style.cursor = 'auto';
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

        // Right edge
        if (cursorPos.includes('right') || cursorPos.includes('Right')) {
          newW = Math.max(MIN_WIDTH, startW + dx);
        }
        // Left edge
        if (cursorPos.includes('left') || cursorPos.includes('Left')) {
          const w = Math.max(MIN_WIDTH, startW - dx);
          newX = startX + (startW - w);
          newW = w;
        }
        // Bottom edge
        if (cursorPos.includes('bottom') || cursorPos.includes('Bottom')) {
          newH = Math.max(MIN_HEIGHT, startH + dy);
        }
        // Top edge
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

      // Check if clicking on title bar for drag
      const titleBar = (e.target as Element).closest('.title-bar');
      const isButton = (e.target as Element).closest('.title-bar-controls');

      if (titleBar && !isButton && !state.isMaximized) {
        isDragging = true;
        document.body.appendChild(cover);
        cover.style.cursor = 'default';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return;
      }

      // Check if on edge for resize
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
      .filter((s) => s.isOpen)
      .sort((a, b) => (a.openedAt ?? 0) - (b.openedAt ?? 0));
    document.dispatchEvent(
      new CustomEvent('xp:taskbar-update', {
        detail: { windows: openWindows, focusedId: this.focusedId },
      }),
    );
  }
}

export const windowManager = new WindowManager();
