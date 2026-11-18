'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { COUNTRY_COOKIE } from '@/config/consent';
import {
  completeReset, confirmPhoneSignUp, sendLoginCode, signInWithCode, signInWithPassword, signUp,
  startReset, verifyResetCode, type AuthError,
} from '@/core/auth/service';
import { endSession } from '@/core/auth/session';
import { hasLocale, href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { PREFILL_COOKIE } from './prefill';

/** What a form shows after it is sent. */
export type FormState = {
  error?: string;
  /** Second step of a two-step form, e.g. "enter the code we texted". */
  step?: 'code' | 'checkEmail';
  masked?: string;
  /** What was typed, so a failed form keeps it. Never includes passwords. */
  values?: Record<string, string>;
};

const PENDING_COOKIE = 'nx_pending';
type Pending = { purpose: 'login' | 'signup' | 'reset'; tokenId: string };

const ERR: Record<AuthError, StringKey> = {
  invalidIdentifier: 'errInvalidIdentifier', phoneOnly: 'errPhoneOnly', badCredentials: 'errBadCredentials',
  rateLimited: 'errRateLimited', taken: 'errTaken', terms: 'errTerms', country: 'errCountry',
  tooShort: 'errTooShort', tooLong: 'errTooLong', sameAsEmail: 'errSameAsEmail', mismatch: 'errMismatch',
  codeWrong: 'errCodeWrong', codeExpired: 'errCodeExpired', linkExpired: 'errLinkExpired',
};

function errorText(lang: Locale, error: AuthError, retryAfter?: number): string {
  if (error === 'rateLimited') {
    const s = retryAfter ?? 60;
    const wait = s < 90 ? translate(lang, 'seconds', { n: s }) : translate(lang, 'minutesWord', { n: Math.ceil(s / 60) });
    return translate(lang, 'errRateLimited', { n: wait });
  }
  return translate(lang, ERR[error]);
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');
const langOf = (fd: FormData): Locale => { const l = str(fd, 'lang'); return hasLocale(l) ? l : 'en'; };
const countryCookie = async () => (await cookies()).get(COUNTRY_COOKIE)?.value || 'LK';

async function setPending(p: Pending) {
  (await cookies()).set(PENDING_COOKIE, JSON.stringify(p), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 15 * 60,
  });
}
async function takePending(purpose: Pending['purpose']): Promise<string | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const p = z.object({ purpose: z.enum(['login', 'signup', 'reset']), tokenId: z.uuid() }).parse(JSON.parse(raw));
    return p.purpose === purpose ? p.tokenId : null;
  } catch { return null; }
}
async function clearPending() { (await cookies()).delete(PENDING_COOKIE); }

/**
 * Where to go after signing in: the ?next= of the page the form was sent from (e.g. /en/login?next=/en/plans).
 * Read from the Referer header so the form works even before the page's JavaScript has loaded.
 * Only our own pages are allowed, never another website.
 */
async function nextAfterSignIn(lang: Locale): Promise<string> {
  let next = '';
  try {
    const ref = new URL((await headers()).get('referer') ?? '');
    next = ref.searchParams.get('next') ?? '';
  } catch { /* no referer */ }
  return /^\/(en|si)(\/[\w\-/?=&%.]*)?$/.test(next) && !next.startsWith('//') ? next : href(lang);
}

/* ---------- Sign in ---------- */

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const identifier = str(fd, 'identifier');
  const r = await signInWithPassword(identifier, str(fd, 'password'), fd.get('remember') === 'on', await countryCookie());
  if (!r.ok) return { error: errorText(lang, r.error, r.retryAfter), values: { identifier } };
  redirect(await nextAfterSignIn(lang));
}

export async function sendLoginCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const phone = str(fd, 'phone');
  const r = await sendLoginCode(phone, await countryCookie(), lang);
  if (!r.ok) return { error: errorText(lang, r.error, r.retryAfter), values: { phone } };
  await setPending({ purpose: 'login', tokenId: r.tokenId });
  return { step: 'code', masked: r.masked };
}

export async function signInWithCodeAction(prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const tokenId = await takePending('login');
  if (!tokenId) return { error: errorText(lang, 'codeExpired') };
  const r = await signInWithCode(tokenId, str(fd, 'code'), fd.get('remember') === 'on');
  if (!r.ok) return { ...prev, error: errorText(lang, r.error) };
  await clearPending();
  redirect(await nextAfterSignIn(lang));
}

/* ---------- Create account ---------- */

/** Welcome page (canvas 05-18): "Start free trial" carries what was typed to the sign-up form. */
export async function startTrialAction(fd: FormData) {
  const lang = langOf(fd);
  const typed = str(fd, 'identifier').trim().slice(0, 254);
  if (typed) {
    (await cookies()).set(PREFILL_COOKIE, typed, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 10 * 60,
    });
  }
  redirect(href(lang, '/signup'));
}

export async function signUpAction(_: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const language = str(fd, 'language') === 'si' ? 'si' : 'en';
  const values = { identifier: str(fd, 'identifier'), country: str(fd, 'country'), language, news: fd.get('news') === 'on' ? 'on' : '' };
  const r = await signUp({
    identifier: values.identifier, password: str(fd, 'password'), country: values.country, language,
    marketing: values.news === 'on', terms: fd.get('terms') === 'on',
  });
  if (!r.ok) return { error: errorText(lang, r.error, r.retryAfter), values };
  if (r.next === 'verifyPhone') {
    await setPending({ purpose: 'signup', tokenId: r.tokenId });
    return { step: 'code', masked: r.masked, values };
  }
  (await cookies()).delete(PREFILL_COOKIE);
  // The plans screen arrives in week 5; until then a new member lands on the home page.
  redirect(href(language));
}

export async function confirmSignUpAction(prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const tokenId = await takePending('signup');
  if (!tokenId) return { ...prev, step: undefined, error: errorText(lang, 'codeExpired') };
  const r = await confirmPhoneSignUp(tokenId, str(fd, 'code'));
  if (!r.ok) return { ...prev, error: errorText(lang, r.error) };
  await clearPending();
  (await cookies()).delete(PREFILL_COOKIE);
  redirect(href(r.language));
}

/* ---------- Reset password ---------- */

export async function startResetAction(_: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const identifier = str(fd, 'identifier');
  const r = await startReset(identifier, await countryCookie(), lang);
  if (!r.ok) return { error: errorText(lang, r.error, r.retryAfter), values: { identifier } };
  if (r.kind === 'email') return { step: 'checkEmail', masked: r.masked };
  await setPending({ purpose: 'reset', tokenId: r.tokenId });
  return { step: 'code', masked: r.masked };
}

export async function verifyResetCodeAction(prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const tokenId = await takePending('reset');
  if (!tokenId) return { error: errorText(lang, 'codeExpired') };
  const r = await verifyResetCode(tokenId, str(fd, 'code'));
  if (!r.ok) return { ...prev, error: errorText(lang, r.error) };
  await clearPending();
  redirect(`${href(lang, '/reset/new')}?token=${encodeURIComponent(r.token)}`);
}

export async function completeResetAction(_: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const r = await completeReset(str(fd, 'token'), str(fd, 'password'), str(fd, 'again'), fd.get('others') === 'on');
  if (!r.ok) return { error: errorText(lang, r.error) };
  redirect(href(lang));
}

/* ---------- Sign out ---------- */

export async function signOutAction(fd: FormData) {
  await endSession();
  redirect(href(langOf(fd), '/welcome'));
}
