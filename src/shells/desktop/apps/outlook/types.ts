export type FolderId = 'inbox' | 'outbox' | 'sent' | 'deleted' | 'drafts';

export interface Folder {
  id: FolderId;
  name: string;
  icon: string;
  unread?: number;
}

export interface Email {
  id: string;
  folder: FolderId;
  from: { name: string; email: string };
  to: string;
  subject: string;
  date: string;
  unread: boolean;
  bodyHtml: string;
  attachments?: { name: string; size: string }[];
}

export interface Contact {
  name: string;
  email: string;
  icon: string;
}
