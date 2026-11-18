import 'server-only';
import { cookies } from 'next/headers';
import { db } from '../db';
import { readCookie, requestMeta } from '../request';
import { randomToken, sha256 } from './tokens';

export const SESSION_COOKIE = 'nx_session';
const DAY = 86_400_000;
/** "Keep me signed in": 30 days, extended while in use. Otherwise until the browser closes, and at most 12 hours. */
const PERSISTENT_MS = 30 * DAY;
const BROWSER_MS = 12 * 3_600_000;
/** lastSeenAt is written at most this often, so browsing doesn't write to the database on every page. */
const TOUCH_MS = 10 * 60_000;

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'viewer' | 'admin';
  country: string;
  language: string;
};

function cookieOptions(persistent: boolean, expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(persistent ? { expires: expiresAt } : {}),
  };
}

/** Signs a user in on this browser. Call only from a Server Action or Route Handler. */
export async function startSession(userId: string, persistent: boolean): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + (persistent ? PERSISTENT_MS : BROWSER_MS));
  const { ip, userAgent } = await requestMeta();
  await db.session.create({ data: { id: sha256(token), userId, persistent, expiresAt, ip, userAgent } });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(persistent, expiresAt));
}

async function currentSessionId(): Promise<string | null> {
  const token = await readCookie(SESSION_COOKIE);
  return token ? sha256(token) : null;
}

/** The signed-in user, or null. Safe to call from any server code; never trusts anything but the database. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await currentSessionId();
  if (!id) return null;
  const s = await db.session.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, country: true, language: true } } },
  });
  if (!s || s.expiresAt.getTime() <= Date.now()) return null;
  if (Date.now() - s.lastSeenAt.getTime() > TOUCH_MS) {
    const data: { lastSeenAt: Date; expiresAt?: Date } = { lastSeenAt: new Date() };
    if (s.persistent) data.expiresAt = new Date(Date.now() + PERSISTENT_MS);
    // Fire and forget: a failed touch must never break the page.
    db.session.update({ where: { id }, data }).catch(() => {});
  }
  const u = s.user;
  return { ...u, name: u.name || displayName(u.email, u.phone) };
}

export function displayName(email: string | null, phone: string | null): string {
  if (email) return email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\p{L}/gu, c => c.toUpperCase());
  return phone ? `•••• ${phone.slice(-4)}` : 'Member';
}

/** Signs this browser out. */
export async function endSession(): Promise<void> {
  const id = await currentSessionId();
  if (id) await db.session.deleteMany({ where: { id } });
  (await cookies()).delete(SESSION_COOKIE);
}

/** Signs the user out everywhere except, optionally, this browser. */
export async function endOtherSessions(userId: string, keepCurrent: boolean): Promise<void> {
  const keep = keepCurrent ? await currentSessionId() : null;
  await db.session.deleteMany({ where: { userId, ...(keep ? { NOT: { id: keep } } : {}) } });
}
