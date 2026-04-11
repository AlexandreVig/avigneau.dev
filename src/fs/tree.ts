import { getLocale } from '../i18n';
import type { FolderNode } from './types';

export const root: FolderNode = {
  kind: 'folder',
  name: '/',
  children: [
    {
      kind: 'folder',
      name: 'Recycle Bin',
      icon: '/icons/recycle-bin-32.png',
      children: [
        {
          kind: 'file',
          name: 'totally-not-a-virus.exe',
          ext: '.exe',
          load: () => Promise.resolve(''),
        }
      ],
    },
    {
      kind: 'folder',
      name: 'Desktop',
      icon: '/icons/folder-32.png',
      children: [
        {
          kind: 'shortcut',
          name: 'Recycle Bin',
          icon: '/icons/recycle-bin-32.png',
          target: { appId: 'explorer', path: '/Recycle Bin' },
          desktopPosition: { row: 1, col: 1 },
          displayShortcutArrow: false,
        },
        {
          kind: 'shortcut',
          name: 'My Computer',
          icon: '/icons/my-computer.png',
          target: { appId: 'explorer', path: '/' },
          desktopPosition: { row: 2, col: 1 },
        },
        {
          kind: 'shortcut',
          name: 'My Documents',
          icon: '/icons/folder-32.png',
          target: { appId: 'explorer', path: '/My Documents' },
          desktopPosition: { row: 3, col: 1 },
        },
        {
          kind: 'shortcut',
          name: 'Projects',
          icon: '/icons/folder-32.png',
          target: { appId: 'explorer', path: '/My Documents/Projects' },
          desktopPosition: { row: 4, col: 1 },
        },
        {
          kind: 'file',
          name: 'About Me.md',
          icon: '/icons/user-2.png',
          ext: '.md',
          desktopPosition: { row: 1, col: 2 },
          load: () =>
            getLocale() === 'fr'
              ? import('../content/fr/about.md?raw').then((m) => m.default)
              : import('../content/about.md?raw').then((m) => m.default),
        },
        {
          kind: 'file',
          name: 'Skills.md',
          icon: '/icons/notepad.png',
          ext: '.md',
          desktopPosition: { row: 2, col: 2 },
          load: () =>
            getLocale() === 'fr'
              ? import('../content/fr/skills.md?raw').then((m) => m.default)
              : import('../content/skills.md?raw').then((m) => m.default),
        },
        {
          kind: 'file',
          name: 'Contact.md',
          icon: '/icons/mail.png',
          ext: '.md',
          desktopPosition: { row: 3, col: 2 },
          load: () =>
            getLocale() === 'fr'
              ? import('../content/fr/contact.md?raw').then((m) => m.default)
              : import('../content/contact.md?raw').then((m) => m.default),
        },
        {
          kind: 'shortcut',
          name: 'Outlook Express',
          icon: '/icons/outlook.png',
          target: { appId: 'outlook-express' },
          desktopPosition: { row: 5, col: 1 },
        },
        {
          kind: 'shortcut',
          name: 'Minesweeper',
          icon: '/icons/minesweeper/mine-icon.png',
          target: { appId: 'minesweeper' },
          desktopPosition: { row: 6, col: 1 },
        },
        {
          kind: 'file',
          name: 'Resume.pdf',
          ext: '.pdf',
          desktopPosition: { row: 4, col: 2 },
          load: () => Promise.resolve("/pdf/test.pdf"),
        },
      ],
    },
    {
      kind: 'folder',
      name: 'My Documents',
      icon: '/icons/folder-32.png',
      children: [
        {
          kind: 'folder',
          name: 'Projects',
          icon: '/icons/folder-32.png',
          children: [
            {
              kind: 'file',
              name: 'Portfolio Website.md',
              ext: '.md',
              load: () =>
                getLocale() === 'fr'
                  ? import('../content/fr/projects/portfolio.md?raw').then((m) => m.default)
                  : import('../content/projects/portfolio.md?raw').then((m) => m.default),
            },
          ],
        },
        {
          kind: 'file',
          name: 'Skills.md',
          icon: '/icons/notepad.png',
          ext: '.md',
          load: () =>
            getLocale() === 'fr'
              ? import('../content/fr/skills.md?raw').then((m) => m.default)
              : import('../content/skills.md?raw').then((m) => m.default),
        },
        {
          kind: 'file',
          name: 'Contact.md',
          icon: '/icons/mail.png',
          ext: '.md',
          load: () =>
            getLocale() === 'fr'
              ? import('../content/fr/contact.md?raw').then((m) => m.default)
              : import('../content/contact.md?raw').then((m) => m.default),
        },
        {
          kind: 'file',
          name: 'About Me.md',
          icon: '/icons/user-2.png',
          ext: '.md',
          load: () =>
            getLocale() === 'fr'
              ? import('../content/fr/about.md?raw').then((m) => m.default)
              : import('../content/about.md?raw').then((m) => m.default),
        },
        {
          kind: 'file',
          name: 'Resume.pdf',
          ext: '.pdf',
          load: () => Promise.resolve("/pdf/test.pdf"),
        },
      ],
    },
  ],
};
