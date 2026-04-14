import type { IpodAppManifest } from './types';

/**
 * iPod app registry.
 *
 * Each entry points at a real per-app module (Step 8). Loaders are dynamic
 * imports so every app ships as its own Vite chunk — the shell only pays
 * for the code of apps the visitor actually opens.
 *
 * Icons are the authentic iOS 1.0 firmware PNGs copied into
 * `public/ipod/icons/` in Step 6.
 */

const icon = (name: string) => `/ipod/icons/${name}.png`;

export const ipodApps: IpodAppManifest[] = [
  // Dock — 4 slots, left-to-right.
  {
    id: 'safari',
    title: 'Safari',
    titleKey: 'ipod.app.safari',
    icon: icon('safari'),
    location: 'dock',
    order: 0,
    loader: () => import('./safari'),
  },
  {
    id: 'mail',
    title: 'Mail',
    titleKey: 'ipod.app.mail',
    icon: icon('mail'),
    location: 'dock',
    order: 1,
    loader: () => import('./mail'),
  },
  {
    id: 'notes',
    title: 'Notes',
    titleKey: 'ipod.app.notes',
    icon: icon('notes'),
    location: 'dock',
    order: 2,
    loader: () => import('./notes'),
  },
  {
    id: 'music',
    title: 'Music',
    titleKey: 'ipod.app.music',
    icon: icon('music'),
    location: 'dock',
    order: 3,
    loader: () => import('./music'),
  },

  // Home screen grid.
  {
    id: 'calculator',
    title: 'Calculator',
    titleKey: 'ipod.app.calculator',
    icon: icon('calculator'),
    location: 'home',
    order: 0,
    loader: () => import('./calculator'),
  },
  // Weather / Stocks / Maps / YouTube all share the decorative "cannot
  // connect to server" module — they're visual callbacks only.
  {
    id: 'weather',
    title: 'Weather',
    titleKey: 'ipod.app.weather',
    icon: icon('weather'),
    location: 'home',
    order: 1,
    loader: () => import('./decorative'),
  },
  {
    id: 'stocks',
    title: 'Stocks',
    titleKey: 'ipod.app.stocks',
    icon: icon('stocks'),
    location: 'home',
    order: 2,
    loader: () => import('./decorative'),
  },
  {
    id: 'maps',
    title: 'Maps',
    titleKey: 'ipod.app.maps',
    icon: icon('maps'),
    location: 'home',
    order: 3,
    loader: () => import('./decorative'),
  },
  {
    id: 'youtube',
    title: 'YouTube',
    titleKey: 'ipod.app.youtube',
    icon: icon('youtube'),
    location: 'home',
    order: 4,
    loader: () => import('./decorative'),
  },
];
