import type { AppConfig } from '../lib/types';

export const apps: AppConfig[] = [
  {
    id: 'about',
    title: 'About Me',
    icon: '/icons/user.png',
    defaultWidth: 480,
    defaultHeight: 320,
  },
  {
    id: 'projects',
    title: 'My Projects',
    icon: '/icons/folder-32.png',
    defaultWidth: 600,
    defaultHeight: 420,
  },
  {
    id: 'skills',
    title: 'Skills',
    icon: '/icons/notepad.png',
    defaultWidth: 400,
    defaultHeight: 300,
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: '/icons/mail.png',
    defaultWidth: 420,
    defaultHeight: 280,
  },
];
