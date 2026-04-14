import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { openAbout } from '../about/launch';
import type { AppModule, AppInstance } from '../types';
import { createMenu } from './menu';
import { createToolbar } from './toolbar';
import './adobe-reader.css';
import { t } from '../../../../i18n';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const mod: AppModule = {
  async mount({ root, file, host, signal }) {
    root.classList.add('adobe-reader');

    if (!file) {
      root.innerHTML = '<div class="ar__loading">No file specified.</div>';
      return { unmount() { root.classList.remove('adobe-reader'); root.innerHTML = ''; } };
    }

    host.setTitle(`${file.name} — Adobe Reader`);

    // State
    let currentPage = 1;
    let totalPages = 0;
    let currentZoom = 1.0;
    let zoomMode: number | 'fit-width' | 'fit-page' = 1.0;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    const rendered = new Set<number>();
    const rendering = new Set<number>();
    const canvases: HTMLCanvasElement[] = [];
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;
    let zoomGeneration = 0;

    // Viewport
    const viewport = document.createElement('div');
    viewport.className = 'ar__viewport';

    const pageContainer = document.createElement('div');
    pageContainer.className = 'ar__page-container';
    viewport.appendChild(pageContainer);

    // PDF URL for save/print
    const pdfUrl = await file.read();

    // Helper functions used by both menu and toolbar
    function printPdf() {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 1000);
      };
    }

    function savePdf() {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = file!.name;
      a.click();
    }

    // Menu bar
    const menuBar = createMenu({
      onAction(action) {
        switch (action) {
          case 'exit':
            host.close();
            break;
          case 'save':
            savePdf();
            break;
          case 'print':
            printPdf();
            break;
          case 'fit-page':
            zoomMode = 'fit-page';
            void applyZoom();
            break;
          case 'fit-width':
            zoomMode = 'fit-width';
            void applyZoom();
            break;
          case 'zoom-in':
            toolbarControls.onZoomIn();
            break;
          case 'zoom-out':
            toolbarControls.onZoomOut();
            break;
          case 'about':
            openAbout('adobe-reader', {
              icon: '/icons/adobe-reader.png',
              appIcon: '/icons/adobe-reader.png',
              appTitle: 'Adobe Reader',
              version: 'Version 7.0',
              copyright: '\u00a9 2026 Alexandre Vigneau',
              description: t('reader.about.description'),
              footer: t('reader.about.footer'),
            });
            break;
        }
      },
    }, signal);

    // Toolbar actions exposed for menu reuse
    const toolbarControls = {
      onZoomIn() {
        const idx = ZOOM_PRESETS.findIndex((z) => z > currentZoom + 0.01);
        if (idx !== -1) {
          zoomMode = ZOOM_PRESETS[idx];
          void applyZoom();
        }
      },
      onZoomOut() {
        const candidates = ZOOM_PRESETS.filter((z) => z < currentZoom - 0.01);
        if (candidates.length) {
          zoomMode = candidates[candidates.length - 1];
          void applyZoom();
        }
      },
    };

    // Toolbar
    const toolbar = createToolbar({
      onPrint: printPdf,
      onSave: savePdf,
      onPrevPage() {
        if (currentPage > 1) scrollToPage(currentPage - 1);
      },
      onNextPage() {
        if (currentPage < totalPages) scrollToPage(currentPage + 1);
      },
      onGoToPage(page) {
        const clamped = Math.max(1, Math.min(page, totalPages));
        scrollToPage(clamped);
      },
      onZoomChange(val) {
        zoomMode = val;
        void applyZoom();
      },
      onZoomIn: toolbarControls.onZoomIn,
      onZoomOut: toolbarControls.onZoomOut,
    });

    root.appendChild(menuBar);
    root.appendChild(toolbar.element);
    root.appendChild(viewport);

    // Show loading
    pageContainer.innerHTML = '<div class="ar__loading">Loading PDF...</div>';

    // Load PDF
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    signal.addEventListener('abort', () => loadingTask.destroy(), { once: true });

    // Always return an AppInstance so appHost can tear us down even if the
    // user closes the window while the PDF is still loading. Previous code
    // did a bare `return` on abort, which dropped the reference to
    // loadingTask and left the DOM/worker alive until GC.
    const instance: AppInstance = {
      unmount() {
        observer?.disconnect();
        if (resizeTimer) clearTimeout(resizeTimer);
        loadingTask.destroy();
        root.classList.remove('adobe-reader');
        root.innerHTML = '';
        pdfDoc = null;
      },
      onResize() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (zoomMode === 'fit-width' || zoomMode === 'fit-page') {
            void applyZoom();
          }
        }, 100);
      },
    };

    try {
      pdfDoc = await loadingTask.promise;
    } catch {
      // Destroyed by signal abort, or genuine load failure. Return the
      // instance so appHost can still call unmount() if the window lingers.
      return instance;
    }
    if (signal.aborted) return instance;
    totalPages = pdfDoc.numPages;

    pageContainer.innerHTML = '';
    toolbar.setPage(1, totalPages);

    // Create canvas placeholders
    for (let i = 1; i <= totalPages; i++) {
      const canvas = document.createElement('canvas');
      canvas.className = 'ar__page';
      canvas.dataset.page = String(i);
      pageContainer.appendChild(canvas);
      canvases.push(canvas);
    }

    // Size canvases based on first page dimensions
    const firstPage = await pdfDoc.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const pageAspect = baseViewport.width / baseViewport.height;

    function computeScale(): number {
      if (zoomMode === 'fit-width') {
        const availWidth = viewport.clientWidth - 24; // padding
        return availWidth / baseViewport.width;
      }
      if (zoomMode === 'fit-page') {
        const availWidth = viewport.clientWidth - 24;
        const availHeight = viewport.clientHeight - 24;
        const scaleW = availWidth / baseViewport.width;
        const scaleH = availHeight / baseViewport.height;
        return Math.min(scaleW, scaleH);
      }
      return zoomMode as number;
    }

    async function renderPage(pageNum: number) {
      if (!pdfDoc || rendering.has(pageNum)) return;
      rendering.add(pageNum);
      try {
        const page = await pdfDoc.getPage(pageNum);
        const dpr = window.devicePixelRatio || 1;
        const pv = page.getViewport({ scale: currentZoom * dpr });
        const canvas = canvases[pageNum - 1];

        canvas.width = Math.floor(pv.width);
        canvas.height = Math.floor(pv.height);
        canvas.style.width = `${Math.floor(pv.width / dpr)}px`;
        canvas.style.height = `${Math.floor(pv.height / dpr)}px`;

        await page.render({ canvas, viewport: pv }).promise;
        rendered.add(pageNum);
      } finally {
        rendering.delete(pageNum);
      }
    }

    function sizeAllCanvases() {
      const cssWidth = Math.floor(baseViewport.width * currentZoom);
      const cssHeight = Math.floor(cssWidth / pageAspect);

      for (const canvas of canvases) {
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }
    }

    async function applyZoom() {
      const gen = ++zoomGeneration;
      currentZoom = computeScale();
      toolbar.setZoom(currentZoom);
      rendered.clear();
      rendering.clear();
      sizeAllCanvases();

      // Re-render all visible pages
      for (const canvas of canvases) {
        if (gen !== zoomGeneration || signal.aborted) return;
        if (isVisible(canvas)) {
          const pageNum = parseInt(canvas.dataset.page!, 10);
          await renderPage(pageNum);
        }
      }
    }

    function isVisible(el: HTMLElement): boolean {
      const rect = el.getBoundingClientRect();
      const vpRect = viewport.getBoundingClientRect();
      return rect.bottom > vpRect.top && rect.top < vpRect.bottom;
    }

    function scrollToPage(page: number) {
      const canvas = canvases[page - 1];
      if (canvas) {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
        currentPage = page;
        toolbar.setPage(currentPage, totalPages);
      }
    }

    // IntersectionObserver for lazy rendering + page tracking
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = parseInt((entry.target as HTMLElement).dataset.page!, 10);
          if (entry.isIntersecting) {
            if (!rendered.has(pageNum)) {
              void renderPage(pageNum);
            }
            // Update current page to the topmost visible
            if (entry.intersectionRatio > 0.3 || entry.boundingClientRect.top >= 0) {
              if (pageNum !== currentPage) {
                currentPage = pageNum;
                toolbar.setPage(currentPage, totalPages);
              }
            }
          }
        }
      },
      { root: viewport, threshold: [0, 0.3, 0.5] },
    );

    for (const canvas of canvases) {
      observer.observe(canvas);
    }

    // Initial render
    currentZoom = computeScale();
    toolbar.setZoom(currentZoom);
    sizeAllCanvases();
    await renderPage(1);

    // Track scroll for page indicator
    viewport.addEventListener(
      'scroll',
      () => {
        // Find the page closest to the top of the viewport
        let bestPage = 1;
        let bestDist = Infinity;
        const vpTop = viewport.getBoundingClientRect().top;
        for (let i = 0; i < canvases.length; i++) {
          const rect = canvases[i].getBoundingClientRect();
          const dist = Math.abs(rect.top - vpTop);
          if (dist < bestDist) {
            bestDist = dist;
            bestPage = i + 1;
          }
        }
        if (bestPage !== currentPage) {
          currentPage = bestPage;
          toolbar.setPage(currentPage, totalPages);
        }
      },
      { signal, passive: true },
    );

    return instance;
  },
};

export default mod;
