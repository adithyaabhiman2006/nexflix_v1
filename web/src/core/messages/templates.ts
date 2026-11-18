import { BRAND } from '@/config/brand';

/* Emails and texts from canvas 10-42, in the member's language. Sinhala needs a native-speaker check. */

type Lang = 'en' | 'si';
export type Email = { subject: string; html: string; text: string };

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Shared email frame: cream card, placeholder logo, one clay button. Inline styles, because mail apps drop <style>. */
function layout(lang: Lang, o: { heading: string; paras: string[]; button?: { label: string; url: string }; after?: string }): string {
  const font = lang === 'si' ? "'Noto Sans Sinhala','Iskoola Pota',Arial,sans-serif" : "Manrope,'Segoe UI',Arial,sans-serif";
  const p = (t: string) => `<p style="margin:0 0 14px;font:15px/1.55 ${font};color:#2C3E3B">${esc(t)}</p>`;
  const button = o.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr><td style="background:#C3714B;border-radius:6px">
        <a href="${esc(o.button.url)}" style="display:inline-block;padding:12px 20px;font:700 15px ${font};color:#16211F;text-decoration:none">${esc(o.button.label)}</a></td></tr></table>`
    : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:24px 12px;background:#EDE3D6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FAF5EF;border-radius:12px">
<tr><td style="padding:24px 24px 8px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="width:18px;height:18px;background:#C3714B;border-radius:4px"></td>
    <td style="padding-left:8px;font:700 16px Arial,sans-serif;letter-spacing:.04em;color:#2C3E3B">${esc(BRAND.wordmark)}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:8px 24px 20px">
  <h1 style="margin:0 0 12px;font:700 22px/1.25 ${font};color:#2C3E3B">${esc(o.heading)}</h1>
  ${o.paras.map(p).join('')}${button}${o.after ? p(o.after) : ''}
  <p style="margin:18px 0 0;font:12px/1.5 Arial,sans-serif;color:#6F8A84">${esc(BRAND.legalName)} · ${esc(BRAND.registeredAddress)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const plain = (heading: string, paras: string[], link?: string, after?: string) =>
  [heading, '', ...paras, ...(link ? ['', link] : []), ...(after ? ['', after] : []), '', `${BRAND.legalName} · ${BRAND.registeredAddress}`].join('\n');

/** Canvas 10-42, third email. */
export function resetEmail(lang: Lang, o: { email: string; url: string; minutes: number }): Email {
  const si = lang === 'si';
  const subject = si ? 'ඔබේ මුරපදය නැවත සකසන්න' : 'Reset your password';
  const body = si
    ? `${o.email} සඳහා මුරපදය නැවත සැකසීමට කවුරුන් හෝ ඉල්ලා ඇත. සබැඳිය මිනිත්තු ${o.minutes}ක් වලංගුයි.`
    : `Someone asked to reset the password for ${o.email}. The link works for ${o.minutes} minutes.`;
  const label = si ? 'නව මුරපදයක් තෝරන්න' : 'Choose a new password';
  const after = si ? 'ඔබ ඉල්ලුවේ නැද්ද? මෙම ඊමේලය නොසලකා හරින්න. ඔබේ මුරපදය වෙනස් නොවේ.' : "Didn't ask? Ignore this email. Your password stays the same.";
  return {
    subject,
    html: layout(lang, { heading: subject, paras: [body], button: { label, url: o.url }, after }),
    text: plain(subject, [body], `${label}: ${o.url}`, after),
  };
}

export type CodePurpose = 'login' | 'signup' | 'reset';

/** Canvas 10-42, first text: "Nexflix code: 482913. Valid 10 minutes. Never share it." */
export function codeSms(lang: Lang, code: string, minutes: number, purpose: CodePurpose): string {
  if (lang === 'si') {
    const what = { login: 'පිවිසුම් කේතය', signup: 'ලියාපදිංචි කේතය', reset: 'මුරපද කේතය' }[purpose];
    return `${BRAND.name} ${what}: ${code}. මිනිත්තු ${minutes}ක් වලංගුයි. කිසිවෙකුට නොකියන්න.`;
  }
  return `${BRAND.name} code: ${code}. Valid ${minutes} minutes. Never share it.`;
}
