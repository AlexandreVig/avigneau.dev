import en, { type I18nKey } from './en';
import fr from './fr';

export type { I18nKey } from './en';
export type Locale = 'en' | 'fr';

const STORAGE_KEY = 'xp-locale';

const maps: Record<Locale, Record<I18nKey, string>> = { en, fr };

let current: Locale | null = null;

export function getLocale(): Locale {
  if (current) return current;

  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') {
      current = stored;
      return current;
    }
  }

  // Detect from browser language
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.slice(0, 2).toLowerCase();
    if (lang === 'fr') {
      current = 'fr';
      return current;
    }
  }

  current = 'en';
  return current;
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
  location.reload();
}

/**
 * Translate a key. Supports `{0}`, `{1}` interpolation.
 *
 * ```ts
 * t('explorer.itemCount', count)  // "3 items"
 * ```
 */
export function t(key: I18nKey, ...args: (string | number)[]): string {
  const locale = getLocale();
  let str: string = maps[locale]?.[key] ?? maps.en[key] ?? key;

  for (let i = 0; i < args.length; i++) {
    str = str.replace(`{${i}}`, String(args[i]));
  }

  return str;
}
