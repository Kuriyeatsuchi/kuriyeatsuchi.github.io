/**
 * English and Arabic: which language a page is in, and its content.
 *
 * How it works, in plain English:
 * - English pages live at /, /retina, …; the Arabic copies live at /ar/, /ar/retina, ….
 *   Each Arabic page simply renders the English page file; every component then asks
 *   `langOf(Astro.url)` which language it is in and reads its text from `content(lang)`.
 * - Scripts in the browser read the language from <html lang>.
 * - `localize` turns a site path into the same path in the other language.
 */

import * as en from './site';
import * as ar from './site.ar';
import { library as libraryEn, type LibraryEntry } from './library';
import { libraryAr } from './library.ar';

export type Lang = 'en' | 'ar';

const libraryArEntries: readonly LibraryEntry[] = libraryEn.map((e) => ({ ...e, ...(libraryAr[e.slug] ?? {}) }));

const bundles = {
  en: { ...en, library: libraryEn },
  ar: { ...ar, library: libraryArEntries },
};

export type Content = (typeof bundles)['en'];

export function content(lang: Lang): Content {
  return bundles[lang] as Content;
}

/** The language of a page, from its URL. */
export function langOf(url: URL | string): Lang {
  const path = typeof url === 'string' ? url : url.pathname;
  return path === '/ar' || path.startsWith('/ar/') ? 'ar' : 'en';
}

/** The language of the current page, in the browser. */
export function pageLang(): Lang {
  return document.documentElement.lang === 'ar' ? 'ar' : 'en';
}

/** A site path ("/retina", "/#projects", "/") in the given language. External links pass through. */
export function localize(path: string, lang: Lang): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const bare = path === '/ar' ? '/' : path.startsWith('/ar/') ? path.slice(3) : path;
  if (lang === 'en') return bare;
  // Files (CV, deck, images) are shared by both languages.
  if (/\.[a-z0-9]+($|[?#])/i.test(bare)) return bare;
  return bare === '/' ? '/ar/' : bare.startsWith('/#') ? `/ar/${bare.slice(1)}` : `/ar${bare}`;
}
