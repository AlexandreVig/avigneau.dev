import { iconForNode, listChildren, parentPath, pathOf, resolve } from '../../fs/api';
import type { FsNode } from '../../fs/types';
import { launch } from '../../lib/launcher';
import { openAbout } from '../about/launch';
import { t } from '../../../../i18n';
import type { AppModule } from '../types';
import { explorerInstances } from './instances';
import { createMenu } from './menu';
import { createHistory } from './history';
import { setupAddressBar } from './addressBar';
import './explorer.css';

const mod: AppModule = {
  mount({ root, args, host, signal, instanceId }) {
    const initialPath =
      typeof args.path === 'string' && resolve(args.path) ? (args.path as string) : '/';

    let currentPath = initialPath;
    const history = createHistory();

    explorerInstances.set(instanceId, () => currentPath);

    root.classList.add('explorer');
    root.innerHTML = `
      <div class="explorer__menubar">
        <div class="explorer__menu-host"></div>
        <img class="explorer__menubar-logo" src="/icons/explorer/windows.png" alt="" />
      </div>

      <div class="explorer__toolbar">
        <button class="explorer__tbtn" data-action="back" disabled>
          <img src="/icons/explorer/back.png" alt="" />
          <span>${t('explorer.back')}</span>
          <span class="explorer__tbtn-caret"></span>
        </button>
        <button class="explorer__tbtn explorer__tbtn--icon" data-action="forward" disabled>
          <img src="/icons/explorer/forward.png" alt="" />
          <span class="explorer__tbtn-caret"></span>
        </button>
        <button class="explorer__tbtn explorer__tbtn--icon" data-action="up" disabled title="${t('explorer.up')}">
          <img src="/icons/explorer/up.png" alt="" />
        </button>
        <div class="explorer__tsep"></div>
        <button class="explorer__tbtn" data-action="search">
          <img src="/icons/explorer/search.png" alt="" />
          <span>${t('explorer.search')}</span>
        </button>
        <button class="explorer__tbtn" data-action="folders">
          <img src="/icons/explorer/folder.png" alt="" />
          <span>${t('explorer.folders')}</span>
        </button>
        <div class="explorer__tsep"></div>
        <button class="explorer__tbtn explorer__tbtn--icon" data-action="views" title="Views">
          <img src="/icons/explorer/views.png" alt="" />
          <span class="explorer__tbtn-caret"></span>
        </button>
      </div>

      <div class="explorer__address">
        <span class="explorer__address-label">${t('explorer.address')}</span>
        <div class="explorer__address-combo">
          <img class="explorer__address-icon" alt="" />
          <input class="explorer__address-input" type="text" spellcheck="false" />
          <button class="explorer__address-caret" data-action="address-dropdown" tabindex="-1" aria-label="Address history"></button>
        </div>
        <button class="explorer__address-go" data-action="go">
          <img src="/icons/explorer/forward.png" alt="" />
          <span>${t('explorer.go')}</span>
        </button>
      </div>

      <div class="explorer__body"></div>
      <div class="explorer__status"></div>
    `;

    const menuHost = root.querySelector<HTMLElement>('.explorer__menu-host')!;
    menuHost.appendChild(
      createMenu(
        {
          onAction: (action) => {
            if (action === 'exit') host.close();
            else if (action === 'refresh') render();
            else if (action === 'about-windows') {
              openAbout('explorer', {
                icon: '/icons/my-computer.png',
                appIcon: '/icons/my-computer.png',
                appTitle: 'Windows Explorer',
                version: 'Version 1.0',
                copyright: '\u00a9 2026 Alexandre Vigneau',
                description: t('explorer.about.description'),
                footer: t('explorer.about.footer'),
              });
            }
          },
        },
        signal,
      ),
    );

    const backBtn = root.querySelector<HTMLButtonElement>('[data-action="back"]')!;
    const forwardBtn = root.querySelector<HTMLButtonElement>('[data-action="forward"]')!;
    const upBtn = root.querySelector<HTMLButtonElement>('[data-action="up"]')!;
    const goBtn = root.querySelector<HTMLButtonElement>('[data-action="go"]')!;
    const addressCombo = root.querySelector<HTMLElement>('.explorer__address-combo')!;
    const addressCaret = root.querySelector<HTMLButtonElement>('[data-action="address-dropdown"]')!;
    const addressInput = root.querySelector<HTMLInputElement>('.explorer__address-input')!;
    const addressIcon = root.querySelector<HTMLImageElement>('.explorer__address-icon')!;
    const body = root.querySelector<HTMLElement>('.explorer__body')!;
    const status = root.querySelector<HTMLElement>('.explorer__status')!;

    const addressBar = setupAddressBar({
      addressCombo,
      addressCaret,
      addressInput,
      addressIcon,
      goBtn,
      getCurrentPath: () => currentPath,
      navigateTo,
      signal,
    });

    function render() {
      const node = resolve(currentPath);
      const title = currentPath === '/' ? 'My Computer' : node?.name ?? currentPath;

      addressBar.syncToPath(currentPath);
      backBtn.disabled = !history.canBack();
      forwardBtn.disabled = !history.canForward();
      upBtn.disabled = currentPath === '/';

      host.setIcon(
        currentPath === '/'
          ? '/icons/my-computer.png'
          : node?.kind === 'file' || node?.kind === 'shortcut'
            ? iconForNode(node)
            : '/icons/folder-32.png',
      );

      const children = listChildren(currentPath);
      body.innerHTML = '';

      if (children.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'explorer__empty';
        empty.textContent = t('explorer.empty');
        body.appendChild(empty);
      } else {
        for (const child of children) {
          body.appendChild(renderItem(child));
        }
      }

      status.textContent = t(
        children.length === 1 ? 'explorer.items.one' : 'explorer.items.other',
        children.length,
      );
      host.setTitle(title);
    }

    function renderItem(node: FsNode): HTMLElement {
      const item = document.createElement('div');
      item.className = 'explorer__item';
      if (node.kind === 'shortcut') item.classList.add('is-shortcut');

      const iconWrap = document.createElement('span');
      iconWrap.className = 'explorer__item-icon-wrap';
      const img = document.createElement('img');
      img.className = 'explorer__item-icon';
      img.src = iconForNode(node);
      img.alt = '';
      iconWrap.appendChild(img);
      item.appendChild(iconWrap);

      const label = document.createElement('div');
      label.className = 'explorer__item-label';
      label.textContent = node.name;
      item.appendChild(label);

      let clickTimer: ReturnType<typeof setTimeout> | null = null;
      item.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          body.querySelectorAll('.explorer__item.is-selected').forEach((el) =>
            el.classList.remove('is-selected'),
          );
          item.classList.add('is-selected');

          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            activate(node);
          } else {
            clickTimer = setTimeout(() => {
              clickTimer = null;
            }, 400);
          }
        },
        { signal },
      );

      return item;
    }

    function activate(node: FsNode) {
      if (node.kind === 'folder') {
        navigateTo(pathOf(currentPath, node));
      } else if (node.kind === 'file') {
        void launch({ path: pathOf(currentPath, node) });
      } else if (node.kind === 'shortcut') {
        if (node.target.appId === 'explorer' && typeof node.target.path === 'string') {
          const targetNode = resolve(node.target.path);
          if (targetNode?.kind === 'folder') {
            navigateTo(node.target.path);
            return;
          }
        }
        void launch({ appId: node.target.appId, path: node.target.path });
      }
    }

    function navigateTo(path: string) {
      history.push(currentPath);
      currentPath = path;
      render();
    }

    backBtn.addEventListener(
      'click',
      () => {
        const prev = history.back(currentPath);
        if (prev !== undefined) {
          currentPath = prev;
          render();
        }
      },
      { signal },
    );

    forwardBtn.addEventListener(
      'click',
      () => {
        const next = history.forward(currentPath);
        if (next !== undefined) {
          currentPath = next;
          render();
        }
      },
      { signal },
    );

    upBtn.addEventListener(
      'click',
      () => {
        if (currentPath === '/') return;
        navigateTo(parentPath(currentPath));
      },
      { signal },
    );

    body.addEventListener(
      'click',
      (e) => {
        if (e.target === body) {
          body.querySelectorAll('.explorer__item.is-selected').forEach((el) =>
            el.classList.remove('is-selected'),
          );
        }
      },
      { signal },
    );

    render();

    return {
      onLaunchArgs(newArgs) {
        if (
          typeof newArgs.path === 'string' &&
          newArgs.path !== currentPath &&
          resolve(newArgs.path)
        ) {
          navigateTo(newArgs.path);
        }
      },
      unmount() {
        explorerInstances.delete(instanceId);
        root.classList.remove('explorer');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
