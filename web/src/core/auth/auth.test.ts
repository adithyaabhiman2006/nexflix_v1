import { describe, expect, it } from 'vitest';
import { maskIdentifier, normalizePhone, parseIdentifier } from './identifier';
import { hashPassword, passwordProblem, verifyPassword } from './password';
import { sixDigitCode } from './tokens';

describe('phone numbers', () => {
  it.each([
    ['077 123 4567', '+94771234567'],
    ['0771234567', '+94771234567'],
    ['+94 77 123 4567', '+94771234567'],
    ['0094771234567', '+94771234567'],
    ['94771234567', '+94771234567'],
    ['(077) 123-4567', '+94771234567'],
  ])('reads %s as a Sri Lankan mobile', (input, out) => {
    expect(normalizePhone(input, 'LK')).toBe(out);
  });

  it('reads local numbers by the viewer\'s country', () => {
    expect(normalizePhone('07700 900123', 'GB')).toBe('+447700900123');
  });

  it('rejects Sri Lankan landlines and junk', () => {
    expect(normalizePhone('0112345678', 'LK')).toBeNull();
    expect(normalizePhone('12345', 'LK')).toBeNull();
    expect(normalizePhone('call me', 'LK')).toBeNull();
  });
});

describe('email or phone field', () => {
  it('lower-cases emails', () => {
    expect(parseIdentifier('  Kasun@Example.COM ')).toEqual({ kind: 'email', value: 'kasun@example.com' });
  });
  it('rejects a broken email', () => {
    expect(parseIdentifier('kasun@')).toBeNull();
  });
  it('treats digits as a phone number', () => {
    expect(parseIdentifier('077 123 4567')).toEqual({ kind: 'phone', value: '+94771234567' });
  });
  it('masks for display', () => {
    expect(maskIdentifier({ kind: 'email', value: 'kasun@gmail.com' })).toBe('k•••@gmail.com');
    expect(maskIdentifier({ kind: 'phone', value: '+94771234567' })).toBe('+94 •••• 4567');
  });
});

describe('passwords', () => {
  it('hashes and verifies', async () => {
    const h = await hashPassword('rain over the hills');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('rain over the hills', h)).toBe(true);
    expect(await verifyPassword('rain over the hill', h)).toBe(false);
  });
  it('gives each hash its own salt', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });
  it('applies the canvas rules', () => {
    expect(passwordProblem('short')).toBe('tooShort');
    expect(passwordProblem('kasun@example.com', 'kasun@example.com')).toBe('sameAsEmail');
    expect(passwordProblem('kasunperera', 'KasunPerera@example.com')).toBe('sameAsEmail');
    expect(passwordProblem('a good long one', 'kasun@example.com')).toBeNull();
  });
});

describe('codes', () => {
  it('are always six digits', () => {
    for (let i = 0; i < 200; i++) expect(sixDigitCode()).toMatch(/^\d{6}$/);
  });
});
