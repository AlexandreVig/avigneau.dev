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

import type { IpodAppModule } from '../types';
import { t } from '../../../../i18n';
import './decorative.css';

const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const mod: IpodAppModule = {
  mount({ root, host }) {
    root.classList.add('ipod-decorative');
    root.innerHTML = `
      <div class="ipod-decorative__scrim">
        <div class="ipod-decorative__alert" role="alertdialog" aria-modal="true">
          <div class="ipod-decorative__alert-title">${escape(t('ipod.decorative.alertTitle'))}</div>
          <div class="ipod-decorative__alert-body">
            ${escape(t('ipod.decorative.alertBody'))}
          </div>
          <button type="button" class="ipod-decorative__alert-ok">${escape(t('ipod.decorative.ok'))}</button>
        </div>
      </div>
    `;

    const ok = root.querySelector<HTMLButtonElement>(
      '.ipod-decorative__alert-ok',
    )!;
    ok.addEventListener('click', () => host.close());
    // Defer focus so the in-flight slide-up animation doesn't steal it.
    queueMicrotask(() => ok.focus());

    return {
      unmount() {
        root.classList.remove('ipod-decorative');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
