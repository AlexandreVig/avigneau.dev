import type { AppModule } from '../types';
import './minesweeper.css';

import { launch } from '../../shell/launcher';
import { createMenu } from './menu';
import { t } from '../../i18n';

const minesweeperIconUrl = '/icons/minesweeper/mine-icon.png';

const deadUrl = '/icons/minesweeper/dead.png';
const smileUrl = '/icons/minesweeper/smile.png';
const winUrl = '/icons/minesweeper/win.png';
const ohhUrl = '/icons/minesweeper/ohh.png';

const emptyUrl = '/icons/minesweeper/empty.png';
const open1Url = '/icons/minesweeper/open1.png';
const open2Url = '/icons/minesweeper/open2.png';
const open3Url = '/icons/minesweeper/open3.png';
const open4Url = '/icons/minesweeper/open4.png';
const open5Url = '/icons/minesweeper/open5.png';
const open6Url = '/icons/minesweeper/open6.png';
const open7Url = '/icons/minesweeper/open7.png';
const open8Url = '/icons/minesweeper/open8.png';

const flagUrl = '/icons/minesweeper/flag.png';
const mineUrl = '/icons/minesweeper/mine-ceil.png';
const mineDeathUrl = '/icons/minesweeper/mine-death.png';
const misflaggedUrl = '/icons/minesweeper/misflagged.png';
const questionUrl = '/icons/minesweeper/question.png';

const digit0Url = '/icons/minesweeper/digit0.png';
const digit1Url = '/icons/minesweeper/digit1.png';
const digit2Url = '/icons/minesweeper/digit2.png';
const digit3Url = '/icons/minesweeper/digit3.png';
const digit4Url = '/icons/minesweeper/digit4.png';
const digit5Url = '/icons/minesweeper/digit5.png';
const digit6Url = '/icons/minesweeper/digit6.png';
const digit7Url = '/icons/minesweeper/digit7.png';
const digit8Url = '/icons/minesweeper/digit8.png';
const digit9Url = '/icons/minesweeper/digit9.png';
const digitMinusUrl = '/icons/minesweeper/digit-.png';

type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

type GameStatus = 'new' | 'started' | 'died' | 'won';

type CellState =
  | 'cover'
  | 'flag'
  | 'unknown'
  | 'open'
  | 'mine'
  | 'die'
  | 'misflagged';

interface Cell {
  state: CellState;
  minesAround: number; // negative => mine
}

interface GameConfig {
  rows: number;
  columns: number;
  mines: number;
}

const CONFIG: Record<Difficulty, GameConfig> = {
  Beginner: { rows: 9, columns: 9, mines: 10 },
  Intermediate: { rows: 16, columns: 16, mines: 40 },
  Expert: { rows: 16, columns: 30, mines: 99 },
};

const digits = [
  digit0Url,
  digit1Url,
  digit2Url,
  digit3Url,
  digit4Url,
  digit5Url,
  digit6Url,
  digit7Url,
  digit8Url,
  digit9Url,
];

function numberCellUrl(n: number): string {
  return [
    emptyUrl,
    open1Url,
    open2Url,
    open3Url,
    open4Url,
    open5Url,
    open6Url,
    open7Url,
    open8Url,
  ][n] ?? emptyUrl;
}

function createDigits(container: HTMLElement): HTMLImageElement[] {
  container.innerHTML = '';
  const imgs = [document.createElement('img'), document.createElement('img'), document.createElement('img')];
  imgs.forEach((img) => {
    img.alt = '';
    container.appendChild(img);
  });
  return imgs;
}

function setDigits(imgs: HTMLImageElement[], number: number): void {
  // XP-style 3-digit display, clamped 0..999, negative shows -XX.
  if (number < 0) {
    const n = (-number) % 100;
    const str = n < 10 ? `0${n}` : String(n);
    imgs[0].src = digitMinusUrl;
    imgs[1].src = digits[Number(str[0])];
    imgs[2].src = digits[Number(str[1])];
    return;
  }

  const n = Math.min(999, number);
  const str = String(n).padStart(3, '0');
  imgs[0].src = digits[Number(str[0])];
  imgs[1].src = digits[Number(str[1])];
  imgs[2].src = digits[Number(str[2])];
}

function nearIndexes(index: number, rows: number, columns: number): number[] {
  if (index < 0 || index >= rows * columns) return [];
  const row = Math.floor(index / columns);
  const column = index % columns;
  const candidates = [
    index - columns - 1,
    index - columns,
    index - columns + 1,
    index - 1,
    index + 1,
    index + columns - 1,
    index + columns,
    index + columns + 1,
  ];
  return candidates.filter((_, arrayIndex) => {
    if (row === 0 && arrayIndex < 3) return false;
    if (row === rows - 1 && arrayIndex > 4) return false;
    if (column === 0 && [0, 3, 5].includes(arrayIndex)) return false;
    if (column === columns - 1 && [2, 4, 7].includes(arrayIndex)) return false;
    return true;
  });
}

function initCells({ rows, columns }: GameConfig): Cell[] {
  return Array.from({ length: rows * columns }, () => ({
    state: 'cover',
    minesAround: 0,
  }));
}

function shufflePick(count: number, maxExclusive: number, exclude: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < maxExclusive; i++) {
    if (i !== exclude) arr.push(i);
  }
  // Fisher–Yates partially
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function placeMines(cells: Cell[], cfg: GameConfig, excludeIndex: number): void {
  const { rows, columns, mines } = cfg;
  const mineIndexes = shufflePick(mines, rows * columns, excludeIndex);
  mineIndexes.forEach((chosen) => {
    cells[chosen].minesAround = -10;
    nearIndexes(chosen, rows, columns).forEach((ni) => {
      if (cells[ni].minesAround >= 0) cells[ni].minesAround += 1;
    });
  });
}

function autoOpenIndexes(cells: Cell[], cfg: GameConfig, startIndex: number): number[] {
  const { rows, columns } = cfg;
  const walked = new Array<boolean>(cells.length).fill(false);

  const walk = (idx: number): number[] => {
    const cell = cells[idx];
    if (!cell) return [];
    if (walked[idx]) return [];
    if (cell.state === 'flag') return [];
    if (cell.minesAround < 0) return [];
    walked[idx] = true;
    if (cell.minesAround > 0) return [idx];

    const out: number[] = [idx];
    for (const n of nearIndexes(idx, rows, columns)) {
      out.push(...walk(n));
    }
    return out;
  };

  return Array.from(new Set(walk(startIndex)));
}

function countRemainingSafe(cells: Cell[]): number {
  return cells.filter((c) => c.state !== 'open' && c.minesAround >= 0).length;
}

function computeRemainingMines(cells: Cell[], mines: number): number {
  const marked = cells.filter((c) => c.state === 'flag' || c.state === 'misflagged').length;
  return mines - marked;
}

function cycleMark(state: CellState): CellState {
  switch (state) {
    case 'cover':
      return 'flag';
    case 'flag':
      return 'unknown';
    case 'unknown':
      return 'cover';
    default:
      return state;
  }
}

const mod: AppModule = {
  async mount({ root, host, signal, args }) {
    root.classList.add('minesweeper');

    const difficultyArg =
      typeof args.difficulty === 'string'
        ? (args.difficulty as Difficulty)
        : 'Beginner';
    let difficulty: Difficulty = difficultyArg in CONFIG ? difficultyArg : 'Beginner';

    let cfg: GameConfig = CONFIG[difficulty];
    let status: GameStatus = 'new';
    let cells: Cell[] = initCells(cfg);
    let seconds = 0;
    let timer: number | null = null;

    const content = document.createElement('div');
    content.style.display = 'inline-flex';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'flex-start';

    const menuBar = createMenu(
      {
        isChecked: (action) =>
          action === `difficulty:${difficulty}`,
        onAction: (action) => {
          if (action === 'new') reset();
          else if (action === 'exit') host.close();
          else if (action === 'about') {
            void launch({
              appId: 'about',
              args: {
                path: 'about:minesweeper',
                icon: minesweeperIconUrl,
                appIcon: minesweeperIconUrl,
                appTitle: 'Minesweeper',
                version: 'Version 1.0',
                copyright: '© 2026 Alexandre Vigneau',
                description: t('minesweeper.about.description'),
                footer: t('minesweeper.about.footer'),
              },
            });
          } else if (action.startsWith('difficulty:')) {
            const next = action.slice('difficulty:'.length) as Difficulty;
            if (next in CONFIG) reset(next);
          }
        },
      },
      signal,
    );

    const frame = document.createElement('div');
    frame.className = 'minesweeper__frame';

    const scoreBar = document.createElement('div');
    scoreBar.className = 'minesweeper__scorebar';

    const minesDigits = document.createElement('div');
    minesDigits.className = 'minesweeper__digits';

    const faceOuter = document.createElement('div');
    faceOuter.className = 'minesweeper__faceOuter';

    const faceBtn = document.createElement('button');
    faceBtn.className = 'minesweeper__face';
    faceBtn.type = 'button';

    const faceImg = document.createElement('img');
    faceImg.alt = '🙂';
    faceImg.src = smileUrl;

    faceBtn.appendChild(faceImg);
    faceOuter.appendChild(faceBtn);

    const timeDigits = document.createElement('div');
    timeDigits.className = 'minesweeper__digits';

    const mineDigitImgs = createDigits(minesDigits);
    const timeDigitImgs = createDigits(timeDigits);

    scoreBar.appendChild(minesDigits);
    scoreBar.appendChild(faceOuter);
    scoreBar.appendChild(timeDigits);

    const grid = document.createElement('div');
    grid.className = 'minesweeper__grid';

    frame.appendChild(scoreBar);
    frame.appendChild(grid);

    content.appendChild(menuBar);
    content.appendChild(frame);
    root.appendChild(content);

    const cellEls: HTMLDivElement[] = [];

    const fitWindowToContent = () => {
      const win = root.closest<HTMLElement>('.window');
      if (!win) return;
      const bodyStyle = window.getComputedStyle(root);
      const bodyPadX =
        (Number.parseFloat(bodyStyle.paddingLeft) || 0) +
        (Number.parseFloat(bodyStyle.paddingRight) || 0);
      const bodyPadY =
        (Number.parseFloat(bodyStyle.paddingTop) || 0) +
        (Number.parseFloat(bodyStyle.paddingBottom) || 0);

      const contentRect = content.getBoundingClientRect();
      const bodyW = contentRect.width + bodyPadX;
      const bodyH = contentRect.height + bodyPadY;

      const winStyle = window.getComputedStyle(win);
      const winPadX =
        (Number.parseFloat(winStyle.paddingLeft) || 0) +
        (Number.parseFloat(winStyle.paddingRight) || 0);
      const winPadY =
        (Number.parseFloat(winStyle.paddingTop) || 0) +
        (Number.parseFloat(winStyle.paddingBottom) || 0);

      const titleBar = win.querySelector<HTMLElement>('.title-bar');
      const titleH = titleBar?.getBoundingClientRect().height ?? 25;

      // Add a tiny buffer so we never end up 1px short due to subpixel rounding.
      host.setSize(bodyW + winPadX + 1, bodyH + titleH + winPadY + 1);
    };

    const buildGrid = () => {
      grid.innerHTML = '';
      cellEls.length = 0;
      grid.style.gridTemplateColumns = `repeat(${cfg.columns}, 16px)`;
      grid.style.gridTemplateRows = `repeat(${cfg.rows}, 16px)`;

      for (let i = 0; i < cells.length; i++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'minesweeper__cell';
        cellEl.dataset.index = String(i);

        const bg = document.createElement('div');
        bg.className = 'minesweeper__cellBg minesweeper__cellBg--cover';

        const img = document.createElement('img');
        img.className = 'minesweeper__cellContent';
        img.alt = '';
        img.src = '';

        cellEl.appendChild(bg);
        cellEl.appendChild(img);
        grid.appendChild(cellEl);
        cellEls.push(cellEl);
      }
    };

    const updateFace = (pressed: boolean) => {
      if (pressed && status === 'started') faceImg.src = ohhUrl;
      else if (status === 'died') faceImg.src = deadUrl;
      else if (status === 'won') faceImg.src = winUrl;
      else faceImg.src = smileUrl;
    };

    const startTimer = () => {
      if (timer != null) return;
      timer = window.setInterval(() => {
        seconds += 1;
        setDigits(timeDigitImgs, seconds);
      }, 1000);
    };

    const stopTimer = () => {
      if (timer == null) return;
      window.clearInterval(timer);
      timer = null;
    };

    const renderCell = (i: number) => {
      const c = cells[i];
      const el = cellEls[i];
      const bg = el.firstElementChild as HTMLDivElement;
      const img = el.lastElementChild as HTMLImageElement;

      const showOpen = c.state === 'open' || c.state === 'mine' || c.state === 'die' || c.state === 'misflagged';
      bg.classList.toggle('minesweeper__cellBg--cover', !showOpen);
      bg.classList.toggle('minesweeper__cellBg--open', showOpen);

      let src = '';
      switch (c.state) {
        case 'open':
          src = numberCellUrl(Math.max(0, c.minesAround));
          break;
        case 'flag':
          src = flagUrl;
          break;
        case 'unknown':
          src = questionUrl;
          break;
        case 'mine':
          src = mineUrl;
          break;
        case 'die':
          src = mineDeathUrl;
          break;
        case 'misflagged':
          src = misflaggedUrl;
          break;
        default:
          src = '';
      }
      img.src = src;
    };

    const renderAll = () => {
      setDigits(mineDigitImgs, computeRemainingMines(cells, cfg.mines));
      setDigits(timeDigitImgs, seconds);
      for (let i = 0; i < cells.length; i++) renderCell(i);
      updateFace(false);
    };

    const reset = (nextDifficulty?: Difficulty) => {
      stopTimer();
      status = 'new';
      seconds = 0;
      if (nextDifficulty && nextDifficulty in CONFIG) {
        difficulty = nextDifficulty;
      }
      cfg = CONFIG[difficulty];
      cells = initCells(cfg);
      buildGrid();
      renderAll();
      host.setTitle('Minesweeper');

      // Let layout settle, then size the window to fit.
      requestAnimationFrame(() => fitWindowToContent());
    };

    const ensureStarted = (excludeIndex: number) => {
      if (status !== 'new') return;
      placeMines(cells, cfg, excludeIndex);
      status = 'started';
      startTimer();
      updateFace(false);
    };

    const gameOver = (dieIndex: number) => {
      status = 'died';
      stopTimer();

      cells = cells.map((c) => {
        if (c.minesAround < 0 && c.state !== 'flag') return { ...c, state: 'mine' };
        if (c.state === 'flag' && c.minesAround >= 0) return { ...c, state: 'misflagged' };
        return c;
      });
      cells[dieIndex] = { ...cells[dieIndex], state: 'die' };

      for (let i = 0; i < cells.length; i++) renderCell(i);
      updateFace(false);
    };

    const winGame = () => {
      status = 'won';
      stopTimer();

      cells = cells.map((c) => {
        if (c.minesAround < 0) return { ...c, state: 'flag' };
        return { ...c, state: 'open' };
      });

      setDigits(mineDigitImgs, 0);
      for (let i = 0; i < cells.length; i++) renderCell(i);
      updateFace(false);
    };

    const openIndex = (index: number) => {
      const c = cells[index];
      if (!c) return;
      if (status === 'died' || status === 'won') return;
      if (c.state === 'flag' || c.state === 'open') return;

      ensureStarted(index);

      if (c.minesAround < 0) {
        gameOver(index);
        return;
      }

      const toOpen = autoOpenIndexes(cells, cfg, index);
      toOpen.forEach((i) => {
        if (cells[i].state !== 'flag') cells[i] = { ...cells[i], state: 'open' };
      });

      toOpen.forEach(renderCell);

      if (status === 'started' && countRemainingSafe(cells) === 0) {
        winGame();
      }
    };

    const chordOpen = (index: number) => {
      if (status !== 'started') return;
      const c = cells[index];
      if (!c || c.state !== 'open' || c.minesAround <= 0) return;

      const neighbors = nearIndexes(index, cfg.rows, cfg.columns);
      const near = neighbors.map((i) => cells[i]);
      const flags = near.filter((n) => n.state === 'flag').length;
      if (flags !== c.minesAround) return;

      const mineIndex = neighbors.find((i) => cells[i].minesAround < 0 && cells[i].state !== 'flag');
      if (typeof mineIndex === 'number' && mineIndex !== -1) {
        gameOver(mineIndex);
        return;
      }

      neighbors.forEach((i) => openIndex(i));
    };

    const markIndex = (index: number) => {
      const c = cells[index];
      if (!c) return;
      if (status === 'died' || status === 'won') return;
      if (c.state === 'open') return;
      cells[index] = { ...c, state: cycleMark(c.state) };
      renderCell(index);
      setDigits(mineDigitImgs, computeRemainingMines(cells, cfg.mines));
    };

    root.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });

    // Face button resets the game.
    faceBtn.addEventListener(
      'click',
      () => {
        reset();
      },
      { signal },
    );

    // Render pressed face while holding mouse on the grid.
    const onPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
      if (!target) return;
      if (status === 'died' || status === 'won') return;

      if (e.button === 0) updateFace(true);

      const index = Number(target.dataset.index);
      if (Number.isNaN(index)) return;

      if (e.button === 2) {
        markIndex(index);
      } else if (e.button === 0) {
        openIndex(index);
      } else if (e.button === 1) {
        chordOpen(index);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 0) updateFace(false);
    };

    const onDblClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
      if (!target) return;
      const index = Number(target.dataset.index);
      if (Number.isNaN(index)) return;
      chordOpen(index);
    };

    grid.addEventListener('pointerdown', onPointerDown, { signal });
    window.addEventListener('pointerup', onPointerUp, { signal });
    grid.addEventListener('dblclick', onDblClick, { signal });

    reset();

    return {
      unmount() {
        stopTimer();
        root.classList.remove('minesweeper');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
