import 'server-only';
import { headers } from 'next/headers';

/** The caller's IP and browser, for rate limits and the account's device list. */
export async function requestMeta() {
  const h = await headers();
  // The CDN puts the real client first. Trust only what our own CDN sets; configure it to overwrite this header.
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  const userAgent = (h.get('user-agent') ?? '').slice(0, 300) || null;
  return { ip, userAgent };
}

/**
 * Reads one cookie from the request headers. Use this instead of cookies() when only reading:
 * in Next.js 16.4, cookies() can throw an internal "InvariantError ... cookies or mutableCookies"
 * while a page re-renders after a form submission (a Next.js bug). Writing still uses cookies().
 */
export async function readCookie(name: string): Promise<string | undefined> {
  const header = (await headers()).get('cookie') ?? '';
  const match = header.split(/;\s*/).find(c => c.startsWith(`${name}=`));
  if (!match) return undefined;
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return undefined; }
}
