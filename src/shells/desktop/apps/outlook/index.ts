import { escapeHtml } from '../../../../core/html';
import type { AppModule } from '../types';
import type { FolderId } from './types';
import { getFolders, getEmails, contacts } from './data';
import { createMenu } from './menu';
import { launch } from '../../lib/launcher';
import { openAbout } from '../about/launch';
import { t, getLocale } from '../../../../i18n';
import './outlook.css';

const mod: AppModule = {
  mount({ root, host, signal }) {
    let currentFolder: FolderId = 'inbox';
    let selectedEmailId: string | null = null;

    root.classList.add('outlook');
    root.innerHTML = `
      <div class="outlook__menu-slot"></div>

      <div class="outlook__toolbar">
        <button class="outlook__tbtn" data-action="create-mail">
          <img src="/icons/outlook/create-mail.png" alt="" />
          <span>${t('outlook.createMail')}</span>
        </button>
        <div class="outlook__tsep"></div>
        <button class="outlook__tbtn" data-action="reply" disabled>
          <img src="/icons/outlook/reply.png" alt="" />
          <span>${t('outlook.reply')}</span>
        </button>
        <button class="outlook__tbtn" data-action="reply-all" disabled>
          <img src="/icons/outlook/reply-all.png" alt="" />
          <span>${t('outlook.replyAll')}</span>
        </button>
        <button class="outlook__tbtn" data-action="forward" disabled>
          <img src="/icons/outlook/forward.png" alt="" />
          <span>${t('outlook.forward')}</span>
        </button>
        <div class="outlook__tsep"></div>
        <button class="outlook__tbtn" data-action="print" disabled>
          <img src="/icons/outlook/print.png" alt="" />
          <span>${t('outlook.print')}</span>
        </button>
        <button class="outlook__tbtn" data-action="delete" disabled>
          <img src="/icons/outlook/delete.png" alt="" />
          <span>${t('outlook.delete')}</span>
        </button>
        <div class="outlook__tsep"></div>
        <button class="outlook__tbtn" data-action="send-recv" disabled>
          <img src="/icons/outlook/send-recv.png" alt="" />
          <span>${t('outlook.sendRecv')}</span>
        </button>
        <button class="outlook__tbtn" data-action="addresses" disabled>
          <img src="/icons/outlook/addresses.png" alt="" />
          <span>${t('outlook.addresses')}</span>
        </button>
        <button class="outlook__tbtn" data-action="find" disabled>
          <img src="/icons/outlook/find.png" alt="" />
          <span>${t('outlook.find')}</span>
        </button>
      </div>

      <div class="outlook__main">
        <div class="outlook__sidebar">
          <div class="outlook__folders">
            <div class="outlook__folders-header">${t('outlook.foldersHeader')}</div>
            <div class="outlook__folders-tree"></div>
          </div>
          <div class="outlook__contacts">
            <div class="outlook__contacts-header">${t('outlook.contactsHeader')}</div>
            <div class="outlook__contacts-list"></div>
          </div>
        </div>
        <div class="outlook__content">
          <div class="outlook__list">
            <div class="outlook__list-header">
              <div class="outlook__list-col outlook__list-col--prio"></div>
              <div class="outlook__list-col outlook__list-col--attach"></div>
              <div class="outlook__list-col outlook__list-col--from">${t('outlook.listFrom')}</div>
              <div class="outlook__list-col outlook__list-col--subject">${t('outlook.listSubject')}</div>
              <div class="outlook__list-col outlook__list-col--date">${t('outlook.listReceived')}</div>
            </div>
            <div class="outlook__list-body"></div>
          </div>
          <div class="outlook__reader"></div>
        </div>
      </div>

      <div class="outlook__status">
        <span class="outlook__status-count"></span>
        <span class="outlook__status-online">${t('outlook.workingOnline')}</span>
      </div>
    `;

    // ── Menu bar ──────────────────────────────────────────────────────────
    const menuSlot = root.querySelector<HTMLElement>('.outlook__menu-slot')!;
    menuSlot.replaceWith(
      createMenu(
        {
          onAction: (action) => {
            if (action === 'exit') host.close();
            else if (action === 'new-mail') openCompose();
            else if (action === 'refresh') render();
            else if (action === 'about') {
              openAbout('outlook', {
                icon: '/icons/outlook.png',
                appIcon: '/icons/outlook.png',
                appTitle: 'Outlook Express',
                version: 'Version 6.0',
                copyright: '\u00a9 2026 Alexandre Vigneau',
                description: t('outlook.about.description'),
              });
            }
          },
        },
        signal,
      ),
    );

    // ── Toolbar actions ───────────────────────────────────────────────────
    root.addEventListener(
      'click',
      (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
          'button[data-action]',
        );
        if (!btn || btn.disabled) return;
        const action = btn.dataset.action;
        if (action === 'create-mail') openCompose();
      },
      { signal },
    );

    // ── References ────────────────────────────────────────────────────────
    const foldersTree = root.querySelector<HTMLElement>('.outlook__folders-tree')!;
    const contactsList = root.querySelector<HTMLElement>('.outlook__contacts-list')!;
    const listBody = root.querySelector<HTMLElement>('.outlook__list-body')!;
    const reader = root.querySelector<HTMLElement>('.outlook__reader')!;
    const statusCount = root.querySelector<HTMLElement>('.outlook__status-count')!;

    // ── Render folders tree ───────────────────────────────────────────────
    function renderFolders(): void {
      foldersTree.innerHTML = '';

      // Root node
      const rootNode = document.createElement('div');
      rootNode.className = 'outlook__tree-node outlook__tree-node--root';
      rootNode.innerHTML = `
        <img src="/icons/outlook/local-folders.png" class="outlook__tree-icon" alt="" />
        <span>Outlook Express</span>
      `;
      foldersTree.appendChild(rootNode);

      for (const folder of getFolders()) {
        const node = document.createElement('div');
        node.className = 'outlook__tree-node outlook__tree-node--child';
        if (folder.id === currentFolder) node.classList.add('outlook__tree-node--active');

        const unreadBadge = folder.unread ? ` (${folder.unread})` : '';
        const bold = folder.unread ? ' outlook__tree-label--bold' : '';
        node.innerHTML = `
          <img src="${escapeHtml(folder.icon)}" class="outlook__tree-icon" alt="" />
          <span class="outlook__tree-label${bold}">${escapeHtml(folder.name)}${unreadBadge}</span>
        `;
        node.addEventListener(
          'click',
          () => {
            currentFolder = folder.id;
            selectedEmailId = null;
            render();
          },
          { signal },
        );
        foldersTree.appendChild(node);
      }
    }

    // ── Render contacts panel ─────────────────────────────────────────────
    function renderContacts(): void {
      contactsList.innerHTML = '';
      const note = document.createElement('div');
      note.className = 'outlook__contacts-note';
      note.textContent = t('outlook.noContacts');
      // Only show note if no contacts
      if (contacts.length === 0) {
        contactsList.appendChild(note);
        return;
      }
      for (const contact of contacts) {
        const item = document.createElement('div');
        item.className = 'outlook__contact-item';
        item.innerHTML = `
          <img src="${escapeHtml(contact.icon)}" class="outlook__contact-icon" alt="" />
          <span>${escapeHtml(contact.name)}</span>
        `;
        contactsList.appendChild(item);
      }
    }

    // ── Render email list ─────────────────────────────────────────────────
    function renderList(): void {
      listBody.innerHTML = '';
      const folderEmails = getEmails().filter((e) => e.folder === currentFolder);

      if (folderEmails.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'outlook__list-empty';
        empty.textContent = t('outlook.noItems');
        listBody.appendChild(empty);
        statusCount.textContent = t('outlook.messageCountZero');
        return;
      }

      // Sort by date desc
      folderEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Auto-select first email
      if (!selectedEmailId || !folderEmails.find((e) => e.id === selectedEmailId)) {
        selectedEmailId = folderEmails[0].id;
      }

      for (const email of folderEmails) {
        const row = document.createElement('div');
        row.className = 'outlook__list-row';
        if (email.unread) row.classList.add('outlook__list-row--unread');
        if (email.id === selectedEmailId) row.classList.add('outlook__list-row--selected');

        const iconSrc = email.unread
          ? '/icons/outlook/email-unread.png'
          : '/icons/outlook/email-read.png';

        const dateStr = formatDate(email.date);

        row.innerHTML = `
          <div class="outlook__list-cell outlook__list-cell--prio">
            <img src="${iconSrc}" class="outlook__list-mail-icon" alt="" />
          </div>
          <div class="outlook__list-cell outlook__list-cell--attach"></div>
          <div class="outlook__list-cell outlook__list-cell--from">${escapeHtml(email.from.name)}</div>
          <div class="outlook__list-cell outlook__list-cell--subject">${escapeHtml(email.subject)}</div>
          <div class="outlook__list-cell outlook__list-cell--date">${dateStr}</div>
        `;

        row.addEventListener(
          'click',
          () => {
            selectedEmailId = email.id;
            render();
          },
          { signal },
        );
        row.addEventListener(
          'dblclick',
          () => {
            selectedEmailId = email.id;
            render();
          },
          { signal },
        );

        listBody.appendChild(row);
      }

      const unreadCount = folderEmails.filter((e) => e.unread).length;
      statusCount.textContent = t('outlook.messageCount', folderEmails.length, unreadCount);
    }

    // ── Render reading pane ───────────────────────────────────────────────
    function renderReader(): void {
      const email = selectedEmailId ? getEmails().find((e) => e.id === selectedEmailId) : null;
      if (!email) {
        reader.innerHTML = '';
        return;
      }

      const loc = getLocale();
      reader.innerHTML = `
        <div class="outlook__reader-header">
          <div class="outlook__reader-field">
            <b>${t('outlook.readerFrom')}</b>&nbsp; ${escapeHtml(email.from.name)} &lt;${escapeHtml(email.from.email)}&gt;
          </div>
          <div class="outlook__reader-field">
            <b>${t('outlook.readerDate')}</b>&nbsp; ${new Date(email.date).toLocaleString(loc)}
          </div>
          <div class="outlook__reader-field">
            <b>${t('outlook.readerTo')}</b>&nbsp; ${escapeHtml(email.to)}
          </div>
          <div class="outlook__reader-field">
            <b>${t('outlook.readerSubject')}</b>&nbsp; ${escapeHtml(email.subject)}
          </div>
        </div>
        <div class="outlook__reader-body"></div>
      `;

      // Render email body in a sandboxed iframe to prevent XSS
      const readerBody = root.querySelector<HTMLElement>('.outlook__reader-body')!;
      const iframe = document.createElement('iframe');
      iframe.sandbox.add('allow-same-origin');
      iframe.className = 'outlook__reader-iframe';
      iframe.srcdoc = email.bodyHtml;
      readerBody.appendChild(iframe);
    }

    // ── Master render ─────────────────────────────────────────────────────
    function render(): void {
      renderFolders();
      renderList();
      renderReader();
    }

    // ── Open compose ──────────────────────────────────────────────────────
    function openCompose(prefillTo?: string, prefillEmail?: string): void {
      void launch({
        appId: 'outlook-compose',
        args: {
          ...(prefillTo ? { prefillTo } : {}),
          ...(prefillEmail ? { prefillEmail } : {}),
        },
      });
    }

    // ── Init ──────────────────────────────────────────────────────────────
    renderContacts();
    render();

    return {
      onFocus() {
        root.classList.remove('outlook--blurred');
      },
      onBlur() {
        root.classList.add('outlook--blurred');
      },
    };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const loc = getLocale();
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default mod;
