/**
 * Desktop shell bootstrap.
 *
 * Exports a single `mount()` function that wires the Windows XP desktop
 * runtime: app host lifecycle, window-manager event routing, title-bar
 * interactions, Clippy, and the initial About Me launch.
 *
 * Called from `src/pages/index.astro` after shell selection. Kept as a plain
 * TypeScript module (rather than an inline Astro script) so the iPod shell's
 * sibling bootstrap can live alongside it and so `index.astro` can
 * dynamically import only the shell it needs.
 */

import { appHost } from "./apps/host";
import { apps } from "./apps/registry";
import { initClippy } from "./lib/clippy/clippy";
import { launch } from "./lib/launcher";
import { windowManager } from "./lib/windowManager";

interface LaunchEventDetail {
  appId?: string;
  path?: string;
  args?: Record<string, unknown>;
}

/** Default About Me window dimensions — matches notepad manifest. */
const ABOUT_ME_WIDTH = 560;
const ABOUT_ME_HEIGHT = 440;

/**
 * Initialize the desktop shell. Safe to call whether the DOM is still
 * loading or already ready — it defers until DOMContentLoaded if needed.
 */
export function mount(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

function init(): void {
  // Wire the app content lifecycle.
  appHost.init(apps);

  // Clippy assistant.
  initClippy();

  // Shell launcher entry point — every opening action flows through here.
  document.addEventListener("xp:launch", (e) => {
    const detail = (e as CustomEvent<LaunchEventDetail>).detail;
    void launch(detail);
  });

  // Window manager event routing (instance-id keyed).
  // Note: xp:close is handled by appHost, which calls windowManager.destroy.
  document.addEventListener("xp:minimize", (e) =>
    windowManager.minimize((e as CustomEvent).detail.id),
  );
  document.addEventListener("xp:maximize", (e) =>
    windowManager.maximize((e as CustomEvent).detail.id),
  );
  document.addEventListener("xp:restore", (e) =>
    windowManager.restore((e as CustomEvent).detail.id),
  );
  document.addEventListener("xp:focus", (e) =>
    windowManager.focus((e as CustomEvent).detail.id),
  );

  // Title-bar button delegation (previously lived inside Window.astro).
  document.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest<HTMLElement>(
      "[data-action][data-window-target]",
    );
    if (!btn) return;
    const action = btn.dataset.action as string;
    const id = btn.dataset.windowTarget as string;
    document.dispatchEvent(
      new CustomEvent(`xp:${action}`, { detail: { id } }),
    );
  });

  // Double-click title bar → toggle maximize (only for resizable windows).
  document.addEventListener("dblclick", (e) => {
    const titleBar = (e.target as Element).closest<HTMLElement>(".title-bar");
    if (!titleBar) return;
    if ((e.target as Element).closest(".title-bar-controls")) return;
    if ((e.target as Element).closest(".title-bar-icon")) return;
    const win = titleBar.closest<HTMLElement>("[data-window-id]");
    if (!win) return;
    if (win.dataset.resizable === "false") return;
    const id = win.dataset.windowId!;
    document.dispatchEvent(new CustomEvent("xp:maximize", { detail: { id } }));
  });

  // Open About Me on startup, centered on screen.
  const desktop = document.getElementById("desktop-area");
  const dw = desktop?.clientWidth ?? window.innerWidth;
  const dh = desktop?.clientHeight ?? window.innerHeight;
  void launch({
    path: "/Desktop/About Me.md",
    args: {
      x: Math.round((dw - ABOUT_ME_WIDTH) / 2),
      y: Math.round((dh - ABOUT_ME_HEIGHT) / 2),
    },
  });
}
