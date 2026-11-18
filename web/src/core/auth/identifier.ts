/** What a person typed in "Email or phone number", cleaned up. */
export type Identifier = { kind: 'email'; value: string } | { kind: 'phone'; value: string };

/* Calling codes for the countries we sell in. A number typed without "+" is read as local to the viewer's country. */
const CALLING_CODE: Record<string, string> = { LK: '94', GB: '44', AU: '61', AE: '971', CA: '1', US: '1' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Turns a typed phone number into E.164 (+94771234567), or null.
 * "077 123 4567" in Sri Lanka -> +94771234567; "0094 77..." and "+94 77..." work too.
 */
export function normalizePhone(input: string, country = 'LK'): string | null {
  let s = input.trim().replace(/[\s().-]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (!s.startsWith('+')) {
    if (!/^\d+$/.test(s)) return null;
    const cc = CALLING_CODE[country] ?? '94';
    if (s.startsWith(cc) && s.length > 10) s = `+${s}`; // typed with the country code but no "+"
    else s = `+${cc}${s.replace(/^0/, '')}`;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  // Sri Lankan mobiles are +947 followed by 8 digits.
  if (s.startsWith('+94') && !/^\+947\d{8}$/.test(s)) return null;
  return s;
}

export function parseIdentifier(input: string, country = 'LK'): Identifier | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    return EMAIL.test(email) && email.length <= 254 ? { kind: 'email', value: email } : null;
  }
  const phone = normalizePhone(raw, country);
  return phone ? { kind: 'phone', value: phone } : null;
}

/** Shows only the end of an address in messages: k•••@gmail.com, +94 •••• 4567. */
export function maskIdentifier(id: Identifier): string {
  if (id.kind === 'email') {
    const [user, domain] = id.value.split('@');
    return `${user.charAt(0)}•••@${domain}`;
  }
  return `${id.value.slice(0, 3)} •••• ${id.value.slice(-4)}`;
}
