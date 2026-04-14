/**
 * iPod Calculator — a working recreation of the iOS 1 basic calculator.
 *
 * State machine is the minimal calculator loop: display, pending operator,
 * accumulated value, and a "just-equalled" flag used to start a fresh
 * number on the next digit keystroke. Keeps precision reasonable by
 * normalising `Number` output with `toPrecision` before stringifying.
 */

import type { IpodAppModule } from '../types';
import { t } from '../../../../i18n';
import './calculator.css';

type Op = '+' | '-' | '×' | '÷';

interface CalcState {
  display: string;
  accum: number | null;
  pending: Op | null;
  justEvaluated: boolean;
}

const mod: IpodAppModule = {
  mount({ root, host }) {
    host.setTitle(t('ipod.app.calculator'));
    root.classList.add('ipod-calculator');

    root.innerHTML = `
      <div class="ipod-calculator__screen" id="ipod-calc-display">0</div>
      <div class="ipod-calculator__keys">
        <button type="button" data-k="C" class="key key--fn">C</button>
        <button type="button" data-k="±" class="key key--fn">±</button>
        <button type="button" data-k="%" class="key key--fn">%</button>
        <button type="button" data-k="÷" class="key key--op">÷</button>

        <button type="button" data-k="7" class="key">7</button>
        <button type="button" data-k="8" class="key">8</button>
        <button type="button" data-k="9" class="key">9</button>
        <button type="button" data-k="×" class="key key--op">×</button>

        <button type="button" data-k="4" class="key">4</button>
        <button type="button" data-k="5" class="key">5</button>
        <button type="button" data-k="6" class="key">6</button>
        <button type="button" data-k="-" class="key key--op">−</button>

        <button type="button" data-k="1" class="key">1</button>
        <button type="button" data-k="2" class="key">2</button>
        <button type="button" data-k="3" class="key">3</button>
        <button type="button" data-k="+" class="key key--op">+</button>

        <button type="button" data-k="0" class="key key--wide">0</button>
        <button type="button" data-k="." class="key">.</button>
        <button type="button" data-k="=" class="key key--op">=</button>
      </div>
    `;

    const displayEl = root.querySelector<HTMLElement>('#ipod-calc-display')!;

    const state: CalcState = {
      display: '0',
      accum: null,
      pending: null,
      justEvaluated: false,
    };

    const render = () => {
      // Trim very long floats that pop out of JS arithmetic.
      let out = state.display;
      if (out.length > 10 && out.includes('.')) {
        out = Number(out).toPrecision(8).replace(/\.?0+$/, '');
      }
      displayEl.textContent = out;
    };

    const currentNumber = () => Number(state.display);

    const apply = (a: number, op: Op, b: number): number => {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? NaN : a / b;
      }
    };

    const digit = (d: string) => {
      if (state.justEvaluated) {
        state.display = d === '.' ? '0.' : d;
        state.justEvaluated = false;
        return;
      }
      if (d === '.') {
        if (!state.display.includes('.')) state.display += '.';
        return;
      }
      state.display = state.display === '0' ? d : state.display + d;
    };

    const op = (next: Op) => {
      const n = currentNumber();
      if (state.pending && state.accum !== null && !state.justEvaluated) {
        state.accum = apply(state.accum, state.pending, n);
        state.display = formatNumber(state.accum);
      } else {
        state.accum = n;
      }
      state.pending = next;
      state.justEvaluated = true; // next digit starts a fresh number
    };

    const equals = () => {
      if (state.pending === null || state.accum === null) return;
      const n = currentNumber();
      const result = apply(state.accum, state.pending, n);
      state.display = formatNumber(result);
      state.accum = null;
      state.pending = null;
      state.justEvaluated = true;
    };

    const clear = () => {
      state.display = '0';
      state.accum = null;
      state.pending = null;
      state.justEvaluated = false;
    };

    const negate = () => {
      if (state.display === '0') return;
      state.display = state.display.startsWith('-')
        ? state.display.slice(1)
        : '-' + state.display;
    };

    const percent = () => {
      state.display = formatNumber(currentNumber() / 100);
      state.justEvaluated = true;
    };

    const handle = (k: string) => {
      if (/^[0-9.]$/.test(k)) digit(k);
      else if (k === '+' || k === '-' || k === '×' || k === '÷') op(k);
      else if (k === '=') equals();
      else if (k === 'C') clear();
      else if (k === '±') negate();
      else if (k === '%') percent();
      render();
    };

    const keys = root.querySelector<HTMLElement>('.ipod-calculator__keys')!;
    keys.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-k]');
      if (!btn) return;
      handle(btn.dataset.k!);
    });

    render();

    return {
      unmount() {
        root.classList.remove('ipod-calculator');
        root.innerHTML = '';
      },
    };
  },
};

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return t('ipod.calculator.error');
  // Kill floating-point fuzz, keep integers clean.
  if (Number.isInteger(n)) return String(n);
  return Number(n.toPrecision(10)).toString();
}

export default mod;
