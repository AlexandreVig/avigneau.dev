/**
 * iPod Safari — two-screen mobile browser over the portfolio's project
 * pages. Lands on a Bookmarks list of all projects, tapping a row opens
 * that project as a "web page" with a Bookmarks button back to the list.
 *
 * The project list lives in `./projects.ts` so adding a new project is a
 * content edit, not a UI edit — this module only renders what it finds.
 */

import { escapeHtml } from '../../../../core/html';
import type { IpodAppModule } from '../types';
import { renderMarkdown, renderMermaidIn } from '../../../../core/markdown';
import { PROJECTS, type Project } from './projects';
import { t } from '../../../../i18n';
import './safari.css';

const mod: IpodAppModule = {
  mount({ root, host, signal }) {
    host.setTitle(t('ipod.app.safari'));
    root.classList.add('ipod-safari');

    root.innerHTML = `
      <div class="ipod-safari__urlbar">
        <button
          type="button"
          class="ipod-safari__nav-back"
          id="ipod-safari-nav-back"
          aria-label="${t('ipod.safari.bookmarks')}"
          hidden
        >‹</button>
        <img class="ipod-safari__lock" src="/ipod/lock.png" alt="🔒"></span>
        <span class="ipod-safari__url" id="ipod-safari-url"></span>
      </div>
      <div class="ipod-safari__viewport" id="ipod-safari-viewport"></div>
    `;

    const urlEl = root.querySelector<HTMLElement>('#ipod-safari-url')!;
    const viewport = root.querySelector<HTMLElement>('#ipod-safari-viewport')!;
    const navBack = root.querySelector<HTMLButtonElement>('#ipod-safari-nav-back')!;

    navBack.addEventListener('click', () => renderList(), { signal });

    const renderList = () => {
      host.setTitle(t('ipod.app.safari'));
      urlEl.textContent = t('ipod.safari.bookmarks');
      navBack.hidden = true;
      viewport.scrollTop = 0;
      viewport.innerHTML = `
        <ul class="ipod-safari__bookmarks">
          ${PROJECTS.map(
            (p) => `
              <li class="ipod-safari__bookmark" data-project-id="${escapeHtml(p.id)}">
                <div class="ipod-safari__bookmark-icon" aria-hidden="true">
                  <img src="/ipod/bookmark.webp" alt="🔖" onerror="this.style.display='none'">
                </div>
                <div class="ipod-safari__bookmark-meta">
                  <div class="ipod-safari__bookmark-title">${escapeHtml(p.title)}</div>
                  <div class="ipod-safari__bookmark-desc">${escapeHtml(p.description)}</div>
                </div>
                <div class="ipod-safari__bookmark-chev" aria-hidden="true">›</div>
              </li>
            `,
          ).join('')}
        </ul>
      `;

      const list = viewport.querySelector<HTMLElement>('.ipod-safari__bookmarks')!;
      list.addEventListener(
        'click',
        (e) => {
          const row = (e.target as Element).closest<HTMLElement>('[data-project-id]');
          if (!row) return;
          const project = PROJECTS.find((p) => p.id === row.dataset.projectId);
          if (project) void renderProject(project);
        },
        { signal },
      );
    };

    const renderProject = async (project: Project) => {
      host.setTitle(project.title);
      urlEl.textContent = project.url;
      navBack.hidden = false;
      viewport.scrollTop = 0;
      viewport.innerHTML = `<div class="ipod-safari__loading">${escapeHtml(t('ipod.common.loading'))}</div>`;

      try {
        const source = await project.load();
        if (signal.aborted) return;
        const html = await renderMarkdown(source);
        if (signal.aborted) return;
        viewport.innerHTML = `<article class="ipod-safari__page">${html}</article>`;
        void renderMermaidIn(viewport);
        viewport.scrollTop = 0;
      } catch (err) {
        if (signal.aborted) return;
        console.error('[ipod/safari] failed to load project', err);
        viewport.innerHTML = `
          <div class="ipod-safari__error">
            <strong>${escapeHtml(t('ipod.safari.errorTitle'))}</strong>
            <p>${escapeHtml(t('ipod.safari.errorBody'))}</p>
          </div>
        `;
      }
    };

    renderList();

    return {
      unmount() {
        root.classList.remove('ipod-safari');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
