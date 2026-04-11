import { t } from "../../i18n";

export interface ToolbarCallbacks {
  onPrint(): void;
  onSave(): void;
  onPrevPage(): void;
  onNextPage(): void;
  onGoToPage(page: number): void;
  onZoomChange(zoom: number | 'fit-width' | 'fit-page'): void;
  onZoomIn(): void;
  onZoomOut(): void;
}

export interface ToolbarControls {
  element: HTMLElement;
  setPage(current: number, total: number): void;
  setZoom(value: number): void;
}

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function setPageInputWidth(input: HTMLInputElement): void {
  const len = input.value.length;
  // use ch to get a rough width estimate, with some padding
  input.style.width = `${Math.min(2 + len, 10)}ch`;
}

export function createToolbar(cb: ToolbarCallbacks): ToolbarControls {
  const toolbar = document.createElement('div');
  toolbar.className = 'ar__toolbar';

  // --- Actions group (save, print) ---
  const actionsGroup = document.createElement('div');
  actionsGroup.className = 'ar__toolbar-group';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'ar__btn ar__btn--icon';
  saveBtn.title = t('reader.download');
  saveBtn.innerHTML = '<img src="/icons/adobe-reader/save.png" alt="Save" />';
  saveBtn.addEventListener('click', () => cb.onSave());

  const printBtn = document.createElement('button');
  printBtn.className = 'ar__btn ar__btn--icon';
  printBtn.title = t('reader.print');
  printBtn.innerHTML = '<img src="/icons/adobe-reader/print.png" alt="Print" />';
  printBtn.addEventListener('click', () => cb.onPrint());

  actionsGroup.append(saveBtn, printBtn);

  // --- Navigation group ---
  const navGroup = document.createElement('div');
  navGroup.className = 'ar__toolbar-group';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'ar__btn';
  prevBtn.textContent = '\u25C0';
  prevBtn.title = t('reader.previousPage');
  prevBtn.addEventListener('click', () => cb.onPrevPage());

  const pageInput = document.createElement('input');
  pageInput.className = 'ar__page-input';
  pageInput.type = 'text';
  pageInput.value = '1';
  setPageInputWidth(pageInput);
  // When page input value changes, update width to fit content (up to a max)
  pageInput.addEventListener('input', () => {
    setPageInputWidth(pageInput);
  });

  const ofSpan = document.createElement('span');
  ofSpan.className = 'ar__page-label';
  ofSpan.textContent = t('reader.pageLabelLimit', 1);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'ar__btn';
  nextBtn.textContent = '\u25B6';
  nextBtn.title = t('reader.nextPage');
  nextBtn.addEventListener('click', () => cb.onNextPage());

  pageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput.value, 10);
      if (!isNaN(page)) cb.onGoToPage(page);
    }
  });

  navGroup.append(prevBtn, pageInput, ofSpan, nextBtn);

  // --- Zoom group ---
  const zoomGroup = document.createElement('div');
  zoomGroup.className = 'ar__toolbar-group';

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'ar__btn';
  zoomOutBtn.textContent = '\u2212';
  zoomOutBtn.title = t('reader.zoomOut');
  zoomOutBtn.addEventListener('click', () => cb.onZoomOut());

  const zoomSelect = document.createElement('select');
  zoomSelect.className = 'ar__zoom-select';

  for (const z of ZOOM_PRESETS) {
    const opt = document.createElement('option');
    opt.value = String(z);
    opt.textContent = `${Math.round(z * 100)}%`;
    zoomSelect.appendChild(opt);
  }

  const fitWidthOpt = document.createElement('option');
  fitWidthOpt.value = 'fit-width';
  fitWidthOpt.textContent = t('reader.fitWidth');
  zoomSelect.appendChild(fitWidthOpt);

  const fitPageOpt = document.createElement('option');
  fitPageOpt.value = 'fit-page';
  fitPageOpt.textContent = t('reader.fitPage');
  zoomSelect.appendChild(fitPageOpt);

  zoomSelect.value = '1';

  zoomSelect.addEventListener('change', () => {
    const val = zoomSelect.value;
    if (val === 'fit-width' || val === 'fit-page') {
      cb.onZoomChange(val);
    } else {
      cb.onZoomChange(parseFloat(val));
    }
  });

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'ar__btn';
  zoomInBtn.textContent = '+';
  zoomInBtn.title = t('reader.zoomIn');
  zoomInBtn.addEventListener('click', () => cb.onZoomIn());

  zoomGroup.append(zoomOutBtn, zoomSelect, zoomInBtn);

  // --- Assemble ---
  const sep1 = document.createElement('div');
  sep1.className = 'ar__separator';

  const spacer = document.createElement('div');
  spacer.className = 'ar__toolbar-spacer';

  toolbar.append(navGroup, sep1, zoomGroup, spacer, actionsGroup);

  return {
    element: toolbar,
    setPage(current: number, total: number) {
      pageInput.value = String(current);
      setPageInputWidth(pageInput);
      ofSpan.textContent = t('reader.pageLabelLimit', total);
    },
    setZoom(value: number) {
      // Select closest preset or leave as-is for fit modes
      const match = ZOOM_PRESETS.find((z) => Math.abs(z - value) < 0.01);
      if (match) {
        zoomSelect.value = String(match);
      }
    },
  };
}
