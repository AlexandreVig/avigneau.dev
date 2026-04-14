/**
 * Notes registry.
 *
 * Single source of truth for the notes listed in the Notes app. Each
 * entry has a stable id, a display title, a snippet shown under the
 * title on the list view, and a locale-aware loader that dynamic-imports
 * the underlying markdown so each note ships in its own Vite chunk.
 *
 * To add a note: drop the markdown into `src/content/` (with an `fr/`
 * copy if you want the French variant), then append an entry below.
 */

import { getLocale, t } from '../../../../i18n';

export interface Note {
  /** Stable id used for DOM hooks and row lookup. */
  id: string;
  /** Shown in the nav bar and as the list-row title. */
  title: string;
  /** Short blurb under the title on the list. */
  snippet: string;
  /**
   * Locale-aware markdown loader. Each note has both an EN and FR copy
   * under `src/content/` and `src/content/fr/`; the loader picks whichever
   * matches the current locale at call time so a language switch on the
   * desktop carries over when the visitor opens the same note on mobile.
   */
  load: () => Promise<string>;
}

/**
 * Tiny helper that keeps every note's loader shape identical — avoids
 * repeating the same locale-branch boilerplate inside each `load()`.
 */
const localized = (
  en: () => Promise<{ default: string }>,
  fr: () => Promise<{ default: string }>,
): (() => Promise<string>) =>
  () => (getLocale() === 'fr' ? fr() : en()).then((m) => m.default);

export const NOTES: Note[] = [
  {
    id: 'about',
    title: t('ipod.notes.items.about.title'),
    snippet: t('ipod.notes.items.about.snippet'),
    load: localized(
      () => import('../../../../content/about.md?raw'),
      () => import('../../../../content/fr/about.md?raw'),
    ),
  },
  {
    id: 'skills',
    title: t('ipod.notes.items.skills.title'),
    snippet: t('ipod.notes.items.skills.snippet'),
    load: localized(
      () => import('../../../../content/skills.md?raw'),
      () => import('../../../../content/fr/skills.md?raw'),
    ),
  },
];
