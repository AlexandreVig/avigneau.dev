/**
 * iPod shell bootstrap.
 *
 * Mirror of `shells/desktop/bootstrap.ts`: exports a single `mount()`
 * function that wires the iPod shell's runtime. Called from
 * `src/pages/index.astro` after the shell chooser picks this shell, via
 * dynamic import so the desktop shell's JS never loads on mobile.
 *
 * Step 4 scaffold: registers the global `ipod:launch` event handler that
 * the (Step 5) icon grid / dock will dispatch, routes it to the navigator,
 * and logs mount for verification. Real home-screen rendering, app mounting,
 * and animations land in Steps 5–7.
 */

import { ipodApps } from './apps/registry';
import { ipodNavigator } from './lib/navigator';
import { getLocale, t } from '../../i18n';

interface IpodLaunchDetail {
  appId: string;
}

/**
 * Initialize the iPod shell. Safe to call whether the DOM is still loading
 * or already ready — defers until `DOMContentLoaded` if needed.
 */
export function mount(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}

function init(): void {
  const shellRoot = document.getElementById('ipod-shell');
  if (shellRoot) patchI18n(shellRoot);

  startClock();

  // Delegated tap handler: any element in the shell with `data-app-id`
  // (home-screen icons, dock icons) dispatches an `ipod:launch` event.
  // Keeping this decoupled from the components means the grid/dock stay
  // pure presentation and future surfaces (spotlight, etc.) get the
  // same wiring for free.
  shellRoot?.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    const btn = target?.closest<HTMLElement>('[data-app-id]');
    if (!btn) return;
    const appId = btn.dataset.appId;
    if (!appId) return;
    document.dispatchEvent(new CustomEvent<IpodLaunchDetail>('ipod:launch', { detail: { appId } }));
  });

  // Icon tap → navigator.openApp. Listener is live even though the
  // navigator's openApp is still a Step 7 stub; right now a tap will log
  // a warning from the navigator instead of mounting an app.
  document.addEventListener('ipod:launch', (e) => {
    const { appId } = (e as CustomEvent<IpodLaunchDetail>).detail;
    const manifest = ipodApps.find((a) => a.id === appId);
    if (!manifest) {
      console.warn(`[ipod] unknown appId "${appId}"`);
      return;
    }
    ipodNavigator.openApp(manifest);
  });

  console.info(
    `[ipod] shell mounted (${ipodApps.length} app${ipodApps.length === 1 ? '' : 's'} registered)`,
  );
}

/**
 * Walk a subtree, replacing every `[data-i18n]` element's text (and
 * `aria-label`, if present) with the translation for its key. Used once
 * at mount to fix up the SSR'd English labels emitted by IconGrid/Dock.
 */
function patchI18n(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    const value = t(key as Parameters<typeof t>[0]);

    // Only replace visible text for leaf elements.
    // Some components (e.g. app icons) put `data-i18n` on a container
    // element that also contains children like <img>; clobbering
    // `textContent` would wipe those nodes.
    if (el.childElementCount === 0) el.textContent = value;
    if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', value);
  });
}

/**
 * Update the status-bar clock to the current local time and schedule the
 * next tick precisely on the following minute boundary. Aligning to the
 * wall clock instead of a fixed `setInterval(60000)` avoids drift and the
 * ugly case where the minute visually flips 30s late on repeated visits.
 *
 * French locale renders 24h time; English keeps the iOS 1 12h AM/PM format.
 */
function startClock(): void {
  const el = document.getElementById('ipod-clock');
  if (!el) return;

  const isFr = getLocale() === 'fr';

  const tick = () => {
    const now = new Date();
    const h24 = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');

    if (isFr) {
      el.textContent = `${h24}:${m}`;
    } else {
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      el.textContent = `${h12}:${m} ${ampm}`;
    }

    // Schedule the next tick for the start of the next wall-clock minute.
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    window.setTimeout(tick, msUntilNextMinute);
  };

  tick();
}
