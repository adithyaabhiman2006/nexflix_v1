import 'server-only';
import { Prisma, type TokenPurpose } from '@/generated/prisma/client';
import { db } from '../db';
import { codeSms, resetEmail } from '../messages/templates';
import { queueEmail, queueSms } from '../messages/outbox';
import { clear, hit } from '../rate-limit';
import { requestMeta } from '../request';
import { maskIdentifier, parseIdentifier, type Identifier } from './identifier';
import { burnPasswordCheck, hashPassword, passwordProblem, verifyPassword, type PasswordProblem } from './password';
import { endOtherSessions, startSession } from './session';
import { randomToken, sameHash, sha256, sixDigitCode } from './tokens';

/*
 * Every account rule lives here. Screens call these functions and translate the error codes;
 * they never touch the users, sessions or tokens tables themselves.
 *
 * Sign-in, code and reset requests answer the same way whether or not an account exists,
 * so nobody can use them to find out who is a member.
 */

const CODE_MINUTES = 10; // canvas 10-42: "Valid 10 minutes"
const LINK_MINUTES = 30; // canvas 09-33: "It works for 30 minutes"
const MAX_CODE_TRIES = 5;
const MIN = 60;

export type AuthError =
  | 'invalidIdentifier' | 'phoneOnly' | 'badCredentials' | 'rateLimited' | 'taken' | 'terms' | 'country'
  | PasswordProblem | 'mismatch' | 'codeWrong' | 'codeExpired' | 'linkExpired';

type Fail = { ok: false; error: AuthError; retryAfter?: number };
const fail = (error: AuthError, retryAfter?: number): Fail => ({ ok: false, error, retryAfter });
type Lang = 'en' | 'si';

const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000);

async function limited(checks: [string, number, number][]): Promise<Fail | null> {
  for (const [key, limit, windowSeconds] of checks) {
    const r = await hit(key, limit, windowSeconds);
    if (!r.ok) return fail('rateLimited', r.retryAfter);
  }
  return null;
}

const findByIdentifier = (id: Identifier) =>
  db.user.findUnique({ where: id.kind === 'email' ? { email: id.value } : { phone: id.value } });

/** Sends a 6-digit code by text and stores only its hash. Returns the token id the next screen needs. */
async function sendCode(o: { purpose: TokenPurpose; phone: string; userId: string | null; lang: Lang; payload?: Prisma.InputJsonValue; send: boolean }) {
  const code = sixDigitCode();
  // A new code replaces any earlier one for the same number and purpose.
  await db.authToken.updateMany({ where: { target: o.phone, purpose: o.purpose, usedAt: null }, data: { usedAt: new Date() } });
  const token = await db.authToken.create({
    data: { purpose: o.purpose, tokenHash: sha256(code), userId: o.userId, target: o.phone, payload: o.payload, expiresAt: minutesFromNow(CODE_MINUTES) },
  });
  if (o.send) {
    const kind = o.purpose === 'login_code' ? 'login' : o.purpose === 'signup_code' ? 'signup' : 'reset';
    await queueSms(o.phone, o.purpose, o.lang, codeSms(o.lang, code, CODE_MINUTES, kind));
  }
  return token.id;
}

/** Checks a typed code. Each wrong try counts; after five the code is dead. */
async function checkCode(tokenId: string, purpose: TokenPurpose, code: string) {
  const t = await db.authToken.findFirst({ where: { id: tokenId, purpose } });
  if (!t || t.usedAt || t.expiresAt.getTime() < Date.now() || t.attempts >= MAX_CODE_TRIES) return { ok: false as const, error: 'codeExpired' as const };
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 6 || !sameHash(sha256(clean), t.tokenHash)) {
    const after = await db.authToken.update({ where: { id: t.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, error: after.attempts >= MAX_CODE_TRIES ? ('codeExpired' as const) : ('codeWrong' as const) };
  }
  // Marks it used only if nobody else used it in the meantime.
  const claimed = await db.authToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return { ok: false as const, error: 'codeExpired' as const };
  return { ok: true as const, token: t };
}

/* ---------- Create account (canvas 09-33) ---------- */

export type SignUpInput = {
  identifier: string; password: string; country: string; language: Lang; marketing: boolean; terms: boolean;
};

export async function signUp(input: SignUpInput):
  Promise<Fail | { ok: true; next: 'done' } | { ok: true; next: 'verifyPhone'; tokenId: string; masked: string }> {
  const id = parseIdentifier(input.identifier, input.country);
  if (!id) return fail('invalidIdentifier');
  if (!input.terms) return fail('terms');
  const country = await db.country.findUnique({ where: { code: input.country } });
  if (!country) return fail('country');
  const problem = passwordProblem(input.password, id.kind === 'email' ? id.value : null);
  if (problem) return fail(problem);
  const { ip } = await requestMeta();
  const blocked = await limited([[`signup:ip:${ip}`, 20, 60 * MIN]]);
  if (blocked) return blocked;
  if (await findByIdentifier(id)) return fail('taken');

  const passwordHash = await hashPassword(input.password);
  const details = { country: input.country, language: input.language, marketingOptIn: input.marketing };

  if (id.kind === 'email') {
    try {
      const user = await db.user.create({ data: { email: id.value, passwordHash, termsAcceptedAt: new Date(), ...details } });
      await startSession(user.id, true);
      return { ok: true, next: 'done' };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return fail('taken');
      throw e;
    }
  }

  // A phone account is created only once the number is proven, so nobody can claim someone else's number.
  const sendBlocked = await limited([[`sms:${id.value}`, 1, MIN], [`sms-hour:${id.value}`, 5, 60 * MIN]]);
  if (sendBlocked) return sendBlocked;
  const tokenId = await sendCode({
    purpose: 'signup_code', phone: id.value, userId: null, lang: input.language, send: true,
    payload: { passwordHash, ...details, termsAcceptedAt: new Date().toISOString() },
  });
  return { ok: true, next: 'verifyPhone', tokenId, masked: maskIdentifier(id) };
}

export async function confirmPhoneSignUp(tokenId: string, code: string): Promise<Fail | { ok: true; language: Lang }> {
  const r = await checkCode(tokenId, 'signup_code', code);
  if (!r.ok) return fail(r.error);
  const p = r.token.payload as { passwordHash: string; country: string; language: string; marketingOptIn: boolean; termsAcceptedAt: string };
  try {
    const user = await db.user.create({
      data: {
        phone: r.token.target, passwordHash: p.passwordHash, country: p.country, language: p.language,
        marketingOptIn: p.marketingOptIn, termsAcceptedAt: new Date(p.termsAcceptedAt), phoneVerifiedAt: new Date(),
      },
    });
    await startSession(user.id, true);
    return { ok: true, language: user.language === 'si' ? 'si' : 'en' };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return fail('taken');
    throw e;
  }
}

/* ---------- Sign in (canvas 05-19) ---------- */

export async function signInWithPassword(identifier: string, password: string, persistent: boolean, country: string): Promise<Fail | { ok: true; role: 'viewer' | 'admin' }> {
  const id = parseIdentifier(identifier, country);
  if (!id || !password) return fail('badCredentials');
  const { ip } = await requestMeta();
  const blocked = await limited([[`login:${id.value}`, 10, 15 * MIN], [`login:ip:${ip}`, 50, 15 * MIN]]);
  if (blocked) return blocked;
  const user = await findByIdentifier(id);
  if (!user?.passwordHash) {
    await burnPasswordCheck(password);
    return fail('badCredentials');
  }
  if (!(await verifyPassword(password, user.passwordHash))) return fail('badCredentials');
  await clear(`login:${id.value}`);
  await startSession(user.id, persistent);
  return { ok: true, role: user.role };
}

/** "Get a one-time code by SMS". Always answers as if a code was sent. */
export async function sendLoginCode(phoneInput: string, country: string, lang: Lang): Promise<Fail | { ok: true; tokenId: string; masked: string }> {
  const id = parseIdentifier(phoneInput, country);
  if (!id) return fail('invalidIdentifier');
  if (id.kind !== 'phone') return fail('phoneOnly');
  const { ip } = await requestMeta();
  const blocked = await limited([[`sms:${id.value}`, 1, MIN], [`sms-hour:${id.value}`, 5, 60 * MIN], [`sms:ip:${ip}`, 20, 60 * MIN]]);
  if (blocked) return blocked;
  const user = await findByIdentifier(id);
  const tokenId = await sendCode({ purpose: 'login_code', phone: id.value, userId: user?.id ?? null, lang: (user?.language as Lang) ?? lang, send: !!user });
  return { ok: true, tokenId, masked: maskIdentifier(id) };
}

export async function signInWithCode(tokenId: string, code: string, persistent: boolean): Promise<Fail | { ok: true }> {
  const r = await checkCode(tokenId, 'login_code', code);
  if (!r.ok) return fail(r.error);
  // A code for a number with no account was never sent, so it can't be typed correctly; this is a second guard.
  if (!r.token.userId) return fail('codeWrong');
  await db.user.update({ where: { id: r.token.userId }, data: { phoneVerifiedAt: new Date() } });
  await startSession(r.token.userId, persistent);
  return { ok: true };
}

/* ---------- Reset password (canvas 09-33, steps 1 and 2) ---------- */

export async function startReset(identifier: string, country: string, lang: Lang):
  Promise<Fail | { ok: true; kind: 'email'; masked: string } | { ok: true; kind: 'phone'; tokenId: string; masked: string }> {
  const id = parseIdentifier(identifier, country);
  if (!id) return fail('invalidIdentifier');
  const { ip } = await requestMeta();
  const blocked = await limited([[`reset:${id.value}`, 5, 60 * MIN], [`reset:ip:${ip}`, 20, 60 * MIN]]);
  if (blocked) return blocked;
  const user = await findByIdentifier(id);
  const userLang = (user?.language as Lang) ?? lang;

  if (id.kind === 'email') {
    if (user) {
      const raw = randomToken();
      await db.authToken.updateMany({ where: { userId: user.id, purpose: 'reset_link', usedAt: null }, data: { usedAt: new Date() } });
      await db.authToken.create({ data: { purpose: 'reset_link', tokenHash: sha256(raw), userId: user.id, target: id.value, expiresAt: minutesFromNow(LINK_MINUTES) } });
      const url = `${appUrl()}/${userLang}/reset/new?token=${raw}`;
      await queueEmail(id.value, 'reset_link', userLang, resetEmail(userLang, { email: id.value, url, minutes: LINK_MINUTES }));
    }
    return { ok: true, kind: 'email', masked: maskIdentifier(id) };
  }

  const smsBlocked = await limited([[`sms:${id.value}`, 1, MIN]]);
  if (smsBlocked) return smsBlocked;
  const tokenId = await sendCode({ purpose: 'reset_code', phone: id.value, userId: user?.id ?? null, lang: userLang, send: !!user });
  return { ok: true, kind: 'phone', tokenId, masked: maskIdentifier(id) };
}

/** A correct reset code becomes a short-lived reset link token, so step 2 works the same for email and phone. */
export async function verifyResetCode(tokenId: string, code: string): Promise<Fail | { ok: true; token: string }> {
  const r = await checkCode(tokenId, 'reset_code', code);
  if (!r.ok) return fail(r.error);
  if (!r.token.userId) return fail('codeWrong');
  const raw = randomToken();
  await db.authToken.create({ data: { purpose: 'reset_grant', tokenHash: sha256(raw), userId: r.token.userId, target: r.token.target, expiresAt: minutesFromNow(15) } });
  return { ok: true, token: raw };
}

async function findResetToken(raw: string) {
  if (!raw || raw.length > 100) return null;
  const t = await db.authToken.findFirst({ where: { tokenHash: sha256(raw), purpose: { in: ['reset_link', 'reset_grant'] } } });
  if (!t || t.usedAt || t.expiresAt.getTime() < Date.now() || !t.userId) return null;
  return t;
}

/** For step 2's "Link sent to [member email]. It works for 30 minutes." */
export async function describeResetToken(raw: string): Promise<{ ok: true; masked: string; minutesLeft: number } | Fail> {
  const t = await findResetToken(raw);
  if (!t) return fail('linkExpired');
  const masked = maskIdentifier(t.target.includes('@') ? { kind: 'email', value: t.target } : { kind: 'phone', value: t.target });
  return { ok: true, masked, minutesLeft: Math.max(1, Math.round((t.expiresAt.getTime() - Date.now()) / 60_000)) };
}

export async function completeReset(raw: string, password: string, again: string, signOutOthers: boolean): Promise<Fail | { ok: true }> {
  const t = await findResetToken(raw);
  if (!t?.userId) return fail('linkExpired');
  if (password !== again) return fail('mismatch');
  const user = await db.user.findUnique({ where: { id: t.userId } });
  if (!user) return fail('linkExpired');
  const problem = passwordProblem(password, user.email);
  if (problem) return fail(problem);
  const claimed = await db.authToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return fail('linkExpired');
  const viaEmail = t.target.includes('@');
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), ...(viaEmail ? { emailVerifiedAt: user.emailVerifiedAt ?? new Date() } : { phoneVerifiedAt: user.phoneVerifiedAt ?? new Date() }) },
  });
  // Any other reset links for this account stop working once the password has changed.
  await db.authToken.updateMany({ where: { userId: user.id, purpose: { in: ['reset_link', 'reset_grant', 'reset_code'] }, usedAt: null }, data: { usedAt: new Date() } });
  if (signOutOthers) await endOtherSessions(user.id, false);
  await startSession(user.id, true);
  return { ok: true };
}
