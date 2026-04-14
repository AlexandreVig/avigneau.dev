/**
 * iPod Music — purely decorative easter-egg playlist that nods to the
 * "slightly chaotic mix of metal, techno, rap, and hyperpop" line in the
 * about copy. No real audio: tapping a song flips to a Now-Playing
 * screen with a fake album-art block and greyed-out transport controls.
 *
 * The track list lives in `./tracks.ts` so editing the playlist is a
 * data change, not a UI change — this module only renders what it finds.
 */

import type { IpodAppModule } from '../types';
import { PLAYLIST } from './tracks';
import { t } from '../../../../i18n';
import './music.css';

const mod: IpodAppModule = {
  mount({ root, host }) {
    host.setTitle(t('ipod.app.music'));
    root.classList.add('ipod-music');

    const renderList = () => {
      host.setTitle(t('ipod.app.music'));
      root.innerHTML = `
        <ul class="ipod-music__list">
          ${PLAYLIST.map(
            (t, i) => `
              <li class="ipod-music__row" data-idx="${i}">
                <div class="ipod-music__meta">
                  <span class="ipod-music__title">${escape(t.title)}</span>
                  <span class="ipod-music__artist">${escape(t.artist)}</span>
                </div>
                <span class="ipod-music__dur">${t.duration}</span>
              </li>
            `,
          ).join('')}
        </ul>
      `;
      root
        .querySelector<HTMLElement>('.ipod-music__list')!
        .addEventListener('click', (e) => {
          const row = (e.target as Element).closest<HTMLElement>('[data-idx]');
          if (!row) return;
          renderNowPlaying(Number(row.dataset.idx));
        });
    };

    const renderNowPlaying = (idx: number) => {
      const track = PLAYLIST[idx]!;
      host.setTitle(t('ipod.music.nowPlaying'));
      root.innerHTML = `
        <div class="ipod-music__np">
          <button type="button" class="ipod-music__back-to-list">${escape(t('ipod.music.backToList'))}</button>
          <div class="ipod-music__art" aria-hidden="true">♪</div>
          <div class="ipod-music__np-title">${escape(track.title)}</div>
          <div class="ipod-music__np-artist">${escape(track.artist)}</div>
          <div class="ipod-music__scrubber">
            <span>0:00</span>
            <div class="ipod-music__bar"><div class="ipod-music__bar-fill"></div></div>
            <span>${track.duration}</span>
          </div>
          <div class="ipod-music__controls">
            <button type="button" disabled>⏮</button>
            <button type="button" disabled>⏯</button>
            <button type="button" disabled>⏭</button>
          </div>
        </div>
      `;
      root
        .querySelector<HTMLElement>('.ipod-music__back-to-list')!
        .addEventListener('click', renderList);
    };

    renderList();

    return {
      unmount() {
        root.classList.remove('ipod-music');
        root.innerHTML = '';
      },
    };
  },
};

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default mod;
