/* Talks to the local server (server/server.js): accounts, membership, payments, watch progress
   and the admin's site settings. The server decides what each person may read or change. */

const toMs = v => (v == null ? null : typeof v === 'number' ? v : new Date(v).getTime());

/* Sends a request to the server. Problems come back as an Error with a .code. */
async function api(path, body) {
  const opts = { credentials: 'same-origin', headers: {} };
  if (body !== undefined) { opts.method = 'POST'; opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch('/api/' + path, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Request failed');
    err.code = (data && data.code) || 'http_' + res.status; err.status = res.status;
    if (res.status === 401 && store.user) setTimeout(() => { clearAccount(); go('#/login'); });
    throw err;
  }
  return data;
}

/* Membership as the pages expect it. A membership whose paid time has run out shows as expired. */
function subFromRow(r) {
  if (!r) return { status: 'none', trialUsed: false };
  const periodEnd = toMs(r.period_end);
  let status = r.status;
  if (status !== 'none' && (!periodEnd || periodEnd <= Date.now())) status = 'expired';
  return { status, trialUsed: !!r.trial_used, method: r.method, start: toMs(r.started_at), periodEnd, cancelReason: r.cancel_reason || undefined };
}

let progressSent = {};
function clearAccount() {
  store.user = null;
  store.sub = { status: 'none', trialUsed: false };
  store.payments = []; store.progress = {}; store.otherStreams = [];
  progressSent = {};
}

/* Puts an account from the server into the page's memory. */
function applyAccount(a) {
  if (!a || !a.user) { clearAccount(); return; }
  const u = a.user;
  store.user = { id: u.id, name: u.name, email: u.email, role: u.role, since: u.since };
  if (COUNTRIES[u.country]) store.country = u.country;
  store.sub = subFromRow(a.sub);
  store.payments = (a.payments || []).map(r => ({ date: r.created_at, method: r.method, amount: Number(r.amount), currency: r.currency, status: r.status, ref: r.ref }));
  store.progress = {}; progressSent = {};
  (a.progress || []).forEach(r => {
    store.progress[r.title_id] = { s: r.season, e: r.episode, pos: r.pos, dur: r.dur, ts: r.updated_at, done: r.done };
    progressSent[r.title_id] = JSON.stringify(store.progress[r.title_id]);
  });
}
async function refreshAccount() { applyAccount(await api('session')); }

/* Watch progress is saved to the database a moment after it changes. */
let progressTimer = null;
function queueProgressSync() {
  if (!store.user) return;
  clearTimeout(progressTimer);
  progressTimer = setTimeout(syncProgress, 2000);
}
async function syncProgress() {
  if (!store.user) return;
  const changed = Object.keys(store.progress).map(id => [id, JSON.stringify(store.progress[id])]).filter(([id, snap]) => progressSent[id] !== snap);
  if (!changed.length) return;
  const rows = changed.map(([id]) => {
    const p = store.progress[id];
    return { title_id: id, season: p.s, episode: p.e, pos: p.pos, dur: p.dur, done: !!p.done, updated_at: p.ts || Date.now() };
  });
  try { await api('progress', { rows }); changed.forEach(([id, snap]) => { progressSent[id] = snap; }); } catch (e) { /* tried again on the next change */ }
}
window.addEventListener('pagehide', () => { syncProgress(); });

/* Admin panel settings: title changes, uploaded titles, banner, row order and share links. */
async function loadSettings() {
  const d = await api('settings');
  store.admin.over = d.overrides || {};
  store.admin.custom = d.custom_titles || [];
  store.admin.banner = d.banner || DEFAULT_BANNER.slice();
  store.admin.rows = d.row_order || DEFAULT_ROWS.slice();
  store.admin.links = d.share_links || [];
}
async function saveSettings() {
  try {
    await api('settings', { overrides: store.admin.over, custom_titles: store.admin.custom, banner: store.admin.banner, row_order: store.admin.rows, share_links: store.admin.links });
    return true;
  } catch (e) {
    toast(L('Could not save. Please try again.', 'සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.'));
    try { await loadSettings(); } catch (err) { /* keep what is on screen */ }
    return false;
  }
}

/* Membership and admin actions. Returns the server's answer, or null after showing the problem. */
const RPC = {
  demo_start_membership: a => api('membership/start', { method: a.p_method }),
  demo_record_failed: a => api('membership/failed', { method: a.p_method }),
  redeem_voucher: a => api('membership/voucher', { code: a.p_code }),
  cancel_membership: a => api('membership/cancel', { reason: a.p_reason }),
  restart_membership: () => api('membership/restart', {}),
  admin_extend: a => api('admin/extend', { user: a.p_user, days: a.p_days }),
  admin_cancel: a => api('admin/cancel', { user: a.p_user }),
  admin_create_batch: a => api('admin/batches', a),
};
async function rpc(name, args) {
  try { const d = await RPC[name](args || {}); return d == null ? {} : d; } catch (e) {
    console.error(name, e);
    toast(e.status && e.status < 500 && e.message ? e.message : L('Something went wrong. Please try again.', 'යමක් වැරදුණා. නැවත උත්සාහ කරන්න.'));
    return null;
  }
}

/* Sign-in errors in plain words. */
function authMessage(error) {
  const c = error && error.code;
  if (c === 'bad_login') return L('That email or password is wrong.', 'ඊමේල් ලිපිනය හෝ මුරපදය වැරදියි.');
  if (c === 'exists') return L('An account with this email already exists. Sign in instead.', 'මෙම ඊමේල් සමඟ ගිණුමක් දැනටමත් ඇත. පුරනය වන්න.');
  if (c === 'too_many') return L('Too many tries. Wait a few minutes and try again.', 'උත්සාහයන් වැඩියි. මිනිත්තු කිහිපයකින් නැවත උත්සාහ කරන්න.');
  if (c === 'weak_password') return L('Please use at least 8 characters.', 'අවම වශයෙන් අකුරු 8ක් භාවිත කරන්න.');
  if (c === 'bad_email') return L('Please enter a real email address.', 'නිවැරදි ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.');
  if (c === 'bad_token') return L('This reset link has expired or was already used. Ask for a new one.', 'මෙම සබැඳිය කල් ඉකුත් වී ඇත. අලුත් එකක් ඉල්ලන්න.');
  if (error instanceof TypeError) return L('Could not reach the server. Is the Nexflix window still open?', 'සේවාදායකයට සම්බන්ධ විය නොහැක.');
  return (error && error.message) || L('Something went wrong. Please try again.', 'යමක් වැරදුණා. නැවත උත්සාහ කරන්න.');
}

/* Runs once before the first page is drawn. Returns false when the server can't be reached. */
let bootNotice = null;
async function boot() {
  if (location.protocol === 'file:') return false;
  $('#app').innerHTML = '<div class="page"><div class="empty"><div class="spinner"></div></div></div>';
  try {
    const [acc] = await Promise.all([api('session'), loadSettings()]);
    applyAccount(acc);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
function showBootNotice() { if (bootNotice) { toast(bootNotice); bootNotice = null; } }

/* Shown when the page was opened without the local server running. */
function viewSetupNeeded() {
  $('#app').innerHTML = `<div class="page err-page err-dark"><div class="err-icon" aria-hidden="true">${icon('alert')}</div>
    <h1>Something went wrong on our side</h1>
    <p>The website can't reach its server. If you are running Nexflix on this computer, double-click <b>Start Nexflix.bat</b> in the Nexflix folder, keep its black window open, then try again.</p>
    <div class="err-code">Address <b>${esc(location.host || 'this file')}</b> · ${esc(new Date().toLocaleTimeString())}</div>
    <div class="err-acts"><button class="btn btn-primary btn-lg" data-act="reload">Try again</button></div></div>`;
}
