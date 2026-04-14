/**
 * Decorative — shared module for the iOS 1 icons that don't have a real
 * portfolio implementation behind them (Weather, Stocks, Maps, YouTube).
 *
 * Renders an iOS 1-style alert panel that says "Cannot connect to server"
 * with a single OK button that closes the app. The navigator has already
 * set the nav-bar title from the manifest, so the user sees e.g.
 * "Weather" on top and a consistent alert below regardless of which icon
 * they tapped — exactly like a first-gen iPod Touch with Wi-Fi off.
 */

import { escapeHtml } from '../../../../core/html';
import type { IpodAppModule } from '../types';
import { t } from '../../../../i18n';
import './decorative.css';

const mod: IpodAppModule = {
  mount({ root, host }) {
    root.classList.add('ipod-decorative');
    root.innerHTML = `
      <div class="ipod-decorative__scrim">
        <div class="ipod-decorative__alert" role="alertdialog" aria-modal="true">
          <div class="ipod-decorative__alert-title">${escapeHtml(t('ipod.decorative.alertTitle'))}</div>
          <div class="ipod-decorative__alert-body">
            ${escapeHtml(t('ipod.decorative.alertBody'))}
          </div>
          <button type="button" class="ipod-decorative__alert-ok">${escapeHtml(t('ipod.decorative.ok'))}</button>
        </div>
      </div>
    `;

    const ok = root.querySelector<HTMLButtonElement>('.ipod-decorative__alert-ok')!;
    ok.addEventListener('click', () => host.close());
    // Defer focus so the in-flight slide-up animation doesn't steal it.
    queueMicrotask(() => {
      try {
        ok.focus({ preventScroll: true });
      } catch {
        ok.focus();
      }
    });

    return {
      unmount() {
        root.classList.remove('ipod-decorative');
      },
    };
  },
};

export default mod;
