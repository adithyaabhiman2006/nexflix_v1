export const LOCALES = ['en', 'si'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const hasLocale = (value: string | undefined | null): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

/** Swaps the language prefix of a path: /en/browse/cinema -> /si/browse/cinema. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parts = pathname.split('/');
  if (hasLocale(parts[1])) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join('/') || `/${to}`;
}

/** Prefixes an app path with the language: href('si', '/plans') -> /si/plans. */
export const href = (lang: Locale, path = '/') => (path === '/' ? `/${lang}` : `/${lang}${path}`);

export const intlLocale = (lang: Locale) => (lang === 'si' ? 'si-LK' : 'en-GB');
