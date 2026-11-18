import { NextResponse, type NextRequest } from 'next/server';
import { COUNTRY_COOKIE, LANG_COOKIE } from '@/config/consent';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/i18n/locales';

const SESSION_COOKIE = 'nx_session';

const YEAR = 60 * 60 * 24 * 365;

/** Saved choice first, then the browser's languages, then English. */
function pickLocale(req: NextRequest): Locale {
  const saved = req.cookies.get(LANG_COOKIE)?.value;
  if (hasLocale(saved)) return saved;
  const accept = req.headers.get('accept-language') ?? '';
  return /(^|,)\s*si\b/i.test(accept) ? 'si' : DEFAULT_LOCALE;
}

/**
 * The viewer's country as reported by the CDN in front of the site.
 * Used for display choices only (cookie card, prices shown). Licence and payment checks
 * are made again on the server by the core service and never trust this cookie.
 */
function pickCountry(req: NextRequest): string {
  if (process.env.NODE_ENV !== 'production') {
    const forced = req.nextUrl.searchParams.get('country');
    if (forced && /^[A-Z]{2}$/.test(forced)) return forced;
  }
  const fromCdn =
    req.headers.get('cloudfront-viewer-country') ??
    req.headers.get('cf-ipcountry') ??
    req.headers.get('x-vercel-ip-country');
  if (fromCdn && /^[A-Z]{2}$/.test(fromCdn)) return fromCdn;
  return process.env.DEV_COUNTRY || 'LK';
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split('/')[1];
  let res: NextResponse;

  if (hasLocale(first) && (pathname === `/${first}` || pathname === `/${first}/`) && !req.cookies.has(SESSION_COOKIE)) {
    // Quick path for visitors who have never signed in. Pages still check the session properly.
    const url = req.nextUrl.clone();
    url.pathname = `/${first}/welcome`;
    res = NextResponse.redirect(url);
  } else if (hasLocale(first)) {
    res = NextResponse.next();
    if (req.cookies.get(LANG_COOKIE)?.value !== first) {
      res.cookies.set(LANG_COOKIE, first, { path: '/', maxAge: YEAR, sameSite: 'lax' });
    }
  } else {
    const url = req.nextUrl.clone();
    url.pathname = `/${pickLocale(req)}${pathname === '/' ? '' : pathname}`;
    res = NextResponse.redirect(url);
  }

  const country = pickCountry(req);
  if (req.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    res.cookies.set(COUNTRY_COOKIE, country, { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  }
  return res;
}

export const config = {
  // Skips the API, Next.js internals and files with an extension (images, icons, robots.txt).
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
};
