import { t } from '../../../../i18n';
import type { Folder, Email, Contact } from './types';

export function getFolders(): Folder[] {
  return [
    {
      id: 'inbox',
      name: t('outlook.folder.inbox'),
      icon: '/icons/outlook/folder-inbox.webp',
      unread: 1,
    },
    { id: 'outbox', name: t('outlook.folder.outbox'), icon: '/icons/outlook/folder-outbox.webp' },
    { id: 'sent', name: t('outlook.folder.sent'), icon: '/icons/outlook/folder-sent.webp' },
    {
      id: 'deleted',
      name: t('outlook.folder.deleted'),
      icon: '/icons/outlook/folder-deleted.webp',
    },
    { id: 'drafts', name: t('outlook.folder.drafts'), icon: '/icons/outlook/folder-drafts.webp' },
  ];
}

export function getEmails(): Email[] {
  return [
    // ── Inbox ──────────────────────────────────────────────────────────────────
    {
      id: 'alexandre-note',
      folder: 'inbox',
      from: { name: 'Alexandre Vigneau', email: 'alexandre.vigneau@epitech.eu' },
      to: 'You',
      subject: t('email.alexandreNote.subject'),
      date: '2026-04-09T12:00:00Z',
      unread: false,
      bodyHtml: t('email.alexandreNote.body'),
    },
    {
      id: 'bill-gates',
      folder: 'inbox',
      from: { name: 'Bill Gates', email: 'bill@microsoft.com' },
      to: 'Alexandre Vigneau',
      subject: t('email.billGates.subject'),
      date: '2026-04-09T09:30:00Z',
      unread: false,
      bodyHtml: t('email.billGates.body'),
    },
    {
      id: 'nigerian-prince',
      folder: 'inbox',
      from: { name: 'Prince Abubakar III', email: 'prince@totallylegit.ng' },
      to: 'Dear Friend',
      subject: t('email.nigerianPrince.subject'),
      date: '2026-04-08T22:15:00Z',
      unread: true,
      bodyHtml: t('email.nigerianPrince.body'),
    },

    // ── Sent Items ─────────────────────────────────────────────────────────────
    {
      id: 'sent-reply',
      folder: 'sent',
      from: { name: 'Alexandre Vigneau', email: 'alexandre.vigneau@epitech.eu' },
      to: 'Bill Gates <bill@microsoft.com>',
      subject: t('email.sentReply.subject'),
      date: '2026-04-09T10:15:00Z',
      unread: false,
      bodyHtml: t('email.sentReply.body'),
    },

    // ── Deleted Items ──────────────────────────────────────────────────────────
    {
      id: 'deleted-important',
      folder: 'deleted',
      from: { name: 'System Administrator', email: 'admin@localhost' },
      to: 'Alexandre Vigneau',
      subject: t('email.deletedImportant.subject'),
      date: '2026-04-06T08:00:00Z',
      unread: false,
      bodyHtml: t('email.deletedImportant.body'),
    },

    // ── Drafts ─────────────────────────────────────────────────────────────────
    {
      id: 'draft-todo',
      folder: 'drafts',
      from: { name: 'Alexandre Vigneau', email: 'alexandre.vigneau@epitech.eu' },
      to: '',
      subject: t('email.draftTodo.subject'),
      date: '2026-04-05T16:30:00Z',
      unread: false,
      bodyHtml: t('email.draftTodo.body'),
    },
  ];
}

export const contacts: Contact[] = [
  { name: 'Clippy', email: 'clippy@microsoft.com', icon: '/icons/outlook/contact.webp' },
  { name: 'Bill Gates', email: 'bill@microsoft.com', icon: '/icons/outlook/contact.webp' },
  { name: 'Alexandre', email: 'alexandre.vigneau@epitech.eu', icon: '/icons/outlook/contact.webp' },
];
