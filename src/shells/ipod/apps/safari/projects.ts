/**
 * Safari project registry.
 *
 * Single source of truth for the projects listed in the Safari Bookmarks
 * view and rendered on each page. Kept colocated with the Safari app
 * (mirroring `shells/desktop/apps/outlook/data.ts`) because the shape
 * here — fake URL, blurb, lazy `?raw` loader — is Safari-specific chrome
 * on top of the underlying markdown content. To add a project:
 *
 *   1. Drop the markdown file into `src/content/projects/`.
 *   2. Append a new entry below with its id / title / description / url
 *      and a `loader` that dynamic-imports the file.
 *
 * The Bookmarks list picks up the new entry automatically.
 */

import { getLocale } from '../../../../i18n';

export interface Project {
  /** Stable id used for DOM hooks and row lookup. */
  id: string;
  /** Shown in the nav bar and as the bookmark row title. */
  title: string;
  /** Short blurb under the title on the Bookmarks list. */
  description: string;
  /** Fake URL shown in the Safari URL bar when the page is open. */
  url: string;
  /**
   * Lazy loader for the project's markdown source. Dynamic-imported so
   * each project's content lands in its own Vite chunk and only the one
   * the visitor actually opens is ever fetched.
   */
  load: () => Promise<string>;
}

export const PROJECTS: Project[] = [
  {
    id: 'portfolio',
    title: getLocale() === 'fr' ? 'Site portfolio' : 'Portfolio Website',
    description:
      getLocale() === 'fr'
        ? 'Ce site \u2014 un portfolio retro.'
        : 'This site \u2014 a retro portfolio.',
    url: 'alexandre.dev/projects/portfolio',
    load: () =>
      getLocale() === 'fr'
        ? import('../../../../content/fr/projects/portfolio.md?raw').then((m) => m.default)
        : import('../../../../content/projects/portfolio.md?raw').then((m) => m.default),
  },
  {
    id: 'myvpn',
    title: getLocale() === 'fr' ? 'Mon VPN' : 'MyVPN',
    description:
      getLocale() === 'fr'
        ? 'Une reimplémentation de WireGuard en Python.'
        : 'A WireGuard reimplementation in Python.',
    url: 'alexandre.dev/projects/myvpn',
    load: () =>
      getLocale() === 'fr'
        ? import('../../../../content/fr/projects/myvpn.md?raw').then((m) => m.default)
        : import('../../../../content/projects/myvpn.md?raw').then((m) => m.default),
  },
];
