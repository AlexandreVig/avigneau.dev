# Portfolio Website

The site you're looking at. A Windows XP–themed portfolio built as a tiny
desktop shell — a virtual file system, a window manager, and a shell launcher,
all running in the browser with no framework state management.

## Stack

- **Astro** for the static shell
- **TypeScript** throughout
- **Plain CSS** with CSS variables for theming
- **Cloudflare Pages** for hosting

The app ships as a fully static site — no server, no hydration framework. Everything
that feels "dynamic" (windows, file system, apps) is vanilla DOM and TypeScript
loaded on-demand via Vite's code splitting.

## Virtual file system

Content lives in a declarative tree. Each `FileNode` holds a lazy `load()` —
Vite code-splits each file into its own chunk, so only the content you actually
open gets fetched.

```ts
export interface FileNode {
  kind: 'file';
  name: string;
  ext: string;
  // Only fetched when the file is opened.
  load: () => Promise<string>;
}

// Example entry in tree.ts:
{
  kind: 'file',
  name: 'About Me.md',
  ext: '.md',
  load: () => import('../content/about.md?raw').then((m) => m.default),
}
```

The tree also has `FolderNode` and `ShortcutNode`. Shortcuts resolve to an app
launch rather than a file — used for desktop icons like "My Computer".

## Shell launcher

Every open action — desktop icon double-click, start menu, explorer — routes
through a single `launch()` call. It resolves the path, determines the right app
from the file extension, and hands off to `appHost`.

```ts
export async function launch(req: LaunchRequest): Promise<void> {
  let file: FileHandle | null = null;

  if (req.path) {
    const node = resolve(req.path);
    if (node?.kind === "file") {
      file = await readFile(req.path);
    }
  }

  const appId = req.appId ?? (file ? getFileType(file.ext).defaultAppId : null);
  await appHost.launch({ appId, file, args: req.args });
}
```

## App host

`AppHost` manages the full app lifecycle: dynamic import, instance deduplication,
focus routing, and teardown. Apps register as `AppManifest` entries with a `kind`:

- `singleton` — at most one instance
- `multi` — new window every time (Explorer)
- `document` — one instance per file path (Notepad)

When you open the same file twice, `AppHost` focuses the existing window instead
of mounting a second copy. The instance key is derived from the file path:

```ts
private computeInstanceId(manifest, file, args): string {
  if (manifest.kind === 'singleton') return manifest.id;
  if (manifest.kind === 'multi')     return `${manifest.id}#${++this.multiCounter}`;
  // document: keyed by the file path, so the same file always maps
  // to the same window — opening it again just focuses it.
  return `${manifest.id}:${file?.path ?? args?.path}`;
}
```

## Window manager

Windows are plain DOM nodes appended to `#desktop`. The manager tracks position,
z-index, and minimized/maximized state, and wires drag and edge-resize interactions
without any external library.

Drag works by recording the mouse position on `title-bar` mousedown, then tracking
deltas on `window`. A transparent cover div is injected over the desktop during the
drag to prevent iframe-like content from swallowing mouse events mid-drag.

```ts
el.addEventListener("mousedown", (e) => {
  const titleBar = (e.target as Element).closest(".title-bar");
  if (titleBar && !isButton && !state.isMaximized) {
    isDragging = true;
    document.body.appendChild(cover); // swallow-proof overlay
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
});
```

Cascade placement is automatic — each new window opens 30px below and to the
right of the previous one, cycling after 8.

## Code splitting

Every app and every content file is a separate dynamic import. On first load the
browser fetches only the shell HTML, the desktop CSS, and the entrypoint script.
Opening Notepad fetches the notepad chunk. Opening a markdown file fetches that
file's content chunk. The explorer and the markdown renderer each live in their
own chunk too — nothing loads until you ask for it.

## Source

[github.com/AlexandreVig/avigneau.dev](https://github.com/AlexandreVig/avigneau.dev)
