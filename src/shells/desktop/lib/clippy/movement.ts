const SPRITE_W = 124;
const SPRITE_H = 93;
const WANDER_RADIUS = 350;
const WANDER_MIN_DELAY = 3000;
const WANDER_MAX_DELAY = 6000;

type State = 'idle' | 'walking' | 'paused';

export class MovementController {
  private el: HTMLElement;
  private x: number;
  private y: number;
  private state: State = 'idle';
  private wanderTimeoutId: number | undefined;
  private onArrived: (() => void) | null = null;
  private boundTransitionEnd: (e: TransitionEvent) => void;

  constructor(el: HTMLElement, onArrived: () => void) {
    this.el = el;
    this.onArrived = onArrived;
    this.boundTransitionEnd = this.handleTransitionEnd.bind(this);
    this.el.addEventListener('transitionend', this.boundTransitionEnd);

    // Initial position: bottom-right, above taskbar (30px)
    const dw = window.innerWidth;
    const dh = window.innerHeight;
    this.x = dw - SPRITE_W - 40;
    this.y = dh - SPRITE_H - 60;
    this.applyPosition();
  }

  getCurrentPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /** Immediate position update — no transition (for drag). */
  setPosition(x: number, y: number): void {
    const clamped = this.clamp(x, y);
    this.x = clamped.x;
    this.y = clamped.y;
    this.el.classList.remove('is-walking');
    this.el.classList.add('is-dragging');
    this.applyPosition();
  }

  /** Walk smoothly to a destination via CSS transition. */
  walkTo(x: number, y: number): void {
    const clamped = this.clamp(x, y);
    this.x = clamped.x;
    this.y = clamped.y;
    this.state = 'walking';
    this.el.classList.remove('is-dragging');
    this.el.classList.add('is-walking');
    this.applyPosition();
  }

  /** Gravitate toward a window element. Parks Clippy beside it. */
  gravitateTo(windowId: string): void {
    if (this.state === 'paused') return;

    const win = document.querySelector<HTMLElement>(
      `[data-window-id="${CSS.escape(windowId)}"]`,
    );
    if (!win) return;

    this.clearWanderTimeout();
    const rect = win.getBoundingClientRect();

    // Prefer right side of window; fallback left if too close to edge
    let targetX = rect.right + 10;
    let targetY = rect.top + rect.height / 2 - SPRITE_H / 2;

    if (targetX + SPRITE_W > window.innerWidth) {
      targetX = rect.left - SPRITE_W - 10;
    }

    this.walkTo(targetX, targetY);
  }

  /** Start wandering from current position. */
  startWandering(): void {
    if (this.state === 'paused') return;
    this.scheduleWander();
  }

  /** Stop all autonomous movement (called when user drags). */
  pauseAutonomy(): void {
    this.state = 'paused';
    this.clearWanderTimeout();
    this.el.classList.remove('is-walking');
    this.el.classList.add('is-dragging');
  }

  /** Resume wandering from wherever user dropped Clippy. */
  resumeAutonomy(): void {
    this.el.classList.remove('is-dragging');
    this.state = 'idle';
    this.scheduleWander();
  }

  private scheduleWander(): void {
    this.clearWanderTimeout();
    const delay =
      WANDER_MIN_DELAY +
      Math.random() * (WANDER_MAX_DELAY - WANDER_MIN_DELAY);
    this.wanderTimeoutId = window.setTimeout(() => {
      this.wander();
    }, delay);
  }

  private wander(): void {
    if (this.state === 'paused') return;

    const dx = (Math.random() - 0.5) * 2 * WANDER_RADIUS;
    const dy = (Math.random() - 0.5) * 2 * WANDER_RADIUS;
    this.walkTo(this.x + dx, this.y + dy);
  }

  private handleTransitionEnd(e: TransitionEvent): void {
    if (e.propertyName !== 'transform') return;
    this.el.classList.remove('is-walking');
    this.state = 'idle';
    this.onArrived?.();
    this.scheduleWander();
  }

  private clamp(x: number, y: number): { x: number; y: number } {
    const maxX = window.innerWidth - SPRITE_W;
    const maxY = window.innerHeight - SPRITE_H - 30; // above taskbar
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  }

  private applyPosition(): void {
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

  private clearWanderTimeout(): void {
    if (this.wanderTimeoutId !== undefined) {
      window.clearTimeout(this.wanderTimeoutId);
      this.wanderTimeoutId = undefined;
    }
  }
}
