/**
 * iPod Safari — two-screen mobile browser over the portfolio's project pages
 * and PDF documents.
 *
 * Bookmarks list → tap a row → either:
 *   - MarkdownProject: renders the project as a "web page"
 *   - PdfProject: renders the PDF with the shared pdf-viewer engine, plus a
 *     download button and pinch-to-zoom (fit-width is the zoom floor)
 */

import { escapeHtml } from '../../../../core/html';
import type { IpodAppModule } from '../types';
import { renderMarkdown, renderMermaidIn } from '../../../../core/markdown';
import {
  createPdfViewer,
  ZOOM_MAX,
  type PdfViewerHandle,
  type ZoomMode,
} from '../../../../core/pdf-viewer';
import { PROJECTS, type Project, type PdfProject } from './projects';
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
        <img class="ipod-safari__lock" src="/ipod/lock.png" alt="🔒">
        <span class="ipod-safari__url" id="ipod-safari-url"></span>
        <a
          class="ipod-safari__download"
          id="ipod-safari-download"
          aria-label="Download"
          target="_blank"
          hidden
        >↓</a>
      </div>
      <div class="ipod-safari__viewport" id="ipod-safari-viewport"></div>
    `;

    const urlEl = root.querySelector<HTMLElement>('#ipod-safari-url')!;
    const viewport = root.querySelector<HTMLElement>('#ipod-safari-viewport')!;
    const navBack = root.querySelector<HTMLButtonElement>('#ipod-safari-nav-back')!;
    const downloadBtn = root.querySelector<HTMLAnchorElement>('#ipod-safari-download')!;

    // Track the active PDF viewer so we can destroy it on back/nav
    let activePdfViewer: PdfViewerHandle | null = null;

    function destroyActiveViewer() {
      activePdfViewer?.destroy();
      activePdfViewer = null;
    }

    navBack.addEventListener(
      'click',
      () => {
        destroyActiveViewer();

        // iOS Safari can fail to repaint a `-webkit-overflow-scrolling: touch`
        // container if we swap its contents while momentum scrolling.
        viewport.style.setProperty('-webkit-overflow-scrolling', 'auto');
        void viewport.offsetHeight;

        renderList();

        requestAnimationFrame(() => {
          viewport.style.setProperty('-webkit-overflow-scrolling', 'touch');
          viewport.scrollTop = 0;
        });
      },
      { signal },
    );

    // ── Bookmarks list ──────────────────────────────────────────────────────
    const renderList = () => {
      host.setTitle(t('ipod.app.safari'));
      urlEl.textContent = t('ipod.safari.bookmarks');
      navBack.hidden = true;
      downloadBtn.hidden = true;
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
      viewport.scrollTop = 0;

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

    // ── Project dispatcher ──────────────────────────────────────────────────
    const renderProject = async (project: Project) => {
      host.setTitle(project.title);
      urlEl.textContent = project.url;
      navBack.hidden = false;
      downloadBtn.hidden = true;
      viewport.scrollTop = 0;
      viewport.innerHTML = '';
      destroyActiveViewer();

      if (project.type === 'pdf') {
        await renderPdfProject(project);
      } else {
        await renderMarkdownProject(project);
      }
    };

    // ── Markdown renderer ───────────────────────────────────────────────────
    const renderMarkdownProject = async (project: Extract<Project, { type: 'markdown' }>) => {
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

    // ── PDF renderer ────────────────────────────────────────────────────────
    const renderPdfProject = async (project: PdfProject) => {
      downloadBtn.href = project.pdfUrl;
      downloadBtn.download = project.title + '.pdf';
      downloadBtn.hidden = false;

      activePdfViewer = await createPdfViewer({
        url: project.pdfUrl,
        container: viewport,
        signal,
        initialZoom: 'fit-width',
      });

      if (signal.aborted) return;

      attachPinchZoom(viewport, activePdfViewer, signal);
    };

    renderList();

    return {
      unmount() {
        destroyActiveViewer();
        root.classList.remove('ipod-safari');
        root.innerHTML = '';
      },
    };
  },
};

/**
 * Attaches a pinch-to-zoom gesture to `el`.
 *
 * During the gesture a CSS transform gives instant visual feedback.
 * On finger lift the viewer re-renders at the committed zoom.
 * Fit-width scale is the floor — pinching out past it snaps to 'fit-width'.
 */
function attachPinchZoom(el: HTMLElement, viewer: PdfViewerHandle, signal: AbortSignal) {
  // Captured at touchstart so we don't query the DOM during touchmove.
  let pageContainer: HTMLElement | null = null;

  let isPinching = false;
  let startDist = 0;
  let startZoom = 0;
  let fitWidthScale = 0;

  // All "mid" coords are in viewport-local space (relative to el's top-left).
  let startMidX = 0;
  let startMidY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  let lastMidX = 0;
  let lastMidY = 0;
  let lastDist = 0;

  function midpointInViewport(touches: TouchList): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    return {
      x: (touches[0]!.clientX + touches[1]!.clientX) / 2 - rect.left,
      y: (touches[0]!.clientY + touches[1]!.clientY) / 2 - rect.top,
    };
  }

  el.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 2) return;
      pageContainer = el.querySelector<HTMLElement>('.ar__page-container');
      if (!pageContainer) return;

      isPinching = true;
      startDist = pinchDist(e.touches);
      lastDist = startDist;

      const mid = midpointInViewport(e.touches);
      startMidX = lastMidX = mid.x;
      startMidY = lastMidY = mid.y;

      startScrollLeft = el.scrollLeft;
      startScrollTop = el.scrollTop;
      startZoom = viewer.getCurrentZoom();
      fitWidthScale = viewer.getFitWidthScale();
    },
    { signal, passive: true },
  );

  el.addEventListener(
    'touchmove',
    (e) => {
      if (!isPinching || e.touches.length !== 2 || !pageContainer) return;

      lastDist = pinchDist(e.touches);
      const mid = midpointInViewport(e.touches);
      lastMidX = mid.x;
      lastMidY = mid.y;

      const rawZoom = startZoom * (lastDist / startDist);
      const clamped = Math.max(fitWidthScale, Math.min(rawZoom, ZOOM_MAX));
      const s = clamped / startZoom;

      // matrix(a,b,c,d,e,f) maps (x,y) to (a*x + c*y + e, b*x + d*y + f).
      // We want the content point under startMid (= startScroll + startMid) to
      // appear at lastMid after the transform — see plan for derivation.
      const tx = lastMidX - s * startMidX + startScrollLeft * (1 - s);
      const ty = lastMidY - s * startMidY + startScrollTop * (1 - s);

      pageContainer.style.transformOrigin = '0 0';
      pageContainer.style.transform = `matrix(${s}, 0, 0, ${s}, ${tx}, ${ty})`;
    },
    { signal, passive: true },
  );

  el.addEventListener(
    'touchend',
    (e) => {
      if (!isPinching) return;
      if (e.touches.length > 1) return;
      isPinching = false;

      if (!pageContainer) return;

      // Clear the preview transform first so layout is the source of truth
      // when we read the resolved zoom and write the new scroll offsets.
      pageContainer.style.transform = '';
      pageContainer.style.transformOrigin = '';

      const rawZoom = startZoom * (lastDist / startDist);
      const target: ZoomMode =
        rawZoom <= fitWidthScale ? 'fit-width' : Math.min(rawZoom, ZOOM_MAX);

      viewer.setZoom(target);
      // setZoom resizes canvases synchronously before the first await inside
      // applyZoom(), so the new layout is already committed here.
      const newZoom = viewer.getCurrentZoom();
      const s = newZoom / startZoom;

      el.scrollLeft = (startScrollLeft + startMidX) * s - lastMidX;
      el.scrollTop = (startScrollTop + startMidY) * s - lastMidY;

      pageContainer = null;
    },
    { signal },
  );
}

function pinchDist(touches: TouchList): number {
  return Math.hypot(
    touches[1]!.clientX - touches[0]!.clientX,
    touches[1]!.clientY - touches[0]!.clientY,
  );
}

export default mod;
