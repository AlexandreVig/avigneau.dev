/**
 * iPod Notes — two-screen note browser over the shared markdown files
 * in `src/content/`. Lands on a list of all notes, tapping a row opens
 * that note as a legal-pad page with an in-header Notes button back to
 * the list.
 *
 * The note list lives in `./notes-list.ts` so adding a new note is a
 * content edit, not a UI edit — this module only renders what it finds.
 */

import { escapeHtml } from '../../../../core/html';
import type { IpodAppModule } from '../types';
import { renderMarkdown, renderMermaidIn } from '../../../../core/markdown';
import { NOTES, type Note } from './notes-list';
import { t } from '../../../../i18n';
import './notes.css';

const mod: IpodAppModule = {
  mount({ root, host, signal, args }) {
    host.setTitle(t('ipod.app.notes'));
    root.classList.add('ipod-notes');

    root.innerHTML = `<div class="ipod-notes__screen" id="ipod-notes-screen"></div>`;
    const screen = root.querySelector<HTMLElement>('#ipod-notes-screen')!;

    const renderList = () => {
      host.setTitle(t('ipod.app.notes'));
      screen.scrollTop = 0;
      screen.innerHTML = `
        <ul class="ipod-notes__list">
          ${NOTES.map(
            (n) => `
              <li class="ipod-notes__list-row" data-note-id="${escapeHtml(n.id)}">
                <div class="ipod-notes__list-meta">
                  <div class="ipod-notes__list-title">${escapeHtml(n.title)}</div>
                  <div class="ipod-notes__list-snippet">${escapeHtml(n.snippet)}</div>
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
          const row = (e.target as Element).closest<HTMLElement>('[data-note-id]');
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
          <button type="button" class="ipod-notes__back">${escapeHtml(t('ipod.notes.back'))}</button>
          <div class="ipod-notes__header">${escapeHtml(note.title)}</div>
          <div class="ipod-notes__body" aria-live="polite">${escapeHtml(t('ipod.common.loading'))}</div>
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
        void renderMermaidIn(body);
      } catch (err) {
        if (signal.aborted) return;
        console.error(`[ipod/notes] failed to load "${note.id}"`, err);
        body.textContent = t('ipod.common.loadFailed');
      }
    };

    const initialNoteId = typeof args.noteId === 'string' ? (args.noteId as string) : null;
    const initialNote = initialNoteId ? NOTES.find((n) => n.id === initialNoteId) : undefined;
    if (initialNote) void renderNote(initialNote);
    else renderList();

    return {
      unmount() {
        root.classList.remove('ipod-notes');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
