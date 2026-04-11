import { findExplorerInstanceAt } from './explorer/instances';
import type { AppManifest } from './types';

export const apps: AppManifest[] = [
  {
    id: 'explorer',
    title: 'My Computer',
    icon: '/icons/my-computer.png',
    defaultWidth: 640,
    defaultHeight: 440,
    // multi + findExistingInstance: each launch creates a new explorer window,
    // unless one is already showing the requested folder — in which case we
    // focus it. Lets users open the same folder twice intentionally (start
    // menu / desktop) while still deduping by *current* path, not by the path
    // it was originally opened at.
    kind: 'multi',
    showInStartMenu: true,
    loader: () => import('./explorer'),
    findExistingInstance: (args) => {
      const target = typeof args.path === 'string' ? args.path : '/';
      return findExplorerInstanceAt(target);
    },
  },
  {
    id: 'notepad',
    title: 'Notepad',
    icon: '/icons/notepad.png',
    defaultWidth: 560,
    defaultHeight: 440,
    kind: 'document',
    acceptsFileTypes: ['.md', '.txt'],
    showInStartMenu: false,
    loader: () => import('./notepad'),
  },
  {
    id: 'about',
    title: 'About',
    icon: '/icons/notepad.png',
    defaultWidth: 420,
    defaultHeight: 320,
    // Keyed by args.path (e.g. "about:notepad") so each parent app gets
    // at most one About dialog at a time.
    kind: 'document',
    showInStartMenu: false,
    // Dialog-style chrome: close button only, no title-bar icon, not resizable,
    // no taskbar entry.
    controls: ['close'],
    showWindowIcon: false,
    resizable: false,
    showInTaskbar: false,
    loader: () => import('./about'),
  },
  {
    id: 'outlook-express',
    title: 'Outlook Express',
    icon: '/icons/outlook.png',
    defaultWidth: 720,
    defaultHeight: 520,
    kind: 'singleton',
    showInStartMenu: true,
    loader: () => import('./outlook'),
  },
  {
    id: 'outlook-compose',
    title: 'New Message',
    icon: '/icons/outlook/create-mail.png',
    defaultWidth: 560,
    defaultHeight: 460,
    kind: 'multi',
    showInStartMenu: false,
    loader: () => import('./outlook-compose'),
  },
  {
    id: 'adobe-reader',
    title: 'Adobe Reader',
    icon: '/icons/adobe-reader.png',
    defaultWidth: 760,
    defaultHeight: 580,
    kind: 'document',
    acceptsFileTypes: ['.pdf'],
    showInStartMenu: false,
    loader: () => import('./adobe-reader'),
  },
  {
    id: 'bsod',
    title: 'BSOD',
    icon: '/icons/notepad.png',
    defaultWidth: 0,
    defaultHeight: 0,
    kind: 'multi',
    acceptsFileTypes: ['.exe'],
    showInStartMenu: false,
    showInTaskbar: false,
    loader: () => import('./bsod'),
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    icon: '/icons/minesweeper/mine-icon.png',
    defaultWidth: 220,
    defaultHeight: 260,
    kind: 'singleton',
    showInStartMenu: true,
    resizable: false,
    loader: () => import('./minesweeper'),
  },
];
