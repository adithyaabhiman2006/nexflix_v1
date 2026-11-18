/*
 * Walks through every week-1 account flow in a real (headless) Chrome against the dev server,
 * reading codes and links from the outbox table the way a member reads their messages.
 *
 *   npm run dev            (in another terminal)
 *   node scripts/e2e-auth.mjs
 *
 * Creates throwaway accounts named e2e-<time>@example.com and +9477<random>.
 */
import 'dotenv/config';
import pg from 'pg';
import puppeteer from 'puppeteer-core';

const BASE = process.env.E2E_URL || 'http://localhost:3000';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const stamp = Date.now();
const email = `e2e-${stamp}@example.com`;
const phoneLocal = `077${String(stamp).slice(-7)}`;
const phoneE164 = `+94${phoneLocal.slice(1)}`;
const password = 'rain over the hills';
const newPassword = 'sea is calling again';

let passed = 0;
const ok = (label) => { passed++; console.log(`  ✓ ${label}`); };
const fail = (label, detail) => { console.error(`  ✗ ${label}${detail ? `\n    ${detail}` : ''}`); process.exitCode = 1; };
const check = (cond, label, detail) => (cond ? ok(label) : fail(label, detail));

async function lastMessage(to, template) {
  for (let i = 0; i < 20; i++) {
    const r = await db.query('SELECT body FROM outbox_messages WHERE "to"=$1 AND template=$2 ORDER BY created_at DESC LIMIT 1', [to, template]);
    if (r.rows[0]) return r.rows[0].body;
    await new Promise(res => setTimeout(res, 250));
  }
  throw new Error(`No ${template} message for ${to}`);
}
const codeFrom = (sms) => sms.match(/\b(\d{6})\b/)[1];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
const page = await browser.newPage();
page.setDefaultTimeout(20000);

/** Waits until React has attached to the page's forms, so typing goes into the live form. */
async function hydrated() {
  await page.waitForFunction(() => {
    const f = document.querySelector('form');
    return !f || Object.keys(f).some(k => k.startsWith('__react'));
  }, { timeout: 15000 }).catch(() => {});
}
async function go(path) { await page.goto(`${BASE}${path}`, { waitUntil: 'load' }); await hydrated(); }
async function type(selector, value) {
  await page.waitForSelector(selector);
  // Clears the field first (triple-click doesn't select inside password fields).
  await page.$eval(selector, el => { el.focus(); el.select?.(); });
  await page.keyboard.press('Backspace');
  await page.type(selector, value);
}
/** Presses the form's main button and waits for the server's answer. */
async function submit(selector = 'form button.btn-primary') {
  await page.waitForSelector(selector);
  const answered = page.waitForResponse(r => r.request().method() === 'POST', { timeout: 15000 }).catch(() => {});
  await page.$eval(selector, b => b.click());
  await answered;
  await new Promise(r => setTimeout(r, 600));
  await hydrated();
}
const path = () => new URL(page.url()).pathname;
const text = (sel) => page.$eval(sel, el => el.textContent.trim()).catch(() => '');
async function signOut() {
  await page.waitForSelector('.avatar');
  await hydrated();
  await page.$eval('.avatar', b => b.click());
  await page.waitForSelector('.menu-pop form button', { visible: true });
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.$eval('.menu-pop form button', b => b.click())]);
  await hydrated();
}

try {
  console.log('Signed-out visitor');
  await go('/');
  check(path() === '/en/welcome', '"/" goes to the welcome page', path());
  check((await text('h1')).includes('Sri Lankan films'), 'welcome headline shows');
  await page.waitForFunction(() => /[A-Z]{3} [\d.]+/.test(document.querySelector('.price')?.textContent ?? ''), { timeout: 8000 }).catch(() => {});
  check(/7 days free, then [A-Z]{3} [\d.]+ a month/.test(await text('.price')), 'price line shows a real price', await text('.price'));

  console.log('Create account with email (from the welcome box)');
  await type('#welcome-id', email);
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('.signup-inline button')]);
  check(path() === '/en/signup', 'welcome box leads to sign-up', path());
  check(!page.url().includes('example.com'), 'email is not in the address bar');
  check(await page.$eval('input[name=identifier]', el => el.value) === email, 'email is filled in');
  await type('input[name=password]', 'short');
  await page.click('input[name=terms]');
  check(await page.$eval('input[name=password]', el => el.validity.tooShort), 'browser blocks a short password before sending');
  await type('input[name=password]', password);
  const termsOn = await page.$eval('input[name=terms]', el => el.checked);
  if (!termsOn) await page.click('input[name=terms]');
  await submit();
  await page.waitForFunction(() => location.pathname === '/en', { timeout: 15000 }).catch(() => {});
  check(path() === '/en', 'new member lands on home', path());
  check((await text('.empty h2')).startsWith('Welcome back'), 'home greets the member', await text('.empty h2'));
  check(!!(await page.$('.avatar')), 'nav shows the signed-in menu');

  console.log('Signed-in member skips account screens');
  await go('/en/login');
  await page.waitForFunction(() => location.pathname === '/en', { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 500));
  check(path() === '/en', '/login sends a member home', path());

  console.log('Sign out, then wrong and right password');
  await signOut();
  check(path() === '/en/welcome', 'sign-out goes to welcome', path());
  await go('/en/login');
  await type('input[name=identifier]', email);
  await type('input[name=password]', 'not the password');
  await submit();
  check((await text('.form-err')).includes("isn't right"), 'wrong password is refused', 'path=' + path() + ' err=' + (await text('.form-err')) + ' h1=' + (await text('h1')));
  await type('input[name=password]', password);
  await submit();
  await page.waitForFunction(() => location.pathname === '/en', { timeout: 15000 }).catch(() => {});
  check(path() === '/en', 'right password signs in', path() + ' / error: ' + (await text('.form-err')) + ' / pw len: ' + (await page.$eval('input[name=password]', el => el.value.length).catch(() => -1)));
  await signOut();

  console.log('Unknown account gives the same answer as a wrong password');
  await go('/en/login');
  await type('input[name=identifier]', `nobody-${stamp}@example.com`);
  await type('input[name=password]', password);
  await submit();
  check((await text('.form-err')).includes("isn't right"), 'no hint that the account does not exist');

  console.log('Reset password by email');
  await go('/en/reset');
  await type('input[name=identifier]', email);
  await submit();
  check((await text('.auth-card h1')) === 'Check your email', 'step 1 says check your email');
  const mail = await lastMessage(email, 'reset_link');
  const link = mail.match(/href="([^"]+reset\/new\?token=[^"]+)"/)[1].replace(/&amp;/g, '&');
  check(link.startsWith('http://localhost:3000/en/reset/new?token='), 'email holds a reset link');
  await page.goto(link, { waitUntil: 'load' });
  await page.waitForSelector('.auth-card h1');
  await hydrated();
  check((await text('.auth-card h1')) === 'Choose a new password', 'link opens step 2');
  check((await text('.auth-intro')).includes('e•••@example.com'), 'step 2 shows the masked address', await text('.auth-intro'));
  await type('input[name=password]', newPassword);
  await type('input[name=again]', 'different words here');
  await submit();
  check((await text('.form-err')).includes("don't match"), 'mismatched passwords are refused');
  await type('input[name=password]', newPassword);
  await type('input[name=again]', newPassword);
  await submit();
  await page.waitForFunction(() => location.pathname === '/en', { timeout: 15000 }).catch(() => {});
  check(path() === '/en', 'save and sign in works', path());
  await signOut();
  await page.goto(link, { waitUntil: 'load' });
  await page.waitForSelector('.auth-card h1');
  check((await text('.auth-card h1')) === 'This link has expired', 'the same link cannot be used twice');

  console.log('Old password stops working, new one works');
  await go('/en/login');
  await type('input[name=identifier]', email);
  await type('input[name=password]', password);
  await submit();
  check((await text('.form-err')).includes("isn't right"), 'old password is refused');
  await type('input[name=password]', newPassword);
  await submit();
  await page.waitForFunction(() => location.pathname === '/en', { timeout: 15000 }).catch(() => {});
  check(path() === '/en', 'new password signs in');
  await signOut();

  console.log('Create account with a mobile number (Sinhala)');
  await go('/si/signup');
  await type('input[name=identifier]', phoneLocal);
  await type('input[name=password]', password);
  await page.click('input[name=terms]');
  await submit();
  check((await text('.auth-card h1')) === 'ඔබේ අංකය තහවුරු කරන්න', 'asks for the texted code, in Sinhala', await text('.auth-card h1'));
  const sms1 = await lastMessage(phoneE164, 'signup_code');
  check(/කේතය: \d{6}/.test(sms1), 'SMS is in Sinhala with a 6-digit code', sms1);
  await type('input[name=code]', '000000');
  await submit();
  check((await text('.form-err')).length > 0, 'a wrong code is refused');
  await type('input[name=code]', codeFrom(sms1));
  await submit();
  await page.waitForFunction(() => location.pathname === '/si', { timeout: 15000 }).catch(() => {});
  check(path() === '/si', 'right code creates the account', path());
  const u = await db.query('SELECT phone, phone_verified_at FROM users WHERE phone=$1', [phoneE164]);
  check(u.rows[0]?.phone_verified_at != null, 'number is stored as verified');
  await signOut();

  console.log('Sign in with a texted code');
  // One text per number per minute; the sign-up code was just sent, so reset that counter for the test.
  await db.query("DELETE FROM rate_limits WHERE key = $1", [`sms:${phoneE164}`]);
  await go('/en/login/code');
  await type('input[name=phone]', phoneLocal);
  await submit();
  check((await text('.auth-intro')).includes('+94 ••••'), 'code step shows the masked number', await text('.auth-intro'));
  const sms2 = await lastMessage(phoneE164, 'login_code');
  await type('input[name=code]', codeFrom(sms2));
  await submit();
  await page.waitForFunction(() => location.pathname === '/en', { timeout: 15000 }).catch(() => {});
  check(path() === '/en', 'code signs in', path());
  await signOut();

  console.log('Asking again within a minute is slowed down');
  await go('/en/login/code');
  await type('input[name=phone]', phoneLocal);
  await submit();
  check((await text('.form-err')).includes('Too many tries'), 'second text inside a minute is refused', await text('.form-err'));

  console.log('Stored data');
  const pw = await db.query('SELECT password_hash FROM users WHERE email=$1', [email]);
  check(pw.rows[0].password_hash.startsWith('scrypt$'), 'passwords are stored hashed, never plain');
  const tok = await db.query("SELECT count(*)::int AS n FROM auth_tokens WHERE token_hash ~ '^[0-9]{6}$'");
  check(tok.rows[0].n === 0, 'codes are stored hashed, never plain');
} catch (e) {
  fail('flow stopped', e.stack);
  await page.screenshot({ path: 'e2e-failure.png' }).catch(() => {});
} finally {
  await browser.close();
  await db.end();
  console.log(`\n${passed} checks passed${process.exitCode ? ', some failed' : ''}.`);
}
