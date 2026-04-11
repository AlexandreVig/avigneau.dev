import {
  ANIMATIONS,
  SPRITE_URL,
  FRAME_W,
  FRAME_H,
  getLookDirection,
} from './animations';

/**
 * Sprite-based animation engine.
 * Uses a div with background-image (spritesheet) and background-position
 * to step through frames with per-frame timing via setTimeout.
 * No APNG swapping — instant, flicker-free frame transitions.
 */
export class AnimationEngine {
  private el: HTMLElement;
  private currentKey = 'Default';
  private frameIndex = 0;
  private frameTimeoutId: number | undefined;
  private locked = false;
  private onAnimationEnd: (() => void) | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    el.style.width = `${FRAME_W}px`;
    el.style.height = `${FRAME_H}px`;
    el.style.backgroundImage = `url('${SPRITE_URL}')`;
    el.style.backgroundRepeat = 'no-repeat';
  }

  /** Set a callback for when the current animation finishes. */
  setOnAnimationEnd(cb: (() => void) | null): void {
    this.onAnimationEnd = cb;
  }

  /** Play an animation by key. Returns false if blocked by lock. */
  play(key: string, opts?: { force?: boolean; lock?: boolean }): boolean {
    const anim = ANIMATIONS[key];
    if (!anim) return false;
    if (this.locked && !opts?.force) return false;

    this.stop();
    this.currentKey = key;
    this.locked = !!opts?.lock;
    this.frameIndex = 0;

    this.stepFrame();
    return true;
  }

  /** Play a Look animation based on angle from Clippy center to cursor. */
  playLook(angleDeg: number): boolean {
    const key = getLookDirection(angleDeg);
    if (key === this.currentKey) return false;
    return this.play(key);
  }

  returnToDefault(): void {
    this.stop();
    this.locked = false;
    this.currentKey = 'Default';
    this.showFrame(0, 0);
  }

  getCurrentKey(): string {
    return this.currentKey;
  }

  isLocked(): boolean {
    return this.locked;
  }

  isLookOrDefault(): boolean {
    return this.currentKey === 'Default' || this.currentKey.startsWith('Look');
  }

  private stepFrame(): void {
    const anim = ANIMATIONS[this.currentKey];
    if (!anim) return;

    const frame = anim.frames[this.frameIndex];
    if (!frame) return;

    const [col, row, duration] = frame;
    this.showFrame(col, row);

    // If this is the last frame, the animation is done
    if (this.frameIndex >= anim.frames.length - 1) {
      // Hold the last frame for its duration, then signal completion
      if (duration > 0) {
        this.frameTimeoutId = window.setTimeout(() => {
          this.frameTimeoutId = undefined;
          this.locked = false;
          this.onAnimationEnd?.();
        }, duration);
      } else {
        this.locked = false;
        this.onAnimationEnd?.();
      }
      return;
    }

    // Schedule next frame
    if (duration > 0) {
      this.frameTimeoutId = window.setTimeout(() => {
        this.frameIndex++;
        this.stepFrame();
      }, duration);
    } else {
      // 0-duration frame: advance immediately
      this.frameIndex++;
      this.stepFrame();
    }
  }

  private showFrame(col: number, row: number): void {
    const x = -(col * FRAME_W);
    const y = -(row * FRAME_H);
    this.el.style.backgroundPosition = `${x}px ${y}px`;
  }

  private stop(): void {
    if (this.frameTimeoutId !== undefined) {
      window.clearTimeout(this.frameTimeoutId);
      this.frameTimeoutId = undefined;
    }
  }
}
