import type { AppModule } from '../types';
import './minesweeper.css';

import { openAbout } from '../about/launch';
import { createMenu } from './menu';
import { t } from '../../../../i18n';
import {
  CONFIG,
  type Cell,
  type Difficulty,
  type GameConfig,
  type GameStatus,
  autoOpenIndexes,
  computeRemainingMines,
  countRemainingSafe,
  cycleMark,
  initCells,
  nearIndexes,
  placeMines,
} from './game';
import { createDigits, setDigits } from './digits';

const minesweeperIconUrl = '/icons/minesweeper/mine-icon.webp';

const deadUrl = '/icons/minesweeper/dead.webp';
const smileUrl = '/icons/minesweeper/smile.webp';
const winUrl = '/icons/minesweeper/win.webp';
const ohhUrl = '/icons/minesweeper/ohh.webp';

const emptyUrl = '/icons/minesweeper/empty.webp';
const open1Url = '/icons/minesweeper/open1.webp';
const open2Url = '/icons/minesweeper/open2.webp';
const open3Url = '/icons/minesweeper/open3.webp';
const open4Url = '/icons/minesweeper/open4.webp';
const open5Url = '/icons/minesweeper/open5.webp';
const open6Url = '/icons/minesweeper/open6.webp';
const open7Url = '/icons/minesweeper/open7.webp';
const open8Url = '/icons/minesweeper/open8.webp';

const flagUrl = '/icons/minesweeper/flag.webp';
const mineUrl = '/icons/minesweeper/mine-ceil.webp';
const mineDeathUrl = '/icons/minesweeper/mine-death.webp';
const misflaggedUrl = '/icons/minesweeper/misflagged.webp';
const questionUrl = '/icons/minesweeper/question.webp';

function numberCellUrl(n: number): string {
  return (
    [emptyUrl, open1Url, open2Url, open3Url, open4Url, open5Url, open6Url, open7Url, open8Url][n] ??
    emptyUrl
  );
}

const mod: AppModule = {
  async mount({ root, host, signal, args }) {
    root.classList.add('minesweeper');

    const difficultyArg =
      typeof args.difficulty === 'string' ? (args.difficulty as Difficulty) : 'Beginner';
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
        isChecked: (action) => action === `difficulty:${difficulty}`,
        onAction: (action) => {
          if (action === 'new') reset();
          else if (action === 'exit') host.close();
          else if (action === 'about') {
            openAbout('minesweeper', {
              icon: minesweeperIconUrl,
              appIcon: minesweeperIconUrl,
              appTitle: 'Minesweeper',
              version: 'Version 1.0',
              copyright: '© 2026 Alexandre Vigneau',
              description: t('minesweeper.about.description'),
              footer: t('minesweeper.about.footer'),
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
      const c = cells[i]!;
      const el = cellEls[i]!;
      const bg = el.firstElementChild as HTMLDivElement;
      const img = el.lastElementChild as HTMLImageElement;

      const showOpen =
        c.state === 'open' || c.state === 'mine' || c.state === 'die' || c.state === 'misflagged';
      bg.classList.toggle('minesweeper__cellBg--cover', !showOpen);
      bg.classList.toggle('minesweeper__cellBg--open', showOpen);

      let src: string;
      switch (c.state) {
        case 'open':
          src = numberCellUrl(c.minesAround);
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
          src = emptyUrl;
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
        if (c.isMine && c.state !== 'flag') return { ...c, state: 'mine' };
        if (c.state === 'flag' && !c.isMine) return { ...c, state: 'misflagged' };
        return c;
      });
      cells[dieIndex] = { ...cells[dieIndex]!, state: 'die' };

      for (let i = 0; i < cells.length; i++) renderCell(i);
      updateFace(false);
      document.dispatchEvent(new CustomEvent('xp:game-lose', { detail: { appId: 'minesweeper' } }));
    };

    const winGame = () => {
      status = 'won';
      stopTimer();

      cells = cells.map((c) => {
        if (c.isMine) return { ...c, state: 'flag' };
        return { ...c, state: 'open' };
      });

      setDigits(mineDigitImgs, 0);
      for (let i = 0; i < cells.length; i++) renderCell(i);
      updateFace(false);
      document.dispatchEvent(new CustomEvent('xp:game-win', { detail: { appId: 'minesweeper' } }));
    };

    const openIndex = (index: number) => {
      const c = cells[index];
      if (!c) return;
      if (status === 'died' || status === 'won') return;
      if (c.state === 'flag' || c.state === 'open') return;

      ensureStarted(index);

      if (c.isMine) {
        gameOver(index);
        return;
      }

      const toOpen = autoOpenIndexes(cells, cfg, index);
      toOpen.forEach((i) => {
        const cell = cells[i]!;
        if (cell.state !== 'flag') cells[i] = { ...cell, state: 'open' };
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
      const near = neighbors.map((i) => cells[i]!);
      const flags = near.filter((n) => n.state === 'flag').length;
      if (flags !== c.minesAround) return;

      const mineIndex = neighbors.find((i) => cells[i]!.isMine && cells[i]!.state !== 'flag');
      if (mineIndex !== undefined) {
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

    faceBtn.addEventListener(
      'click',
      () => {
        reset();
      },
      { signal },
    );

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
