import { ANIMATIONS, FRAME_W, FRAME_H, getRandomIdleAnimation, preloadSpritesheet } from './animations';
import { AnimationEngine } from './engine';
import { MovementController } from './movement';

const IDLE_GAP = 3000;
const SNOOZE_THRESHOLD = 120_000; // 2 min
const LOOK_THROTTLE = 200;
const LOOK_MIN_DISTANCE = 50;

const LAUNCH_ANIMATION_MAP: Record<string, string[]> = {
  notepad: ['Writing', 'CheckingSomething'],
  explorer: ['Searching'],
  'outlook-express': ['SendMail'],
  'outlook-compose': ['Writing'],
  'adobe-reader': ['Print', 'CheckingSomething'],
  minesweeper: ['GetTechy'],
  bsod: ['Alert'],
};

let engine: AnimationEngine;
let movement: MovementController;
let overlay: HTMLElement;

let idleTimeoutId: number | undefined;
let lastActivityTime = Date.now();
let lastLookTime = 0;
let currentIdleKey: string | undefined;
// ── DOM Creation ──────────────────────────────────────────────────────────────

function createDOM(): { overlay: HTMLElement; sprite: HTMLElement } {
  const el = document.createElement('div');
  el.id = 'clippy-overlay';

  const sprite = document.createElement('div');
  sprite.id = 'clippy-sprite';

  el.appendChild(sprite);
  document.body.appendChild(el);

  return { overlay: el, sprite };
}

// ── Drag ──────────────────────────────────────────────────────────────────────

function setupDrag(): void {
  let originX = 0;
  let originY = 0;
  let startX = 0;
  let startY = 0;

  const cover = document.createElement('div');
  cover.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;cursor:var(--xp-cursor-move);';

  const onMove = (e: MouseEvent) => {
    const dx = e.pageX - originX;
    const dy = e.pageY - originY;
    movement.setPosition(startX + dx, startY + dy);
  };

  const onUp = () => {
    cover.remove();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    movement.resumeAutonomy();
  };

  overlay.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // left click only
    e.preventDefault();

    const pos = movement.getCurrentPosition();
    originX = e.pageX;
    originY = e.pageY;
    startX = pos.x;
    startY = pos.y;

    movement.pauseAutonomy();
    document.body.appendChild(cover);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}

// ── Cursor Tracking ───────────────────────────────────────────────────────────

function setupCursorTracking(): void {
  document.addEventListener('mousemove', (e) => {
    lastActivityTime = Date.now();

    if (!engine.isLookOrDefault()) return;

    const now = Date.now();
    if (now - lastLookTime < LOOK_THROTTLE) return;
    lastLookTime = now;

    const pos = movement.getCurrentPosition();
    const cx = pos.x + FRAME_W / 2;
    const cy = pos.y + FRAME_H / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < LOOK_MIN_DISTANCE) return;

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    engine.playLook(angle);
  });
}

// ── Idle Loop ─────────────────────────────────────────────────────────────────

function scheduleNextIdle(): void {
  clearIdleTimeout();
  idleTimeoutId = window.setTimeout(() => {
    playIdleAnimation();
  }, IDLE_GAP);
}

function playIdleAnimation(): void {
  if (engine.isLocked()) return;

  const inactive = Date.now() - lastActivityTime > SNOOZE_THRESHOLD;
  let key: string;

  if (inactive) {
    key = 'IdleSnooze';
  } else {
    const result = getRandomIdleAnimation(currentIdleKey);
    key = result.key;
  }

  currentIdleKey = key;
  engine.play(key);
}

function clearIdleTimeout(): void {
  if (idleTimeoutId !== undefined) {
    window.clearTimeout(idleTimeoutId);
    idleTimeoutId = undefined;
  }
}

// ── Event Reactions ───────────────────────────────────────────────────────────

function playLocked(key: string): void {
  clearIdleTimeout();
  engine.play(key, { force: true, lock: true });
}

const CLOSE_ANIMATIONS = ['Wave', 'GoodBye'];
const ARRIVAL_ANIMATIONS = ['IdleEyeBrowRaise', 'IdleFingerTap', 'Explain', 'IdleHeadScratch'];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setupEventListeners(): void {
  document.addEventListener('xp:app-launch', ((
    e: CustomEvent<{ appId: string }>,
  ) => {
    const options = LAUNCH_ANIMATION_MAP[e.detail.appId] ?? ['Explain'];
    playLocked(pickRandom(options));
  }) as EventListener);

  document.addEventListener('xp:close', () => {
    if (!engine.isLocked()) {
      playLocked(pickRandom(CLOSE_ANIMATIONS));
    }
  });

  document.addEventListener('xp:minimize', () => {
    if (!engine.isLocked()) {
      engine.play('LookDown');
    }
  });

  document.addEventListener('xp:maximize', () => {
    if (!engine.isLocked()) {
      engine.play('LookUp');
    }
  });

  document.addEventListener('xp:focus', ((
    e: CustomEvent<{ id: string }>,
  ) => {
    movement.gravitateTo(e.detail.id);
  }) as EventListener);

  document.addEventListener('xp:game-win', () => {
    playLocked('Congratulate');
  });

  document.addEventListener('xp:game-lose', () => {
    playLocked('Alert');
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initClippy(): void {
  const { overlay: el, sprite } = createDOM();
  overlay = el;

  // Hide until spritesheet is preloaded
  overlay.style.visibility = 'hidden';

  engine = new AnimationEngine(sprite);

  // When any animation finishes, return to default and schedule next idle
  engine.setOnAnimationEnd(() => {
    engine.returnToDefault();
    scheduleNextIdle();
  });

  movement = new MovementController(el, () => {
    // On arrival after walking: play a random short animation
    if (!engine.isLocked()) {
      engine.play(pickRandom(ARRIVAL_ANIMATIONS));
    }
  });

  setupDrag();
  setupCursorTracking();
  setupEventListeners();

  // Preload spritesheet, then start with Greeting
  preloadSpritesheet().then(() => {
    overlay.style.visibility = '';
    engine.play('Greeting', { force: true, lock: true });
  });
}
