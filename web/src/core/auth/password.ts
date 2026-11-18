import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/* scrypt, built into Node. Cost N=2^15 takes ~50-100ms on a server: slow for guessers, fine for people. */
const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64;
const MAXMEM = 128 * N * R * 2;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEYLEN, { N: n, r, p, maxmem: MAXMEM * 2 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Returns "scrypt$N$r$p$salt$hash". The parameters are stored so they can be raised later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/* Checked against when an account doesn't exist, so a wrong address takes as long as a wrong password. */
let dummy: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummy ??= hashPassword('not-a-real-password');
  await verifyPassword(password, await dummy);
}

export type PasswordProblem = 'tooShort' | 'tooLong' | 'sameAsEmail';

/** Canvas 09-33: "At least 8 characters · not your email". */
export function passwordProblem(password: string, email?: string | null): PasswordProblem | null {
  if (password.length < 8) return 'tooShort';
  if (password.length > 200) return 'tooLong';
  if (email) {
    const p = password.toLowerCase();
    if (p === email.toLowerCase() || p === email.split('@')[0].toLowerCase()) return 'sameAsEmail';
  }
  return null;
}
