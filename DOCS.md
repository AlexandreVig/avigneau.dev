# Windows XP Portfolio — Developer Documentation

A Windows XP-themed portfolio built with Astro. The entire desktop is an interactive simulation — icons, windows, taskbar, and start menu — styled to match authentic Windows XP chrome.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [How It All Connects](#how-it-all-connects)
4. [The Event Bus](#the-event-bus)
5. [Window Manager Deep Dive](#window-manager-deep-dive)
6. [Styling System](#styling-system)
7. [Component Reference](#component-reference)
8. [How to Add a New App](#how-to-add-a-new-app)
9. [How to Extend Each Part](#how-to-extend-each-part)
10. [Roadmap / Next Steps](#roadmap--next-steps)

---

## Architecture Overview

### Design Philosophy

- **Astro-first**: Static HTML + minimal client-side JS. No React, no framework runtime.
- **No UI libraries**: All XP styling is hand-crafted CSS. We removed `xp.css` because it forced workarounds.
- **Vanilla DOM**: The window manager is a plain TS class that manipulates the DOM directly. No virtual DOM, no reconciliation.
- **Custom events as message bus**: Components communicate via `document.dispatchEvent(new CustomEvent('xp:...'))`. This keeps components decoupled — the Start Menu doesn't need to know about the Window Manager, it just fires `xp:open`.
- **CSS custom properties for theming**: All XP colors live in `variables.css`. Changing the palette is a one-file edit.

### Runtime Flow

```
┌─────────────────────────────────────────────────────────┐
│  User clicks Desktop Icon (double-click)                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              document.dispatchEvent(
                'xp:open', { id: 'about' }
              )
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  index.astro <script> listener                          │
│  → windowManager.open('about')                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  WindowManager:                                         │
│   1. Update state.isOpen = true                         │
│   2. applyState() — DOM: display, transform, z-index    │
│   3. focus() — set classes, bump z-counter              │
│   4. syncTaskbar() — dispatch xp:taskbar-update         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Taskbar listens to xp:taskbar-update                   │
│  → re-renders window buttons                            │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
computer-portfolio/
├── public/
│   ├── icons/              ← Authentic XP PNG icons (copied from winXP reference)
│   │   ├── start.png       ← Start button sprite
│   │   ├── user.png        ← User avatar (start menu header)
│   │   ├── folder.png, folder-32.png
│   │   ├── notepad.png, mail.png, my-computer.png
│   │   ├── sound.png, usb.png, shield.png (system tray)
│   │   ├── logoff.png, shutdown.png
│   │   └── control-panel.png, search.png, help.png, connect.png
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── Desktop.astro       ← Desktop container, renders icons + windows
│   │   ├── DesktopIcon.astro   ← Individual icon with click/double-click logic
│   │   ├── Window.astro        ← Window frame + title bar + controls
│   │   ├── Taskbar.astro       ← Bottom taskbar (start, window btns, clock)
│   │   └── StartMenu.astro     ← Start menu popup
│   │
│   ├── config/
│   │   └── apps.ts             ← Single source of truth for apps list
│   │
│   ├── lib/
│   │   ├── types.ts            ← TypeScript interfaces
│   │   └── windowManager.ts    ← Singleton that manages all window state
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro    ← HTML shell, imports global.css, renders Taskbar + StartMenu
│   │
│   ├── pages/
│   │   └── index.astro         ← Entry point, wires event bus to windowManager
│   │
│   └── styles/
│       ├── global.css          ← @import hub
│       ├── variables.css       ← XP color palette (CSS custom properties)
│       ├── reset.css           ← Minimal reset + body defaults
│       ├── desktop.css         ← Desktop, icons grid, icon styles
│       ├── window.css          ← Window frame, title bar, header buttons
│       ├── taskbar.css         ← Taskbar, window buttons, system tray
│       └── start-menu.css      ← Start menu header, panes, footer
│
├── astro.config.mjs            ← Astro + Cloudflare adapter config
├── package.json                ← Only deps: astro, @astrojs/cloudflare
├── tsconfig.json               ← Strict TS config
└── winXP/                      ← REFERENCE ONLY — cloned React WinXP clone, not built
```

---

## How It All Connects

### 1. Page boots (`index.astro`)

```ts
document.addEventListener('DOMContentLoaded', () => {
  apps.forEach((app) => windowManager.register(app));  // Register every app

  // Wire event bus → window manager
  document.addEventListener('xp:open',     (e) => windowManager.open(e.detail.id));
  document.addEventListener('xp:close',    (e) => windowManager.close(e.detail.id));
  // ...etc
});
```

Every app from `apps.ts` is registered with the `WindowManager`. Registration:
- Creates a `WindowState` object with default position (cascade offset)
- Finds the corresponding `[data-window-id="..."]` DOM element (pre-rendered by `Desktop.astro`)
- Applies initial state (hidden, correct size)
- Sets up drag/resize interaction listeners

### 2. Desktop renders all windows upfront (`Desktop.astro`)

```astro
{apps.map((app) => (
  <Window id={app.id} title={app.title} icon={app.icon} ...>
    <div class="placeholder-content">...</div>
  </Window>
))}
```

**Important**: All windows are rendered in the HTML from the start. They're just `display: none` until opened. This avoids the complexity of dynamic insertion and allows CSS transitions.

### 3. User double-clicks an icon (`DesktopIcon.astro`)

```ts
icon.addEventListener('click', () => {
  if (clickTimer) {
    // Second click within 400ms = double-click
    const id = icon.dataset.openWindow!;
    document.dispatchEvent(new CustomEvent('xp:open', { detail: { id } }));
  } else {
    clickTimer = setTimeout(() => { clickTimer = null; }, 400);
  }
});
```

The icon fires `xp:open`. It doesn't know or care who's listening — the event bus decouples the sender from the receiver.

### 4. Window Manager reacts

`windowManager.open(id)` →  marks state as open → calls `applyState()` which sets `display: flex` and applies size/position → calls `focus()` which brings it to front → calls `syncTaskbar()` which fires `xp:taskbar-update`.

### 5. Taskbar re-renders (`Taskbar.astro`)

The taskbar listens for `xp:taskbar-update` and rebuilds its window button list from the event payload. One button per open window.

---

## The Event Bus

All cross-component communication happens via custom events on `document`. This is the **single most important pattern** in the codebase.

### Event Types (`types.ts`)

| Event | Payload | Who fires it | Who handles it |
|-------|---------|-------------|----------------|
| `xp:open` | `{ id }` | DesktopIcon, StartMenu | `index.astro` → `windowManager.open()` |
| `xp:close` | `{ id }` | Window close btn | `windowManager.close()` |
| `xp:minimize` | `{ id }` | Window min btn, Taskbar btn | `windowManager.minimize()` |
| `xp:maximize` | `{ id }` | Window max btn, dblclick title bar | `windowManager.maximize()` |
| `xp:restore` | `{ id }` | Taskbar btn (on minimized) | `windowManager.restore()` |
| `xp:focus` | `{ id }` | Taskbar btn click | `windowManager.focus()` |
| `xp:taskbar-update` | `{ windows, focusedId }` | `windowManager.syncTaskbar()` | Taskbar re-renders |

### Why Custom Events?

- **Zero coupling**: DesktopIcon doesn't import windowManager. StartMenu doesn't import anything. They just dispatch events.
- **Works across Astro script boundaries**: Each `<script>` block is isolated, but they all share the `document` object.
- **Easy to debug**: Add a single `document.addEventListener('xp:*', console.log)` and see every event.
- **Extensible**: New components can listen or fire events without touching existing code.

### Firing an event

```ts
document.dispatchEvent(new CustomEvent('xp:open', { detail: { id: 'about' } }));
```

### Listening for an event

```ts
document.addEventListener('xp:open', (e) => {
  const { id } = (e as CustomEvent).detail;
  // handle
});
```

---

## Window Manager Deep Dive

`src/lib/windowManager.ts` is the brain. It's a singleton class exported as `windowManager`.

### State

Each window has a `WindowState` object:

```ts
interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;           // Exists in the DOM and can be focused
  isMinimized: boolean;      // Hidden but still "open" (shows in taskbar)
  isMaximized: boolean;      // Fullscreen
  zIndex: number;
  x: number; y: number;      // Position
  width: number; height: number;
  savedRect?: { x, y, width, height };  // Pre-maximize rect for restore
  openedAt?: number;          // For taskbar button ordering
}
```

All states live in `this.windows: Map<string, WindowState>`.

### Lifecycle Methods

| Method | What it does |
|--------|--------------|
| `register(config)` | Create initial state, find DOM el, apply state, set up interaction |
| `open(id)` | `isOpen = true`, apply state, focus, sync taskbar |
| `close(id)` | `isOpen = false`, clear classes, sync taskbar |
| `minimize(id)` | `isMinimized = true`, hide, clear focus, sync |
| `restore(id)` | `isMinimized = false`, show, focus, sync |
| `maximize(id)` | Toggle maximized state. Save/restore `savedRect` |
| `focus(id)` | Bump z-counter, set `.is-focused` on target, `.is-unfocused` on others |

### The `applyState` method

This is the sole DOM mutation point. It reads state and writes to the DOM:

```ts
private applyState(id: string): void {
  const state = this.windows.get(id);
  const el = this.getElement(id);
  if (!state || !el) return;

  const visible = state.isOpen && !state.isMinimized;

  el.style.display = visible ? 'flex' : 'none';
  el.style.width = `${state.width}px`;
  el.style.height = `${state.height}px`;
  el.style.transform = `translate(${state.x}px, ${state.y}px)`;
  el.style.zIndex = String(state.zIndex);

  el.classList.toggle('is-maximized', state.isMaximized);
  el.setAttribute('aria-hidden', String(!visible));
}
```

**Why `transform: translate()` instead of `left`/`top`?** Performance. Transforms are GPU-accelerated and don't trigger layout.

### The Maximize Trick

```ts
maximize(id: string): void {
  // ...
  state.x = -3;
  state.y = -3;
  state.width = desktopWidth + 6;
  state.height = desktopHeight + 6;
  state.isMaximized = true;
}
```

The `-3` offset extends the window 3px beyond every edge. Combined with `.is-maximized { border-radius: 0 }`, this hides the rounded corners at the edges — matching authentic XP maximize behavior where maximized windows look "flat" against the screen edges.

### Drag & Resize (`setupInteraction`)

This is the most complex part of the window manager. It replaces what used to be the `interact.js` library with ~150 lines of vanilla TS.

**Key concepts:**

1. **Cursor position detection**: On `mousemove`, calculate whether the cursor is within `RESIZE_THRESHOLD` (10px) of any edge or corner. Map to one of 8 positions: `top`, `topRight`, `right`, `bottomRight`, `bottom`, `bottomLeft`, `left`, `topLeft`.

2. **Cursor style**: Set `el.style.cursor` to match (`n-resize`, `ne-resize`, etc.).

3. **Mousedown routing**: On mousedown, if the target is the title bar → start drag. If the target is the window itself and a cursor position is set → start resize.

4. **The "cover div" pattern**: During drag/resize, a fullscreen invisible `<div>` is appended to `<body>`. This captures mouse events even when the cursor leaves the window (e.g., moves faster than the window can follow). Without this, dragging breaks when the cursor overshoots.

5. **State origin tracking**: `originMouseX/Y` and `startX/Y/W/H` are captured at mousedown. On mousemove, we compute the delta from the origin, not the previous frame — this avoids drift.

6. **Resize math**: Each direction calculates new x/y/w/h:
   - Right: `width = startW + dx`
   - Left: `width = startW - dx`, `x = startX + (startW - width)` (right edge stays put)
   - Bottom: `height = startH + dy`
   - Top: similar to left but for y/height
   - Corners combine two axes
   - Min size enforced via `Math.max(MIN_WIDTH, ...)`

### Taskbar Sync

```ts
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
```

Called after every state change that affects the taskbar (open, close, minimize, focus). Windows are sorted by `openedAt` so button order is stable (new windows append to the right).

---

## Styling System

All styles live in `src/styles/`. `global.css` is an `@import` hub — Astro bundles them all into one stylesheet.

### Files

| File | Purpose |
|------|---------|
| `variables.css` | CSS custom properties for colors & gradients |
| `reset.css` | Box-sizing, body defaults, `user-select: none` |
| `desktop.css` | Desktop container, icons grid, icon styles |
| `window.css` | Window frame, title bar, header buttons |
| `taskbar.css` | Taskbar shell, window buttons, system tray |
| `start-menu.css` | Start menu header, panes, footer |

### The Color Variables (`variables.css`)

```css
:root {
  --xp-frame-focused: #0831d9;
  --xp-frame-unfocused: #6582f5;
  --xp-title-focused: linear-gradient(to bottom, #0058ee 0%, ...);
  --xp-title-unfocused: linear-gradient(to bottom, #7697e7 0%, ...);
  --xp-btn-blue: radial-gradient(...);
  --xp-btn-close: radial-gradient(...);
  --xp-taskbar: linear-gradient(...);
  --xp-tray: linear-gradient(...);
  --xp-font: Tahoma, 'Noto Sans', sans-serif;
}
```

**Critical detail**: The title bar gradients are 13-15 color stops. This isn't arbitrary — it's what gives the title bar its authentic XP "glossy" look. A 2-stop gradient looks cheap; 15 stops reproduce the exact curvature of the original.

### The `header__bg` Pattern (`window.css`)

XP title bars have a subtle left and right edge shine. We reproduce it with a dedicated `<div class="header__bg">` that sits absolutely positioned behind the title bar content:

```css
.header__bg {
  background: var(--xp-title-focused);
  position: absolute;
  left: 0; top: 0; right: 0;
  height: 28px;
  pointer-events: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  overflow: hidden;
}

.header__bg::before {
  /* Left edge shine */
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 15px;
  background: linear-gradient(to right, #1638e6 0%, transparent 100%);
}

.header__bg::after {
  /* Right edge shine */
  width: 15px;
  background: linear-gradient(to left, #1638e6 0%, transparent 100%);
}
```

The actual title bar content (`.title-bar`) sits *on top* with `position: relative; z-index: 1`.

**Why this pattern?** Because `::before`/`::after` on the title bar itself would conflict with the title bar's own layout. Separating the background into its own element lets us use pseudo-elements freely for the shine effect.

### Focused vs Unfocused

Switching is done by toggling `.is-focused` / `.is-unfocused` on the `.window` element:

```css
.window { background-color: var(--xp-frame-focused); }
.window.is-unfocused { background-color: var(--xp-frame-unfocused); }

.header__bg { background: var(--xp-title-focused); }
.window.is-unfocused .header__bg { background: var(--xp-title-unfocused); }

.window.is-unfocused .title-bar-controls { opacity: 0.6; }
```

All state changes cascade from a single class toggle — no JS style manipulation needed.

### Header Buttons (min/max/close)

The buttons are drawn entirely with CSS — no images. Each uses a radial gradient background plus pseudo-elements for the icon:

```css
/* Minimize: underscore at bottom */
.title-bar-controls button[aria-label="Minimize"] {
  background-image: var(--xp-btn-blue);  /* radial gradient */
  box-shadow: inset 0 -1px 2px 1px #4646ff;
}
.title-bar-controls button[aria-label="Minimize"]::before {
  content: '';
  position: absolute;
  left: 4px; top: 13px;
  width: 8px; height: 3px;
  background: white;
}

/* Close: orange gradient + rotated X */
.title-bar-controls button[aria-label="Close"] {
  background-image: var(--xp-btn-close);  /* orange radial */
}
.title-bar-controls button[aria-label="Close"]::before,
.title-bar-controls button[aria-label="Close"]::after {
  content: '';
  position: absolute;
  width: 2px; height: 16px;
  background: white;
  left: 9px; top: 2px;
}
.title-bar-controls button[aria-label="Close"]::before { transform: rotate(45deg); }
.title-bar-controls button[aria-label="Close"]::after  { transform: rotate(-45deg); }
```

The "maximized" state swaps maximize for a "restore" icon (two overlapping squares) by re-styling `::before` and adding `::after`.

### Taskbar Button Shine (`taskbar.css`)

The white corner shine on inactive taskbar buttons:

```css
.taskbar-win-btn::before {
  position: absolute;
  left: -2px; top: -2px;
  width: 10px; height: 1px;
  border-bottom-right-radius: 50%;
  box-shadow: 2px 2px 3px rgba(255, 255, 255, 0.5);
}
```

A 10x1 pixel element with a bottom-right border radius creates a rounded corner, and the box-shadow projects the shine. Removed for `.is-active` (focused) buttons.

---

## Component Reference

### `Desktop.astro`
**Purpose**: Container for the desktop area. Renders the icon grid and pre-renders all window shells.

**Key pattern**: Maps over `apps` twice — once for icons, once for windows. Windows are hidden until opened.

### `DesktopIcon.astro`
**Purpose**: Individual clickable icon.

**State**: Uses inline script for single-click (select) vs double-click (open) detection via a 400ms timer.

**Events fired**: `xp:open`

**Classes**:
- `.desktop-icon` — base
- `.is-selected` — blue label highlight, icon tinted

### `Window.astro`
**Purpose**: Window shell with title bar, controls, and body slot.

**Structure**:
```astro
<div class="window" data-window-id={id}>
  <div class="header__bg"></div>           <!-- Gradient layer -->
  <div class="title-bar">                  <!-- Content layer -->
    <img class="title-bar-icon" />
    <div class="title-bar-text" />
    <div class="title-bar-controls">
      <button aria-label="Minimize" />
      <button aria-label="Maximize" />
      <button aria-label="Close" />
    </div>
  </div>
  <div class="window-body"><slot /></div>
</div>
```

**Events fired**: `xp:minimize`, `xp:maximize`, `xp:close` (via buttons), `xp:maximize` (via dblclick title bar)

**Classes**: `.is-focused`, `.is-unfocused`, `.is-maximized`

### `Taskbar.astro`
**Purpose**: Bottom bar with start button, window buttons, system tray, clock.

**Structure**:
```astro
<div id="taskbar">
  <div class="taskbar__left">
    <div id="taskbar-start"><img src="/icons/start.png" /></div>
    <div id="taskbar-windows"></div>  <!-- Populated by JS -->
  </div>
  <div class="taskbar__right">
    <img src="sound.png" />
    <img src="usb.png" />
    <img src="shield.png" />
    <span id="taskbar-clock"></span>
  </div>
</div>
```

**Events listened**: `xp:taskbar-update` (to rebuild window buttons)

**Events fired**: `xp:minimize`, `xp:restore`, `xp:focus` (depending on button state)

### `StartMenu.astro`
**Purpose**: Start menu popup.

**Structure**: header (avatar + username) + body (left pane with apps, right pane with XP items) + footer (log off / turn off).

**Events fired**: `xp:open` (when clicking an app in the left pane)

**Classes**:
- `.start-menu` — base (hidden)
- `.is-open` — visible

**Open/close logic**: Inline script toggles `.is-open` on start button mousedown, and closes on any outside click.

---

## How to Add a New App

1. **Add an entry in `src/config/apps.ts`**:

```ts
export const apps: AppConfig[] = [
  // ...existing apps
  {
    id: 'resume',               // Unique ID — becomes data-window-id
    title: 'Resume',
    icon: '/icons/notepad.png', // Path to icon in /public/
    defaultWidth: 500,
    defaultHeight: 400,
    defaultX: 100,              // Optional — omit for auto-cascade
    defaultY: 100,
  },
];
```

2. **Done.** The new app will automatically:
   - Appear as a desktop icon (via `Desktop.astro` mapping)
   - Appear in the Start Menu left pane (via `StartMenu.astro` mapping)
   - Get registered with `WindowManager` on page load
   - Be draggable, resizable, minimizable, maximizable

### Custom Content Per App

Currently `Desktop.astro` renders a generic `placeholder-content` div in every window. To have real content per app, refactor like this:

```astro
---
import AboutApp from './apps/AboutApp.astro';
import ProjectsApp from './apps/ProjectsApp.astro';
// ...

const appComponents = {
  about: AboutApp,
  projects: ProjectsApp,
  // ...
};
---

{apps.map((app) => {
  const Component = appComponents[app.id];
  return (
    <Window id={app.id} ...>
      {Component ? <Component /> : <div>Default content</div>}
    </Window>
  );
})}
```

Then create `src/components/apps/AboutApp.astro` etc. Each is a self-contained Astro component that renders inside the window-body slot.

### Custom Icon

Place a PNG in `public/icons/` and reference it in `apps.ts`. Authentic XP icons are available in `winXP/src/assets/windowsIcons/` — copy the ones you need.

---

## How to Extend Each Part

### Add a new event type

1. Add it to the `XpEventName` union in `types.ts`.
2. Dispatch it from wherever: `document.dispatchEvent(new CustomEvent('xp:myevent', { detail: { ... } }))`
3. Listen for it in `index.astro` and route it: `document.addEventListener('xp:myevent', (e) => windowManager.myMethod(e.detail));`
4. If the handler lives in `windowManager`, add the method there.

### Add a new window control (e.g., pin/unpin)

1. Add the button to `Window.astro`:
```astro
<button aria-label="Pin" data-action="pin" data-window-target={id}></button>
```
2. The existing click delegator in `Window.astro`'s script block will automatically fire `xp:pin`.
3. Add a listener in `index.astro` and a `pin()` method on `windowManager`.
4. Style it in `window.css` using the `[aria-label="Pin"]` selector, following the minimize/close pattern (radial gradient + pseudo-element icon).

### Add a boot screen

1. Create `src/components/BootScreen.astro` with a fullscreen overlay styled like the XP boot animation.
2. Render it in `BaseLayout.astro` above the `#desktop-shell`.
3. Add a script that removes it after a delay or on click.

### Add right-click context menu

1. Create `src/components/ContextMenu.astro` — a hidden `<ul>` with menu items.
2. Add a listener on `#desktop` for `contextmenu` events: `e.preventDefault()`, position the menu at `e.clientX/Y`, show it.
3. Close on any other click.

### Add a wallpaper

Drop an image at `public/wallpaper.jpg`. It's already referenced in `desktop.css` — will appear automatically.

### Full start menu (dual-pane, All Programs, etc.)

The existing `StartMenu.astro` is already structured with `.start-menu__left` and `.start-menu__right` panes. To expand:

1. Add more items to the left pane (pinned programs, recent programs, "All Programs" entry).
2. Right pane already has decorative items — make them functional by dispatching events.
3. For "All Programs" submenu, add a nested `<div>` that appears on hover, styled similarly.
4. Reference: `winXP/src/WinXP/Footer/FooterMenu.js` has the complete layout.

### Desktop icon selection marquee (DashedBox)

1. On `mousedown` on `#desktop` background (not on an icon), record the start position.
2. On `mousemove`, render a `1px dotted gray` bordered div between start and current position.
3. On `mouseup`, check which icons' bounding rects intersect the box, mark them selected.
4. Remove the box on `mouseup`.
5. Reference: `winXP/src/components/DashedBox/index.js` (only ~29 lines).

### Power-off animation

1. Add a `powerOff()` method to `windowManager` or a new `systemManager`.
2. Apply `filter: brightness(0.6) grayscale(1)` to `#desktop-shell` via keyframes over 5s.
3. Show a modal dialog for confirmation before triggering.

---

## Roadmap / Next Steps

**Core features not yet implemented:**
- Real content for each app (About, Projects, Skills, Contact) — currently placeholder divs
- Right-click context menu on desktop (New, Refresh, Properties...)
- Desktop icon multi-select with dashed marquee
- Boot screen / loading animation
- XP Bliss wallpaper

**Nice-to-haves:**
- Recycle Bin easter egg
- Balloon tooltip in system tray ("Your computer might be at risk")
- Power-off modal with grayscale animation
- Sound effects (error.wav, etc.)
- Terminal app with easter eggs
- Minesweeper (can port from `winXP/src/WinXP/apps/Minesweeper/`)
- Mobile fallback (currently desktop-only)

**Architectural improvements:**
- Per-app content components (instead of generic placeholder)
- Window transitions (fade-in/out, minimize animation)
- Keyboard shortcuts (Alt+F4 to close, Alt+Tab to cycle, etc.)
- Persist window positions to localStorage
- Dynamic app loading (not all pre-rendered)

---

## Reference: The `winXP/` Directory

The `winXP/` folder is a cloned React-based Windows XP replica. **It is not built or deployed** — it exists purely as a visual and code reference.

Useful things to grep:
- **Exact gradient values**: `winXP/src/WinXP/Windows/index.js`, `winXP/src/WinXP/Footer/index.js`, `winXP/src/WinXP/Footer/FooterMenu.js`
- **Button pseudo-element tricks**: `winXP/src/WinXP/Windows/HeaderButtons.js`
- **8-directional resize logic**: `winXP/src/hooks/useElementResize.js` (ported to `src/lib/windowManager.ts`)
- **Authentic XP icons**: `winXP/src/assets/windowsIcons/` (~100 PNGs)
- **Start menu layout**: `winXP/src/WinXP/Footer/FooterMenu.js`
- **Minesweeper implementation**: `winXP/src/WinXP/apps/Minesweeper/`
- **App window patterns**: `winXP/src/WinXP/apps/` (Notepad, IE, MyComputer, Paint)

---

## Quick Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build for production (Cloudflare Pages)
npm run preview   # Preview production build
```

No linter or test suite configured yet.
