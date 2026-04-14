/**
 * iPod Notes — two-screen note browser over the shared markdown files
 * in `src/content/`. Lands on a list of all notes, tapping a row opens
 * that note as a legal-pad page with an in-header Notes button back to
 * the list.
 *
 * The note list lives in `./notes-list.ts` so adding a new note is a
 * content edit, not a UI edit — this module only renders what it finds.
 */

import type { IpodAppModule } from '../types';
import { renderMarkdown } from '../../lib/markdown';
import { NOTES, type Note } from './notes-list';
import { t } from '../../../../i18n';
import './notes.css';

const mod: IpodAppModule = {
  mount({ root, host, signal }) {
    host.setTitle(t('ipod.app.notes'));
    root.classList.add('ipod-notes');

    root.innerHTML = `<div class="ipod-notes__screen" id="ipod-notes-screen"></div>`;
    const screen = root.querySelector<HTMLElement>('#ipod-notes-screen')!;

    const escape = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const renderList = () => {
      host.setTitle(t('ipod.app.notes'));
      screen.scrollTop = 0;
      screen.innerHTML = `
        <ul class="ipod-notes__list">
          ${NOTES.map(
            (n) => `
              <li class="ipod-notes__list-row" data-note-id="${escape(n.id)}">
                <div class="ipod-notes__list-meta">
                  <div class="ipod-notes__list-title">${escape(n.title)}</div>
                  <div class="ipod-notes__list-snippet">${escape(n.snippet)}</div>
                </div>
                <div class="ipod-notes__list-chev" aria-hidden="true">›</div>
              </li>
            `,
          ).join('')}
        </ul>
      `;

      const list = screen.querySelector<HTMLElement>('.ipod-notes__list')!;
      list.addEventListener(
        'click',
        (e) => {
          const row = (e.target as Element).closest<HTMLElement>(
            '[data-note-id]',
          );
          if (!row) return;
          const note = NOTES.find((n) => n.id === row.dataset.noteId);
          if (note) void renderNote(note);
        },
        { signal },
      );
    };

    const renderNote = async (note: Note) => {
      host.setTitle(note.title);
      screen.scrollTop = 0;
      screen.innerHTML = `
        <div class="ipod-notes__page">
          <button type="button" class="ipod-notes__back">${escape(t('ipod.notes.back'))}</button>
          <div class="ipod-notes__header">${escape(note.title)}</div>
          <div class="ipod-notes__body" aria-live="polite">${escape(t('ipod.common.loading'))}</div>
        </div>
      `;

      screen
        .querySelector<HTMLButtonElement>('.ipod-notes__back')!
        .addEventListener('click', () => renderList(), { signal });

      const body = screen.querySelector<HTMLElement>('.ipod-notes__body')!;

      try {
        const source = await note.load();
        if (signal.aborted) return;
        // Strip the first H1 — the page header already shows the title,
        // so a leading "# About Me" would be a duplicate.
        const trimmed = source.replace(/^#\s+.*\n+/, '');
        body.innerHTML = await renderMarkdown(trimmed);
      } catch (err) {
        if (signal.aborted) return;
        console.error(`[ipod/notes] failed to load "${note.id}"`, err);
        body.textContent = t('ipod.common.loadFailed');
      }
    };

    renderList();

    return {
      unmount() {
        root.classList.remove('ipod-notes');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
