import { openAbout } from '../about/launch';
import { t } from '../../../../i18n';
import type { AppModule } from '../types';
import { createMenu } from './menu';
import { escapeHtml } from '../../../../core/html';
import { renderMarkdown, renderMermaidIn } from '../../../../core/markdown';
import './notepad.css';

const mod: AppModule = {
  async mount({ root, file, host, signal }) {
    root.classList.add('notepad');

    let statusBarVisible = false;

    const body = document.createElement('div');
    body.className = 'notepad__body';

    const statusBar = document.createElement('div');
    statusBar.className = 'notepad__statusbar';
    statusBar.hidden = true;

    const menuBar = createMenu(
      {
        isChecked: (action) => (action === 'toggle-status-bar' ? statusBarVisible : false),
        onAction: (action) => {
          switch (action) {
            case 'exit':
              host.close();
              break;
            case 'select-all': {
              const range = document.createRange();
              range.selectNodeContents(body);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
              break;
            }
            case 'copy': {
              const text = window.getSelection()?.toString() ?? '';
              if (text) void navigator.clipboard?.writeText(text);
              break;
            }
            case 'toggle-status-bar':
              statusBarVisible = !statusBarVisible;
              statusBar.hidden = !statusBarVisible;
              break;
            case 'about':
              openAbout('notepad', {
                icon: '/icons/notepad.webp',
                appIcon: '/icons/notepad.webp',
                appTitle: 'Notepad',
                version: 'Version 1.0',
                copyright: '© 2026 Alexandre Vigneau',
                description: t('notepad.about.description'),
                footer: t('notepad.about.footer'),
              });
              break;
          }
        },
      },
      signal,
    );

    root.appendChild(menuBar);
    root.appendChild(body);
    root.appendChild(statusBar);

    if (!file) {
      body.innerHTML = `<div class="notepad__empty">${t('notepad.untitled')}</div>`;
      statusBar.textContent = t('notepad.untitled');
      return {
        unmount() {
          root.classList.remove('notepad');
          root.innerHTML = '';
        },
      };
    }

    host.setTitle(`${file.name} — Notepad`);

    const source = await file.read();
    if (file.ext === '.md') {
      body.innerHTML = await renderMarkdown(source);
      void renderMermaidIn(body);
    } else {
      body.innerHTML = `<pre>${escapeHtml(source)}</pre>`;
    }

    const lines = source.split('\n').length;
    statusBar.textContent = `${file.path}    Ln ${lines}, Col 1`;

    return {
      unmount() {
        root.classList.remove('notepad');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
