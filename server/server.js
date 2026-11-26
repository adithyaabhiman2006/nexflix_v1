'use strict';
/* Nexflix local server. It shows the website and keeps accounts, memberships, vouchers and
   watch progress in a database file on this computer (data/nexflix.db).
   Start it with "Start Nexflix.bat", or type:  node server/server.js
   Make an account an admin:                   node server/server.js make-admin you@example.com */

/* Node prints a notice that its built-in database is new. Hide only that notice. */
const realEmitWarning = process.emitWarning;
process.emitWarning = (w, ...rest) => (String(w).includes('SQLite') ? undefined : realEmitWarning.call(process, w, ...rest));

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.NEXFLIX_DATA || path.join(ROOT, 'data');
const PORT = Number(process.env.PORT) || 8080;
/* Settings for the live website (leave them unset on this computer):
   PUBLIC_URL   the site's real address, e.g. https://www.example.lk. Used in emailed links, never the visitor's own "Host".
   HOST         0.0.0.0 on the live server so the host can reach it. 127.0.0.1 (this computer only) by default.
   TRUST_PROXY  1 when the host puts a proxy in front of the server, so each visitor's real address is used for limits. */
const PUBLIC_URL = String(process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const HOST = process.env.HOST || '127.0.0.1';
const LIVE = !!PUBLIC_URL;
const SECURE = PUBLIC_URL.startsWith('https://');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
/* PREVIEW_PASSWORD  when set, visitors see a password page before anything else (for private previews).
   After the right password, a cookie lets the browser in, including the website's own requests (sign up, sign in). */
const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD || '';
const PREVIEW_COOKIE = 'nx_preview';
/* PREVIEW_SECRET  optional; on a host whose files are wiped on restart it keeps visitors let in. */
let previewSecret = process.env.PREVIEW_SECRET || '';
function previewToken() {
  if (!previewSecret) {
    const f = path.join(DATA_DIR, 'preview-secret.txt');
    try { previewSecret = fs.readFileSync(f, 'utf8').trim(); } catch (e) { /* made below */ }
    if (!previewSecret) { previewSecret = crypto.randomBytes(32).toString('hex'); fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(f, previewSecret + '\n'); }
  }
  return crypto.createHmac('sha256', previewSecret).update(PREVIEW_PASSWORD).digest('hex');
}
function previewPasswordOk(pw) {
  return crypto.timingSafeEqual(Buffer.from(sha256(String(pw))), Buffer.from(sha256(PREVIEW_PASSWORD)));
}
function previewAllowed(req) {
  if (!PREVIEW_PASSWORD) return true;
  const c = parseCookies(req)[PREVIEW_COOKIE];
  if (c && c.length === 64 && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(previewToken()))) return true;
  const m = /^Basic\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!m) return false;
  const given = Buffer.from(m[1], 'base64').toString('utf8');
  const pw = given.slice(given.indexOf(':') + 1);
  return crypto.timingSafeEqual(Buffer.from(sha256(pw)), Buffer.from(sha256(PREVIEW_PASSWORD)));
}
const DAY = 86400000;
const SESSION_DAYS = 30;

/* ---------- Database ---------- */

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'nexflix.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'LK', role TEXT NOT NULL DEFAULT 'viewer',
    password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS subscriptions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'none', trial_used INTEGER NOT NULL DEFAULT 0, method TEXT,
    started_at INTEGER, period_end INTEGER, cancel_reason TEXT, updated_at INTEGER);
  CREATE TABLE IF NOT EXISTS country_prices (country TEXT PRIMARY KEY, currency TEXT NOT NULL, amount REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL, method TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL,
    status TEXT NOT NULL, ref TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS watch_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title_id TEXT NOT NULL,
    season INTEGER, episode INTEGER, pos INTEGER, dur INTEGER, done INTEGER, updated_at INTEGER,
    PRIMARY KEY (user_id, title_id));
  CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS voucher_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, reseller TEXT NOT NULL,
    expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, created_by TEXT);
  CREATE TABLE IF NOT EXISTS voucher_codes (
    code_hash TEXT PRIMARY KEY, batch_id INTEGER NOT NULL REFERENCES voucher_batches(id) ON DELETE CASCADE,
    redeemed_by TEXT, redeemed_at INTEGER);
  CREATE TABLE IF NOT EXISTS voucher_attempts (user_id TEXT NOT NULL, at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS reset_tokens (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS rate_hits (key TEXT NOT NULL, at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS rate_hits_idx ON rate_hits (key, at);
  CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id, created_at);
  CREATE INDEX IF NOT EXISTS voucher_codes_batch_idx ON voucher_codes (batch_id);
`);
/* Older databases get the newer columns added. */
if (!db.prepare('PRAGMA table_info(voucher_batches)').all().some(col => col.name === 'months')) db.exec('ALTER TABLE voucher_batches ADD COLUMN months INTEGER NOT NULL DEFAULT 1');
const addPrice = db.prepare('INSERT OR IGNORE INTO country_prices (country, currency, amount) VALUES (?, ?, ?)');
[['LK', 'LKR', 299], ['GB', 'GBP', 0.99], ['AU', 'AUD', 1.49], ['AE', 'USD', 1.49], ['CA', 'USD', 1], ['US', 'USD', 1]].forEach(p => addPrice.run(...p));
db.prepare('INSERT OR IGNORE INTO site_settings (id, data) VALUES (1, ?)').run(JSON.stringify({
  overrides: {}, custom_titles: [], share_links: [],
  banner: ['pravegaya', 'maya-3d', 'vijayaba-kollaya', 'the-wife'],
  row_order: ['new', 'trending', 'teledrama', 'cinema', 'dubbed', 'programme', 'soon'],
}));

const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

/* ---------- Small helpers ---------- */

const sha256 = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const randomRef = prefix => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function checkPassword(pw, stored) {
  const [kind, saltHex, hashHex] = String(stored).split('$');
  if (kind !== 'scrypt') return false;
  const want = Buffer.from(hashHex, 'hex');
  const got = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), want.length);
  return crypto.timingSafeEqual(want, got);
}
class ApiError extends Error { constructor(status, code, msg) { super(msg || code); this.status = status; this.code = code; } }
const fail = (status, code, msg) => { throw new ApiError(status, code, msg); };
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const priceFor = uid => one('SELECT cp.currency, cp.amount FROM country_prices cp JOIN users u ON u.country = cp.country WHERE u.id = ?', uid) || { currency: 'LKR', amount: 299 };
const validCountry = c => typeof c === 'string' && !!one('SELECT 1 AS x FROM country_prices WHERE country = ?', c);

/* Too many tries from one place in a short time are refused for a while.
   The tries are kept in the database, so restarting the server does not reset them. */
function limit(key, max, windowMs) {
  const now = Date.now();
  run('DELETE FROM rate_hits WHERE key = ? AND at <= ?', key, now - windowMs);
  if (one('SELECT COUNT(*) AS n FROM rate_hits WHERE key = ?', key).n >= max) fail(429, 'too_many', 'Too many tries. Wait a few minutes.');
  run('INSERT INTO rate_hits (key, at) VALUES (?, ?)', key, now);
}
/* The visitor's address. Behind the host's proxy it comes from the proxy's header. */
function clientIp(req) {
  if (TRUST_PROXY) { const f = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); if (f) return f; }
  return req.socket.remoteAddress || 'unknown';
}

/* ---------- Sessions ---------- */

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
/* "Keep me signed in" keeps the session for 30 days. Without it, closing the browser signs out. */
function startSession(res, uid, remember = true) {
  const token = crypto.randomBytes(32).toString('hex');
  run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', sha256(token), uid, Date.now() + (remember ? SESSION_DAYS : 1) * DAY);
  res.setHeader('Set-Cookie', `nx_session=${token}; Path=/; HttpOnly; SameSite=Lax${SECURE ? '; Secure' : ''}${remember ? `; Max-Age=${SESSION_DAYS * 86400}` : ''}`);
}
function endSession(req, res) {
  const t = parseCookies(req).nx_session;
  if (t) run('DELETE FROM sessions WHERE token_hash = ?', sha256(t));
  res.setHeader('Set-Cookie', `nx_session=; Path=/; HttpOnly; SameSite=Lax${SECURE ? '; Secure' : ''}; Max-Age=0`);
}
function currentUser(req) {
  const t = parseCookies(req).nx_session;
  if (!t) return null;
  return one('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?', sha256(t), Date.now()) || null;
}

/* ---------- What the website receives about an account ---------- */

function subRow(uid) {
  const s = one('SELECT * FROM subscriptions WHERE user_id = ?', uid);
  if (!s) return null;
  return { status: s.status, trial_used: !!s.trial_used, method: s.method, started_at: s.started_at, period_end: s.period_end, cancel_reason: s.cancel_reason };
}
function account(u) {
  return {
    user: { id: u.id, name: u.name, email: u.email, role: u.role, country: u.country, since: u.created_at },
    sub: subRow(u.id),
    payments: all('SELECT created_at, method, amount, currency, status, ref FROM payments WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50', u.id),
    progress: all('SELECT title_id, season, episode, pos, dur, done, updated_at FROM watch_progress WHERE user_id = ?', u.id).map(r => ({ ...r, done: !!r.done })),
  };
}
function ensureSub(uid) { run('INSERT OR IGNORE INTO subscriptions (user_id, updated_at) VALUES (?, ?)', uid, Date.now()); }

/* ---------- API ---------- */

const routes = {};
const route = (key, opts, fn) => { routes[key] = { ...opts, fn }; };

route('GET /api/session', {}, ({ user }) => (user ? account(user) : { user: null }));

route('POST /api/signup', {}, ({ body, res, req }) => {
  limit('signup:' + clientIp(req), 20, 60 * 60000);
  const email = str(body.email, 200).toLowerCase(), name = str(body.name, 80), password = typeof body.password === 'string' ? body.password : '';
  const country = validCountry(body.country) ? body.country : 'LK';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'bad_email', 'Please enter a real email address.');
  if (!name) fail(400, 'bad_name', 'Please enter your name.');
  if (password.length < 8 || password.length > 200) fail(400, 'weak_password', 'Use at least 8 characters.');
  if (one('SELECT 1 AS x FROM users WHERE email = ?', email)) fail(409, 'exists', 'An account with this email already exists.');
  const uid = crypto.randomUUID();
  tx(() => {
    /* Every new account is a viewer. Admins are made only with the make-admin command (see the top of this file). */
    run('INSERT INTO users (id, email, name, country, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', uid, email, name, country, 'viewer', hashPassword(password), Date.now());
    ensureSub(uid);
  });
  startSession(res, uid);
  return account(one('SELECT * FROM users WHERE id = ?', uid));
});

route('POST /api/login', {}, ({ body, res, req }) => {
  const email = str(body.email, 200).toLowerCase();
  limit('login:' + clientIp(req) + ':' + email, 10, 15 * 60000);
  const u = one('SELECT * FROM users WHERE email = ?', email);
  if (!u || !checkPassword(String(body.password || ''), u.password_hash)) fail(401, 'bad_login', 'That email or password is wrong.');
  startSession(res, u.id, body.remember !== false);
  return account(u);
});

route('POST /api/logout', {}, ({ req, res }) => { endSession(req, res); return { ok: true }; });

/* No email is sent yet. On this computer the reset link is shown in the server window only.
   It is never saved to a file, and its address comes from PUBLIC_URL, never from the visitor's request.
   On the live site (PUBLIC_URL set) the link is not shown anywhere until an email provider is added. */
route('POST /api/reset-request', {}, ({ body, req }) => {
  limit('reset:' + clientIp(req), 10, 60 * 60000);
  const u = one('SELECT * FROM users WHERE email = ?', str(body.email, 200).toLowerCase());
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    run('INSERT INTO reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)', sha256(token), u.id, Date.now() + 60 * 60000);
    const link = `${PUBLIC_URL || `http://127.0.0.1:${PORT}`}/#/new-password?token=${token}`;
    if (LIVE) console.log(`  Password reset asked for an account. Email sending is not set up yet, so no link was sent.`);
    else console.log(`\n  Password reset link for ${u.email} (works for 1 hour):\n  ${link}\n`);
  }
  return { ok: true };
});

route('POST /api/reset-password', {}, ({ body, res }) => {
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8 || password.length > 200) fail(400, 'weak_password', 'Use at least 8 characters.');
  const t = one('SELECT * FROM reset_tokens WHERE token_hash = ? AND expires_at > ?', sha256(str(body.token, 100)), Date.now());
  if (!t) fail(400, 'bad_token', 'This reset link has expired or was already used. Ask for a new one.');
  tx(() => {
    run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(password), t.user_id);
    run('DELETE FROM reset_tokens WHERE user_id = ?', t.user_id);
    run('DELETE FROM sessions WHERE user_id = ?', t.user_id);
  });
  startSession(res, t.user_id);
  return account(one('SELECT * FROM users WHERE id = ?', t.user_id));
});

route('POST /api/profile', { auth: true }, ({ body, user }) => {
  if (body.country !== undefined) {
    if (!validCountry(body.country)) fail(400, 'bad_country');
    run('UPDATE users SET country = ? WHERE id = ?', body.country, user.id);
  }
  if (body.name !== undefined) {
    const name = str(body.name, 80);
    if (!name) fail(400, 'bad_name');
    run('UPDATE users SET name = ? WHERE id = ?', name, user.id);
  }
  return { ok: true };
});

route('GET /api/settings', {}, () => JSON.parse(one('SELECT data FROM site_settings WHERE id = 1').data));
route('POST /api/settings', { admin: true }, ({ body }) => {
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const ok = isObj(body.overrides) && Array.isArray(body.custom_titles) && Array.isArray(body.banner) && Array.isArray(body.row_order) && Array.isArray(body.share_links);
  if (!ok) fail(400, 'bad_settings');
  const data = JSON.stringify({ overrides: body.overrides, custom_titles: body.custom_titles, banner: body.banner, row_order: body.row_order, share_links: body.share_links });
  run('UPDATE site_settings SET data = ? WHERE id = 1', data);
  return { ok: true };
});

route('POST /api/progress', { auth: true }, ({ body, user }) => {
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 100) : [];
  const up = db.prepare(`INSERT INTO watch_progress (user_id, title_id, season, episode, pos, dur, done, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (user_id, title_id) DO UPDATE SET season = excluded.season, episode = excluded.episode, pos = excluded.pos, dur = excluded.dur, done = excluded.done, updated_at = excluded.updated_at`);
  const n = v => Math.max(0, Math.round(Number(v) || 0));
  tx(() => rows.forEach(r => { const id = str(r.title_id, 100); if (id) up.run(user.id, id, n(r.season) || 1, n(r.episode) || 1, n(r.pos), n(r.dur), r.done ? 1 : 0, n(r.updated_at) || Date.now()); }));
  return { ok: true };
});

/* DEMO PAYMENT. The payment step replaces this with the payment provider's confirmation. */
route('POST /api/membership/start', { auth: true }, ({ body, user }) => {
  if (!['card', 'dialog'].includes(body.method)) fail(400, 'bad_method');
  return tx(() => {
    ensureSub(user.id);
    const s = one('SELECT * FROM subscriptions WHERE user_id = ?', user.id);
    if (['trial', 'active'].includes(s.status) && s.period_end > Date.now()) return { ok: false, error: 'already' };
    const trial = !s.trial_used, now = Date.now(), pr = priceFor(user.id);
    run(`UPDATE subscriptions SET status = ?, trial_used = 1, method = ?, started_at = ?, period_end = ?, cancel_reason = NULL, updated_at = ? WHERE user_id = ?`,
      trial ? 'trial' : 'active', body.method, now, now + (trial ? 7 : 30) * DAY, now, user.id);
    run('INSERT INTO payments (user_id, created_at, method, amount, currency, status, ref) VALUES (?, ?, ?, ?, ?, ?, ?)',
      user.id, now, body.method, trial ? 0 : pr.amount, pr.currency, trial ? 'trial' : 'paid', randomRef('DEMO'));
    return { ok: true, trial };
  });
});

route('POST /api/membership/failed', { auth: true }, ({ body, user }) => {
  const pr = priceFor(user.id);
  run('INSERT INTO payments (user_id, created_at, method, amount, currency, status, ref) VALUES (?, ?, ?, ?, ?, ?, ?)',
    user.id, Date.now(), body.method === 'dialog' ? 'dialog' : 'card', pr.amount, pr.currency, 'failed', randomRef('DEMO'));
  return { ok: true };
});

route('POST /api/membership/voucher', { auth: true }, ({ body, user }) => tx(() => {
  const now = Date.now();
  const fails = one('SELECT COUNT(*) AS n FROM voucher_attempts WHERE user_id = ? AND at > ?', user.id, now - 60 * 60000).n;
  if (fails >= 5) return { ok: false, error: 'too_many' };
  const h = sha256(str(body.code, 60).toUpperCase());
  const vc = one('SELECT c.*, b.expires_at, b.months FROM voucher_codes c JOIN voucher_batches b ON b.id = c.batch_id WHERE c.code_hash = ?', h);
  if (!vc) { run('INSERT INTO voucher_attempts (user_id, at) VALUES (?, ?)', user.id, now); return { ok: false, error: 'invalid', left: 4 - fails }; }
  if (vc.redeemed_at) return { ok: false, error: 'used' };
  if (vc.expires_at < now) return { ok: false, error: 'expired' };
  run('UPDATE voucher_codes SET redeemed_by = ?, redeemed_at = ? WHERE code_hash = ?', user.id, now, h);
  run('DELETE FROM voucher_attempts WHERE user_id = ?', user.id);
  ensureSub(user.id);
  const s = one('SELECT * FROM subscriptions WHERE user_id = ?', user.id);
  const stillOn = ['trial', 'active'].includes(s.status) && s.period_end > now;
  run(`UPDATE subscriptions SET status = ?, method = ?, started_at = ?, period_end = ?, cancel_reason = ?, updated_at = ? WHERE user_id = ?`,
    stillOn ? s.status : 'active', stillOn ? (s.method || 'voucher') : 'voucher', s.started_at || now,
    Math.max(now, s.period_end || now) + 30 * (vc.months || 1) * DAY, stillOn ? s.cancel_reason : null, now, user.id);
  const pr = priceFor(user.id);
  run('INSERT INTO payments (user_id, created_at, method, amount, currency, status, ref) VALUES (?, ?, ?, ?, ?, ?, ?)',
    user.id, now, 'voucher', pr.amount * (vc.months || 1), pr.currency, 'paid', 'VCH-' + h.slice(0, 8).toUpperCase());
  return { ok: true, months: vc.months || 1 };
}));

route('POST /api/membership/cancel', { auth: true }, ({ body, user }) => {
  const reason = ['price', 'content', 'quality', 'time', 'other'].includes(body.reason) ? body.reason : 'other';
  run(`UPDATE subscriptions SET status = 'cancelled', cancel_reason = ?, updated_at = ? WHERE user_id = ? AND status IN ('trial', 'active')`, reason, Date.now(), user.id);
  return { ok: true };
});

/* Restarting only works while paid time is left. After that the member pays again. */
route('POST /api/membership/restart', { auth: true }, ({ user }) => {
  const s = one('SELECT * FROM subscriptions WHERE user_id = ?', user.id);
  if (!s || s.status !== 'cancelled' || !s.period_end || s.period_end <= Date.now()) return { ok: false, error: 'pay' };
  run(`UPDATE subscriptions SET status = 'active', cancel_reason = NULL, updated_at = ? WHERE user_id = ?`, Date.now(), user.id);
  return { ok: true };
});

/* ---------- Admin ---------- */

route('GET /api/admin/users', { admin: true }, () => all(`
  SELECT u.id, u.name, u.email, u.country, u.role, u.created_at,
         s.status, s.trial_used, s.method, s.started_at, s.period_end, s.cancel_reason
  FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id ORDER BY u.created_at DESC`)
  .map(r => ({ id: r.id, name: r.name, email: r.email, country: r.country, role: r.role, created_at: r.created_at,
    subscriptions: r.status ? { status: r.status, trial_used: !!r.trial_used, method: r.method, started_at: r.started_at, period_end: r.period_end, cancel_reason: r.cancel_reason } : null })));

route('POST /api/admin/extend', { admin: true }, ({ body }) => {
  const days = Math.round(Number(body.days));
  if (!(days >= 1 && days <= 366)) fail(400, 'bad_days');
  if (!one('SELECT 1 AS x FROM users WHERE id = ?', str(body.user, 60))) fail(404, 'no_user');
  return tx(() => {
    ensureSub(body.user);
    const s = one('SELECT * FROM subscriptions WHERE user_id = ?', body.user), now = Date.now();
    run(`UPDATE subscriptions SET status = ?, method = ?, started_at = ?, period_end = ?, cancel_reason = NULL, updated_at = ? WHERE user_id = ?`,
      s.status === 'trial' && s.period_end > now ? 'trial' : 'active', s.method || 'voucher', s.started_at || now,
      Math.max(now, s.period_end || now) + days * DAY, now, body.user);
    return { ok: true };
  });
});

/* One member's payments, for the details box. */
route('GET /api/admin/payments', { admin: true }, ({ url }) =>
  all('SELECT created_at, method, amount, currency, status, ref FROM payments WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20', str(url.searchParams.get('user'), 60)));

/* Signs a member out on every device. */
route('POST /api/admin/signout', { admin: true }, ({ body }) => {
  const r = run('DELETE FROM sessions WHERE user_id = ?', str(body.user, 60));
  return { ok: true, screens: r.changes };
});

route('POST /api/admin/cancel', { admin: true }, ({ body }) => {
  run(`UPDATE subscriptions SET status = 'cancelled', cancel_reason = 'other', updated_at = ? WHERE user_id = ? AND status IN ('trial', 'active')`, Date.now(), str(body.user, 60));
  return { ok: true };
});

route('GET /api/admin/signups', { admin: true }, () => {
  const monday = new Date(); monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const out = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(monday); start.setDate(start.getDate() - i * 7);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const n = one('SELECT COUNT(*) AS n FROM users WHERE created_at >= ? AND created_at < ?', start.getTime(), end.getTime()).n;
    const pad = v => String(v).padStart(2, '0');
    out.push({ week_start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`, signups: n });
  }
  return out;
});

/* Money taken this calendar month, per currency (simulated payments for now). */
route('GET /api/admin/stats', { admin: true }, () => {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  return { revenue: all(`SELECT currency, ROUND(SUM(amount), 2) AS total FROM payments WHERE status = 'paid' AND created_at >= ? GROUP BY currency ORDER BY total DESC`, start.getTime()) };
});

route('GET /api/admin/batches', { admin: true }, () => all(`
  SELECT b.id, b.name, b.reseller, b.months, b.expires_at, b.created_at, COUNT(c.code_hash) AS codes, COUNT(c.redeemed_at) AS used
  FROM voucher_batches b LEFT JOIN voucher_codes c ON c.batch_id = b.id GROUP BY b.id ORDER BY b.created_at DESC`));

/* The codes are made here, returned once, and only their hashes are kept. */
route('POST /api/admin/batches', { admin: true }, ({ body, user }) => {
  const reseller = str(body.reseller, 100), qty = Math.round(Number(body.qty)), expires = Number(body.expires), months = Math.round(Number(body.months) || 1);
  const name = str(body.name, 100) || 'Batch ' + String(one('SELECT COUNT(*) AS n FROM voucher_batches').n + 1).padStart(3, '0');
  if (!reseller) fail(400, 'bad_batch', 'Fill in the reseller.');
  if (![1, 3, 6, 12].includes(months)) fail(400, 'bad_months', 'Each code gives 1, 3, 6 or 12 months.');
  if (!(qty >= 1 && qty <= 500)) fail(400, 'bad_qty', 'A batch holds 1 to 500 codes.');
  if (!(expires > Date.now())) fail(400, 'bad_date', 'The expiry date must be in the future.');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const makeCode = () => { const s = Array.from(crypto.randomBytes(12), b => chars[b % chars.length]).join(''); return `NXF-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`; };
  const codes = new Set();
  while (codes.size < qty) codes.add(makeCode());
  tx(() => {
    const b = run('INSERT INTO voucher_batches (name, reseller, months, expires_at, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)', name, reseller, months, expires, Date.now(), user.id);
    const add = db.prepare('INSERT INTO voucher_codes (code_hash, batch_id) VALUES (?, ?)');
    codes.forEach(c => add.run(sha256(c), b.lastInsertRowid));
  });
  return { codes: Array.from(codes), name };
});

/* Who used a batch's codes, and when. The codes themselves are never stored. */
route('GET /api/admin/batch-report', { admin: true }, ({ url }) => all(`
  SELECT c.redeemed_at, u.email, u.name FROM voucher_codes c LEFT JOIN users u ON u.id = c.redeemed_by
  WHERE c.batch_id = ? AND c.redeemed_at IS NOT NULL ORDER BY c.redeemed_at`, Number(url.searchParams.get('id'))));

async function handleApi(req, res, url) {
  const r = routes[`${req.method} ${url.pathname}`];
  if (!r) return send(res, 404, { error: 'Not found', code: 'not_found' });
  let body = {};
  if (req.method === 'POST') {
    if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'JSON only', code: 'bad_type' });
    body = await readJson(req);
  }
  const user = currentUser(req);
  try {
    if ((r.auth || r.admin) && !user) fail(401, 'signed_out', 'Please sign in again.');
    if (r.admin && user.role !== 'admin') fail(403, 'admins_only', 'Admins only.');
    send(res, 200, await r.fn({ req, res, body, user, url }));
  } catch (e) {
    if (e instanceof ApiError) return send(res, e.status, { error: e.message, code: e.code });
    throw e;
  }
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 2e6) { reject(new ApiError(413, 'too_big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); resolve(v && typeof v === 'object' ? v : {}); } catch (e) { resolve({}); } });
    req.on('error', reject);
  });
}
function send(res, status, data) {
  if (res.headersSent) return;
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

/* ---------- Preview password page ---------- */

function readForm(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 4096) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(new URLSearchParams(Buffer.concat(chunks).toString('utf8')).get('password') || ''));
    req.on('error', reject);
  });
}
function previewPage(res, status, message) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nexflix preview</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07090c;color:#f2f5f7;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
form{width:100%;max-width:360px;display:flex;flex-direction:column;gap:14px}
.logo{font-weight:800;letter-spacing:.3em;color:#19e3b1;font-size:1.4rem}h1{margin:0;font-size:1.3rem}p{margin:0;color:#9aa6b2}
label{display:flex;flex-direction:column;gap:6px;font-size:.9rem;color:#c9d2da}
input{font:inherit;padding:12px 14px;border-radius:10px;border:1px solid #2a323c;background:#11161c;color:inherit}
input:focus{outline:2px solid #19e3b1;outline-offset:1px}
button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:10px;background:#19e3b1;color:#04120d;cursor:pointer}
.err{color:#ff8a8a}</style></head><body>
<form method="post" action="/__preview"><div class="logo">NEXFLIX</div><h1>Private preview</h1>
<p>Enter the password you were given to see the website.</p>
${message ? `<p class="err" role="alert">${esc(message)}</p>` : ''}
<label for="pw">Password<input id="pw" name="password" type="password" autocomplete="current-password" required autofocus></label>
<button type="submit">Open Nexflix</button></form></body></html>`);
}

/* ---------- Website files ---------- */

const PUBLIC = ['index.html', 'css', 'js', 'assets'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt', '.woff2': 'font/woff2' };
function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'; } catch (e) { res.writeHead(400); return res.end(); }
  const file = path.resolve(ROOT, rel);
  const top = path.relative(ROOT, file).split(path.sep)[0];
  if (!file.startsWith(ROOT + path.sep) || !PUBLIC.includes(top)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes',
      'Cache-Control': /\.(html|js|css)$/.test(file) ? 'no-cache' : 'public, max-age=3600' };
    /* Videos are sent in pieces so the browser can skip ahead. */
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m) {
      let start = m[1] ? Number(m[1]) : st.size - Number(m[2]);
      let end = m[1] && m[2] ? Number(m[2]) : st.size - 1;
      if (!m[1] && !m[2] || start >= st.size || start < 0) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      end = Math.min(end, st.size - 1);
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- Start ---------- */

if (process.argv[2] === 'make-admin') {
  const email = String(process.argv[3] || '').toLowerCase();
  const r = run(`UPDATE users SET role = 'admin' WHERE email = ?`, email);
  console.log(r.changes ? `${email} is now an admin.` : `No account uses ${email}.`);
  process.exit(0);
}

run('DELETE FROM sessions WHERE expires_at < ?', Date.now());
run('DELETE FROM reset_tokens WHERE expires_at < ?', Date.now());
run('DELETE FROM rate_hits WHERE at < ?', Date.now() - DAY);

/* Sent with every answer. They tell the browser to run only this site's own scripts, never to show the
   site inside another site's frame, and (on the live https site) to always use https. */
const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:", "media-src 'self' blob:",
    "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  ...(SECURE ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
};

const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  if (PREVIEW_PASSWORD && req.method === 'POST' && req.url.split('?')[0] === '/__preview') {
    let given = '';
    try {
      limit('preview:' + clientIp(req), 30, 15 * 60000);
      given = await readForm(req);
    } catch (e) { return previewPage(res, 429, 'Too many tries. Wait 15 minutes, then try again.'); }
    if (!previewPasswordOk(given)) return previewPage(res, 401, 'That password is not right. Check it and try again.');
    res.writeHead(303, { 'Set-Cookie': `${PREVIEW_COOKIE}=${previewToken()}; Path=/; HttpOnly; SameSite=Lax${SECURE ? '; Secure' : ''}; Max-Age=${30 * 86400}`, Location: '/', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (!previewAllowed(req)) {
    if (req.url.startsWith('/api/')) return send(res, 401, { error: 'Your preview access ended. Reload the page and enter the preview password.', code: 'preview_locked' });
    return previewPage(res, 401, '');
  }
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    if (e instanceof ApiError) return send(res, e.status, { error: e.message, code: e.code });
    send(res, 500, { error: 'Something went wrong on the server.', code: 'server' });
  }
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\n  PROBLEM: something else is already using port ${PORT}. Close the other Nexflix window and try again.\n`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  console.log(`\n  Nexflix is running.  Open:  ${PUBLIC_URL || `http://127.0.0.1:${PORT}`}\n  Keep this window open while you use the website. Close it to stop.\n`);
  if (!one(`SELECT 1 AS x FROM users WHERE role = 'admin'`)) console.log(`  There is no admin yet. Sign up on the website, then close this window and type:\n  node server/server.js make-admin your@email.com\n`);
});
