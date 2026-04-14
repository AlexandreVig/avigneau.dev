import type { AppModule } from '../types';
import type { AboutArgs } from './types';
import './about.css';

const mod: AppModule = {
  mount({ root, args, host }) {
    const a = args as unknown as AboutArgs;

    if (typeof a.appTitle !== 'string' || typeof a.appIcon !== 'string') {
      root.textContent = 'Invalid About dialog arguments.';
      return;
    }

    host.setTitle(`About ${a.appTitle}`);
    root.classList.add('about');

    const parts: string[] = [];
    parts.push(`
      <div class="about__body">
        <div class="about__header">
          <img class="about__icon" src="${escapeAttr(a.appIcon)}" alt="" />
          <div class="about__header-text">
            <div class="about__title">${escapeHtml(a.appTitle)}</div>
    `);
    if (a.version) parts.push(`<div class="about__line">${escapeHtml(a.version)}</div>`);
    if (a.copyright) parts.push(`<div class="about__line">${escapeHtml(a.copyright)}</div>`);
    parts.push(`
          </div>
        </div>
    `);
    if (a.description) {
      parts.push('<hr class="about__rule" />');
      parts.push(`<div class="about__description">${renderInline(a.description)}</div>`);
    }
    if (a.footer) {
      parts.push('<hr class="about__rule" />');
      parts.push(`<div class="about__footer">${escapeHtml(a.footer)}</div>`);
    }
    parts.push(`
      </div>
      <div class="about__buttons">
        <button class="about__ok" type="button">OK</button>
      </div>
    `);

    root.innerHTML = parts.join('');

    const ok = root.querySelector<HTMLButtonElement>('.about__ok')!;
    ok.addEventListener('click', () => host.close());
    // Defer focus so the window-manager's own focus pass (which runs after
    // create()) doesn't steal it back to the window root.
    queueMicrotask(() => ok.focus());

    return {
      unmount() {
        root.classList.remove('about');
        root.innerHTML = '';
      },
    };
  },
};

/**
 * Tiny inline renderer: HTML-escapes the input, then upgrades Markdown-style
 * `[text](url)` links to real anchors. Only `http(s):` URLs are linkified to
 * keep the attack surface small.
 */
function renderInline(source: string): string {
  const escaped = escapeHtml(source);
  return escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, text: string, href: string) =>
      `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer noopener">${text}</a>`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export default mod;
