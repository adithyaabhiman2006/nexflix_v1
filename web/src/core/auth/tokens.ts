import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** 32 random bytes, URL-safe. Used for session cookies and reset links. */
export const randomToken = () => randomBytes(32).toString('base64url');

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** A 6-digit code such as 482913, evenly spread over 000000-999999. */
export const sixDigitCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}
