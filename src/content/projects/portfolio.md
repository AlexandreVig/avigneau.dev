# Portfolio Website

The site you're looking at. Open it on a desktop and you get a Windows XP
environment — draggable windows, a taskbar, a start menu, and Clippy. Open it
on a phone and you get a first-generation iPod Touch. Same URL, two completely
different UIs, zero frameworks.

Built with Astro, plain TypeScript, plain CSS, and deployed on Cloudflare Pages.

---

## The core idea: one page, two shells

Both shells are server-rendered into the same HTML document. A synchronous
script in `<head>` reads the viewport before the first paint and sets a
`data-shell` attribute. CSS instantly hides the losing shell. A module script
then removes its DOM and lazy-imports only the winning shell's JavaScript.

| Viewport | Shell |
|---|---|
| ≥ 769 px wide | Windows XP |
| ≤ 768 px / touch | iPod Touch 1G |

Neither shell's code is downloaded unless the device actually needs it.
The detection lives in two places that must stay in sync: the inline `<script>`
in `BaseLayout.astro` (runs before paint) and the module chooser in
`index.astro` (removes dead DOM, imports the right bootstrap).

---

## Content layer: virtual file system

All content — markdown files, PDFs, project write-ups — lives in a declarative
tree shared by both shells. Each file node carries a lazy `load()` function.
Vite turns every `import(…?raw)` into its own chunk, so a file's content is
only fetched when a user actually opens it.

```ts
{
  kind: 'file',
  name: 'About Me.md',
  ext: '.md',
  load: () => import('../content/about.md?raw').then((m) => m.default),
}
```

The tree has three node kinds: `FileNode`, `FolderNode`, and `ShortcutNode`.
Shortcuts resolve to an app launch instead of a file — used for desktop icons
like "My Computer".

---

## Desktop shell — Windows XP

### Window manager

Windows are plain `<div>` nodes appended to `#desktop`. The manager tracks
position, z-index, and minimized/maximized state entirely in vanilla DOM.

Drag is handled by recording the pointer offset on `mousedown` on the title
bar, then tracking deltas on `window`. A transparent cover div is injected
during the drag to prevent iframes or rich content from swallowing mouse
events mid-move. New windows cascade automatically: each one opens 30 px
below and to the right of the previous, cycling after 8.

```ts
el.addEventListener('mousedown', (e) => {
  const titleBar = (e.target as Element).closest('.title-bar');
  if (titleBar && !isButton && !state.isMaximized) {
    isDragging = true;
    document.body.appendChild(cover); // swallow-proof overlay
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
});
```

### App host and lifecycle

Every app is a dynamic import. Apps declare a `kind` that controls how many
instances can exist:

- **singleton** — at most one instance (Outlook Express, Minesweeper)
- **multi** — new window on every launch (Explorer, Outlook Compose)
- **document** — one instance per file path, re-focused if already open (Notepad, Adobe Reader)

When you try to open the same document twice, `AppHost` focuses the existing
window instead of mounting a second copy. Explorer adds a `findExistingInstance`
override that deduplicates by the folder currently displayed, not the one it
was originally opened at.

### Built-in apps

| App | What it does |
|---|---|
| **Explorer** | Browse the virtual file system |
| **Notepad** | Render `.md` and `.txt` files |
| **Adobe Reader** | Render `.pdf` content |
| **Outlook Express** | Inbox view |
| **Outlook Compose** | Contact form backed by the edge API |
| **Minesweeper** | Fully playable, with a custom LED digit display |
| **BSOD** | Triggered by `.exe` files |
| **About** | Per-app dialog (close button only, no taskbar entry) |

All eight apps ship as separate chunks — none are downloaded until opened.

### Clippy

Clippy is an autonomous agent layered on top of the desktop. It has three
independent subsystems running at once:

**AnimationEngine** — drives a sprite sheet at 15 fps using a JSON animation
table. It distinguishes locked animations (cannot be interrupted), look
animations (cursor-facing), and the idle default.

**MovementController** — Clippy wanders the desktop on its own, picking a
random target within a 350 px radius every 3–6 seconds and CSS-transitioning
to it. Dragging pauses autonomy; releasing resumes it. On arrival it plays a
short reaction animation.

**Event reactions** — Clippy listens to custom DOM events dispatched by the
app host and reacts accordingly:

| Event | Clippy does |
|---|---|
| Open Notepad | `Writing` animation |
| Open Minesweeper | `GetTechy` |
| Close any window | `Wave` or `GoodBye` |
| Win Minesweeper | `Congratulate` |
| 2 min of inactivity | `IdleSnooze` |

Cursor tracking (throttled to 200 ms) makes Clippy face the mouse whenever
it's in its default state.

---

## Mobile shell — iPod Touch 1G

### Navigator

The iPod shell replaces the window manager with a linear navigation stack.
There is exactly one visible screen at a time — home or one open app.

`openApp()` creates a full-screen frame, dynamic-imports the app module, and
starts the slide-up animation in parallel so the frame is already on-screen
by the time the app's `mount()` runs. An `AbortController` is passed to every
app and signalled on `goHome()`, giving apps a clean cancellation hook.
Re-entrancy during an in-flight animation is silently ignored, matching the
behaviour of the original iOS 1.

```ts
// Start animation and load module in parallel.
const entered = frame.playEnter();
const module = await manifest.loader(); // own Vite chunk

await module.default.mount({ root, instanceId, signal: abort.signal, host });
await entered; // frame is now fully on-screen
```

### Apps

The home screen mirrors the original iPod Touch layout: a 4-column icon grid
above a pinned dock of four apps.

| App | Location | What it does |
|---|---|---|
| **Safari** | Dock | Project browser |
| **Mail** | Dock | Contact form |
| **Notes** | Dock | Markdown content viewer |
| **Music** | Dock | Music player |
| **Calculator** | Home grid | Functional calculator |
| **Weather / Stocks / Maps / YouTube** | Home grid | "Cannot connect to server" decorative callbacks |

---

## Shared systems

### i18n

All UI strings go through a typed `t(key, ...args)` helper backed by flat EN
and FR dictionaries. Keys are typed as a union derived from the English map, so
a missing translation is a compile error. The locale is detected from
`navigator.language` on first visit and saved to `localStorage`; switching
reloads the page.

```ts
t('explorer.itemCount', 3) // → "3 items" or "3 éléments"
```

### Contact API

The Outlook Compose and Mail apps post to `/api/contact`, a Cloudflare Pages
Function (the only non-static route in the project). It:

1. Rate-limits by IP via a Cloudflare Rate Limiter binding
2. Validates every field and checks a honeypot
3. Sends the message via the Resend API

---

## What the browser downloads on first load

On a cold visit the browser receives only the page HTML, the active shell's
CSS, and one small entrypoint script. Everything else — app modules, content
files, the markdown renderer, Clippy's sprite sheet — is fetched on demand.
The unused shell's entire JS bundle is never downloaded at all.

---

## Source

[github.com/AlexandreVig/avigneau.dev](https://github.com/AlexandreVig/avigneau.dev)
