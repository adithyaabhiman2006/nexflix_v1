/* Shared state, helpers and catalogue rules. */

const STORE_KEY = 'nexflix.prefs.v1';
/* Only these preferences stay in the browser. Accounts, membership and progress live in the database. */
const PREF_KEYS = ['lang', 'theme', 'country', 'subLang', 'quality', 'cookieChoice'];
const DEFAULT_BANNER = ['pravegaya', 'maya-3d', 'vijayaba-kollaya', 'the-wife'];
const DEFAULT_ROWS = ['new', 'trending', 'teledrama', 'cinema', 'dubbed', 'programme', 'soon'];
const STREAM_LIMIT = 2;
const DAY = 86400000;
const NOW = Date.now();

const store = Object.assign({
  lang: 'en', theme: 'dark', country: 'LK',
  user: null,
  sub: { status: 'none', trialUsed: false },
  payments: [], progress: {}, otherStreams: [],
  subLang: 'si', quality: 'auto', cookieChoice: null,
  admin: { over: {}, custom: [], banner: DEFAULT_BANNER.slice(), rows: DEFAULT_ROWS.slice(), links: [] },
}, loadStore());

function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    return Object.fromEntries(PREF_KEYS.filter(k => k in saved).map(k => [k, saved[k]]));
  } catch (e) { return {}; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(PREF_KEYS.map(k => [k, store[k]])))); } catch (e) { /* private window: preferences last for this visit only */ }
  if (typeof queueProgressSync === 'function') queueProgressSync();
}

const ACTIONS = {}, FORMS = {}, CHANGES = {};
ACTIONS.reload = () => location.reload();
let CLEAN = [];

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const L = (en, si) => (store.lang === 'si' ? si : en);
const go = hash => { location.hash = hash; };

const ICON_PATHS = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  share: '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="m8.4 10.8 7.2-3.6M8.4 13.2l7.2 3.6"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14M3 9.5h5M3 14.5h5M16 9.5h5M16 14.5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3.5 22 20H2z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  home: '<path d="m3 11 9-7 9 7v9h-6v-6H9v6H3z"/>',
  flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2.5-6.5C10 9 11 10 11 11c1-2 1-5 1-8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4.5-7 8-7s7 2 8 7"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  ticket: '<path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 0 0 3V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a1.5 1.5 0 0 0 0-3zM14 7v10" />',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19"/>',
  back10: '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  fwd10: '<path d="M20 12a8 8 0 1 1-2.6-5.9L20 8.5"/><path d="M20 4v4.5h-4.5"/>',
  volume: '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="m16.5 9.5 5 5M21.5 9.5l-5 5"/>',
  subs: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6.5 11h5M13.5 11h4M6.5 15h3M11.5 15h6"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  next: '<path d="M5 4.5v15l10-7.5z" fill="currentColor" stroke="none"/><path d="M18.5 5v14"/>',
  full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
  upload: '<path d="M12 16V5M7 9.5 12 4.5l5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M15 9c-.5-1.2-1.7-1.8-3-1.8-1.8 0-3 .9-3 2.3 0 3.3 6 1.7 6 5 0 1.4-1.2 2.3-3 2.3-1.4 0-2.6-.7-3-1.9M12 5.5v13"/>',
  facebook: '<path d="M14.5 8H17V4.5h-2.5C12 4.5 10.5 6 10.5 8.5V11H8v3.5h2.5V20H14v-5.5h2.5l.5-3.5h-3V8.5c0-.3.2-.5.5-.5z"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><path d="M17 7h.01"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;

/* Catalogue */
TITLES.forEach(ti => {
  ti.licenceEnd = NOW + ti.licenceEndDays * DAY;
  if (ti.releaseDays != null) ti.releaseAt = NOW + ti.releaseDays * DAY;
});
function merged(ti) { return Object.assign({}, ti, store.admin.over[ti.id] || {}); }
function allTitles() { return TITLES.concat(store.admin.custom).map(merged); }
function getTitle(id) { return allTitles().find(x => x.id === id) || null; }
const inCountry = (ti, c = store.country) => ti.countries.includes('*') || ti.countries.includes(c);
const licensed = ti => !ti.licenceEnd || ti.licenceEnd > Date.now();
const isReleased = ti => ti.status === 'published' || (ti.status === 'scheduled' && ti.releaseAt && ti.releaseAt <= Date.now());
const isVisible = ti => isReleased(ti) && licensed(ti) && inCountry(ti);
const isUpcoming = ti => ti.status === 'scheduled' && ti.releaseAt > Date.now() && licensed(ti) && inCountry(ti);
const visibleTitles = () => allTitles().filter(isVisible);
const upcomingTitles = () => allTitles().filter(isUpcoming).sort((a, b) => a.releaseAt - b.releaseAt);

const nm = ti => (store.lang === 'si' ? ti.si || ti.en : ti.en);
const altNm = ti => (store.lang === 'si' ? ti.en : ti.si || '');
const synOf = ti => (store.lang === 'si' ? ti.synSi || ti.syn : ti.syn);
const catName = key => (CATEGORIES[key] ? CATEGORIES[key][store.lang === 'si' ? 'si' : 'en'] : key);
const genreName = g => (GENRES[g] ? GENRES[g][store.lang === 'si' ? 1 : 0] : g);
const countryName = c => (store.lang === 'si' ? COUNTRIES[c].siName : COUNTRIES[c].name);
const isSeries = ti => !!(ti.seasons && ti.seasons.length);

/* Portrait artwork only goes in portrait slots and landscape artwork in landscape slots.
   The art-tall / art-wide class lets the CSS give the surrounding slot the matching shape. */
const isTallOnly = ti => !!ti.poster && !ti.wide;
const isWideOnly = ti => !!ti.wide && !ti.poster;
function art(ti, size = 'sm', frame = 'wide') {
  if (ti.poster || ti.wide) {
    const useTall = frame === 'tall' ? !!ti.poster : !ti.wide;
    const banner = !useTall && ti.bannerPos ? ` art-banner" style="object-position:${ti.bannerPos}` : '';
    return `<img class="art ${useTall ? 'art-tall' : 'art-wide'}${banner}" src="${useTall ? ti.poster : ti.wide}" alt="" loading="${size === 'lg' ? 'eager' : 'lazy'}" decoding="async">`;
  }
  return '<div class="art art-blank" aria-hidden="true"></div>';
}

/* Trailers: the title's image shows first, then the video fades in over it.
   They start muted because browsers block autoplay with sound. */
let trailerMuted = true;
const trailersAllowed = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator.connection && navigator.connection.saveData);
function stopVideo(v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
function playTrailer(host, ti, { delay = 3000, loop = false, sound = false, onEnd = null } = {}) {
  const none = { stop() {}, pause() {}, resume() {}, running: () => false };
  if (!ti.trailer || !trailersAllowed()) return none;
  let v = null, started = false, held = false;
  const shell = host.closest('.hero-slide, .m-hero');
  /* Fades back to the image, so a trailer's dark last frame never stays on screen. */
  const fadeOut = () => { if (v) v.classList.remove('on'); if (shell) shell.classList.remove('trailer-playing'); };
  const finish = () => { started = false; fadeOut(); if (onEnd) onEnd(); };
  const timer = setTimeout(() => {
    if (!host.isConnected) return;
    v = document.createElement('video');
    v.className = 'trailer-video';
    v.muted = !sound || trailerMuted;
    v.playsInline = true;
    v.loop = loop;
    v.preload = 'auto';
    v.src = ti.trailer;
    v.setAttribute('aria-hidden', 'true');
    if (sound) v.dataset.sound = '';
    /* Each handler checks v because events can still arrive just after stop() removes the video. */
    v.addEventListener('playing', () => { if (!v) return; started = true; v.classList.add('on'); if (shell) shell.classList.add('trailer-playing'); });
    v.addEventListener('timeupdate', () => { if (v && !loop && v.duration - v.currentTime < 1) fadeOut(); });
    v.addEventListener('ended', finish);
    v.addEventListener('error', () => { if (!v) return; v.remove(); v = null; finish(); });
    const arts = host.querySelectorAll(':scope > .art');
    arts[arts.length - 1].after(v);
    if (!held) v.play().catch(() => {});
  }, delay);
  return {
    stop() { clearTimeout(timer); if (v) stopVideo(v); v = null; started = false; if (shell) shell.classList.remove('trailer-playing'); },
    pause() { held = true; if (v) v.pause(); },
    resume() { held = false; if (v && v.paused && !v.ended) v.play().catch(() => {}); },
    running: () => started && !!v && !v.paused,
  };
}
function trailerSoundBtn(ti) {
  if (!ti.trailer) return '';
  return `<button type="button" class="icon-btn trailer-sound" data-act="trailerSound" aria-label="${esc(trailerMuted ? L('Turn sound on', 'ශබ්දය සක්‍රිය කරන්න') : L('Turn sound off', 'ශබ්දය අක්‍රිය කරන්න'))}">${icon(trailerMuted ? 'mute' : 'volume')}</button>`;
}
ACTIONS.trailerSound = () => {
  trailerMuted = !trailerMuted;
  $$('.trailer-video[data-sound]').forEach(v => { v.muted = trailerMuted; });
  $$('.trailer-sound').forEach(b => {
    b.innerHTML = icon(trailerMuted ? 'mute' : 'volume');
    b.setAttribute('aria-label', trailerMuted ? L('Turn sound on', 'ශබ්දය සක්‍රිය කරන්න') : L('Turn sound off', 'ශබ්දය අක්‍රිය කරන්න'));
  });
};

/* Resting the mouse on a card with a trailer plays it silently on the card. */
let cardTrailer = null, cardEl = null;
function stopCardTrailer() { if (cardTrailer) cardTrailer.stop(); cardTrailer = null; cardEl = null; }
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const card = e.target.closest ? e.target.closest('[data-card]') : null;
  if (card === cardEl) return;
  stopCardTrailer();
  const ti = card && getTitle(card.dataset.card);
  if (ti && ti.trailer) { cardEl = card; cardTrailer = playTrailer(card, ti, { delay: 700, loop: true }); }
});
document.documentElement.addEventListener('mouseleave', stopCardTrailer);
document.addEventListener('click', e => { if (e.target.closest('[data-card]')) stopCardTrailer(); });

/* Episodes. Weekly series hold their last two episodes back as scheduled releases. */
const EP_SYN = [
  ['A visitor from the past changes the plan for everyone.', 'අතීතයෙන් ආ අමුත්තෙක් සැමගේ සැලසුම් වෙනස් කරනවා.'],
  ['A promise is tested when the money runs out.', 'මුදල් අවසන් වන විට පොරොන්දුවක් පරීක්ෂාවට ලක් වෙනවා.'],
  ['Old letters are found, and the family takes sides.', 'පැරණි ලියුම් හමු වී පවුල දෙකට බෙදෙනවා.'],
  ['The truth comes out at the worst possible moment.', 'නරකම මොහොතේ ඇත්ත එළියට එනවා.'],
  ['A long journey home ends somewhere unexpected.', 'දිගු ගමනක් බලාපොරොත්තු නොවූ තැනක අවසන් වෙනවා.'],
];
function nextFriday(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7) + offsetWeeks * 7);
  d.setHours(20, 0, 0, 0);
  return d.getTime();
}
function episodes(ti, season) {
  const count = (ti.seasons || [])[season - 1] || 0;
  const lastSeason = ti.seasons && season === ti.seasons.length;
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    let releaseAt = null;
    if (ti.weekly && lastSeason && n > count - 2) releaseAt = nextFriday(n - (count - 1));
    return { n, season, syn: EP_SYN[(n + season * 2) % EP_SYN.length], mins: ti.mins + ((n * 3) % 5) - 2, releaseAt };
  });
}
function nextEpisode(ti, s, e) {
  if (!isSeries(ti)) return null;
  const list = episodes(ti, s);
  const cand = list[e];
  if (cand && !cand.releaseAt) return { s, e: e + 1 };
  if (!cand && ti.seasons[s]) return { s: s + 1, e: 1 };
  return null;
}

/* Membership */
function hasAccess() {
  const s = store.sub;
  if (!store.user) return false;
  return ['trial', 'active', 'cancelled'].includes(s.status) && s.periodEnd > Date.now();
}
const locale = () => (store.lang === 'si' ? 'si-LK' : 'en-GB');
function fmtDate(ms, opts) { return new Intl.DateTimeFormat(locale(), opts || { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)); }
function money(amount, currency) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount).replace(/ /, ' ');
}
const priceNow = () => { const c = COUNTRIES[store.country]; return money(c.amount, c.currency); };

function playHref(ti) {
  const p = store.progress[ti.id];
  if (p && !p.done) return `#/watch/${ti.id}/${p.s}/${p.e}`;
  return `#/watch/${ti.id}/1/1`;
}
const playLabel = ti => { const p = store.progress[ti.id]; return p && !p.done ? t('resume') : t('play'); };

function continueList() {
  return Object.keys(store.progress).map(id => ({ ti: getTitle(id), p: store.progress[id] }))
    .filter(x => x.ti && x.ti.poster && !x.p.done && isVisible(x.ti)).sort((a, b) => b.p.ts - a.p.ts);
}

/* Shared card markup */
function cardHTML(ti, opts = {}) {
  const p = opts.progress;
  /* Posters already carry their name, so they get no overlay. Time left moves to a small tag. */
  const isPoster = !!(ti.poster || ti.wide);
  const left = p ? `${isSeries(ti) ? `S${p.s}:E${p.e} · ` : ''}${t('left', { n: Math.max(1, Math.round((p.dur - p.pos) / 60)) })}` : '';
  const tagText = opts.tag || (isPoster ? left : '');
  const tag = tagText ? `<span class="card-tag ${opts.tagClass || ''}">${esc(tagText)}</span>` : '';
  const pct = p ? Math.min(100, (p.pos / p.dur) * 100) : 0;
  const overlay = isPoster ? '' : `<span class="card-shade"></span>`;
  const text = isPoster ? '' : `<span class="card-text"><span class="art-title font-${ti.font || 'display'}" style="display:block">${esc(nm(ti))}</span>
    ${p ? `<span class="card-sub">${left}</span>` : ''}</span>`;
  return `<a class="card ${p ? 'has-progress' : ''}" href="#/title/${ti.id}" data-card="${ti.id}" aria-label="${esc(nm(ti))}">
    ${art(ti, 'sm', 'tall')}${overlay}${tag}
    ${text}
    ${p ? `<span class="progress"><i style="width:${pct}%"></i></span>` : ''}</a>`;
}

/* Lays a list out as a portrait grid followed by a landscape grid, never mixed. */
function shapeGrids(list, cell, cls = '') {
  const grid = (items, shape) => (items.length ? `<div class="grid ${shape} ${cls}">${items.map(cell).join('')}</div>` : '');
  return grid(list.filter(x => x.poster), 'grid-tall') + grid(list.filter(x => !x.poster), '');
}

/* Toast and modal */
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}
let modalReturnFocus = null, modalOnClose = null;
function openModal(html, { size = '', label = '', onClose = null } = {}) {
  closeModal(true);
  modalReturnFocus = document.activeElement;
  modalOnClose = onClose;
  $('#modal-root').innerHTML = `<div class="modal-back" data-modal-back><div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(label)}">
    <button class="icon-btn modal-x" data-act="closeModal" aria-label="${esc(t('close'))}">${icon('x')}</button>${html}</div></div>`;
  document.body.style.overflow = 'hidden';
  const f = $('.modal-x'); if (f) f.focus();
}
function closeModal(silent) {
  const had = !!$('#modal-root').firstElementChild;
  $$('#modal-root video').forEach(stopVideo);
  $('#modal-root').innerHTML = '';
  document.body.style.overflow = '';
  if (had && !silent) {
    const cb = modalOnClose; modalOnClose = null;
    if (cb) cb();
    if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus();
  }
}
ACTIONS.closeModal = () => closeModal();

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) { /* the link stays visible to copy by hand */ }
    ta.remove();
  }
  toast(L('Link copied', 'සබැඳිය පිටපත් විය'));
}
ACTIONS.copy = el => copyText(el.dataset.text);

/* Theme and language */
function applyPrefs() {
  document.documentElement.dataset.theme = store.theme;
  document.documentElement.lang = store.lang;
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = store.theme === 'dark' ? '#2C3E3B' : '#E6EFEC';
}
ACTIONS.toggleTheme = () => { store.theme = store.theme === 'dark' ? 'light' : 'dark'; save(); applyPrefs(); renderChrome(true); };
ACTIONS.toggleLang = () => { store.lang = store.lang === 'si' ? 'en' : 'si'; save(); applyPrefs(); route(true); };
CHANGES.setLang = el => { store.lang = el.value; save(); applyPrefs(); route(true); };
CHANGES.setTheme = el => { store.theme = el.value; save(); applyPrefs(); renderChrome(true); };
CHANGES.setCountry = el => {
  store.country = el.value; save();
  if (store.user) api('profile', { country: el.value }).catch(() => {}); toast(L(`Now viewing as ${COUNTRIES[el.value].name}`, `දැන් ${COUNTRIES[el.value].siName} ලෙස`)); route(true); };

/* Navigation, footer, cookie banner */
const logoHTML = () => `<span class="logo-mark" aria-hidden="true"></span><span class="logo-word">NEXFLIX</span><span class="sr">Nexflix</span>`;
const NAV = () => [
  ['#/', t('home'), 'home'],
  ['#/browse/cinema', catName('cinema'), 'film'],
  ['#/browse/teledrama', catName('teledrama'), 'tv'],
  ...['dubbed', 'programme'].filter(c => allTitles().some(x => x.cat === c && (isVisible(x) || isUpcoming(x)))).map(c => [`#/browse/${c}`, catName(c)]),
  ['#/new', t('newTrending'), 'flame'],
];
let navKey = null;
function renderChrome(force) {
  const hash = location.hash || '#/';
  const bare = /^#\/(watch|admin)/.test(hash);
  document.body.classList.toggle('has-tabs', !!store.user && !bare);
  if (bare) { $('#nav').innerHTML = ''; $('#footer').innerHTML = ''; navKey = null; return; }
  const key = [store.user && store.user.email, store.user && store.user.role, store.lang, store.theme, store.country, /^#\/(login|signup|reset|new-password)/.test(hash)].join('|');
  if (force || key !== navKey) {
    navKey = key;
    $('#nav').innerHTML = navHTML();
    $('#footer').innerHTML = footerHTML();
  }
  const base = hash.split('?')[0];
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.getAttribute('href') === base));
  onScroll();
}
function navHTML() {
  const u = store.user;
  const langBtn = `<button class="lang-btn" data-act="toggleLang" aria-label="${esc(t('language'))}: ${store.lang === 'si' ? 'English' : 'සිංහල'}"><span class="${store.lang === 'si' ? 'on' : ''}">සිං</span><i>|</i><span class="${store.lang === 'en' ? 'on' : ''}">EN</span></button>`;
  const theme = `<button class="nav-icon" data-act="toggleTheme" aria-label="${esc(store.theme === 'dark' ? t('themeLight') : t('themeDark'))}">${icon(store.theme === 'dark' ? 'sun' : 'moon')}</button>`;
  if (!u) {
    const onAuth = /^#\/(login|signup|reset|new-password)/.test(location.hash);
    return `<nav class="nav nav-out" aria-label="Main"><a class="brand" href="#/welcome">${logoHTML()}</a>
      <div class="nav-right">${langBtn}${onAuth ? '' : `<a class="btn btn-quiet btn-sm" href="#/login">${t('signIn')}</a>`}</div></nav>`;
  }
  const q = (location.hash.split('?q=')[1] || '');
  return `<nav class="nav" aria-label="Main"><a class="brand" href="#/">${logoHTML()}</a>
    <div class="nav-links">${NAV().map(n => `<a data-nav href="${n[0]}">${esc(n[1])}</a>`).join('')}</div>
    <div class="nav-right">
      <label class="search-box ${q ? 'open' : ''}" aria-label="${esc(t('search'))}">${icon('search')}<input id="search-input" type="search" value="${esc(decodeURIComponent(q))}" placeholder="${esc(t('searchPh'))}" aria-label="${esc(t('search'))}"></label>
      ${langBtn}${theme}
      <div class="menu"><button class="avatar" data-act="toggleMenu" aria-haspopup="true" aria-label="${esc(t('account'))}">${esc(u.name.charAt(0).toUpperCase())}</button>
        <div class="menu-pop" id="user-menu" hidden>
          <div class="menu-who"><b>${esc(u.name)}</b>${esc(u.email)}</div>
          <a href="#/account">${icon('user')}${t('account')}</a>
          ${u.role === 'admin' ? `<a href="#/admin/dashboard">${icon('grid')}${t('adminPanel')}</a>` : ''}
          <button data-act="signOut">${icon('back')}${t('signOut')}</button>
        </div></div>
    </div></nav>
    <nav class="mobile-tabs" aria-label="Sections">
      <a data-nav href="#/">${icon('home')}${esc(t('home'))}</a>
      <a data-nav href="#/browse/teledrama">${icon('tv')}${esc(catName('teledrama'))}</a>
      <a data-nav href="#/browse/cinema">${icon('film')}${esc(catName('cinema'))}</a>
      <a data-nav href="#/new">${icon('flame')}${esc(L('New', 'අලුත්'))}</a>
      <a data-nav href="#/account">${icon('user')}${esc(t('account'))}</a>
    </nav>`;
}
function footerHTML() {
  const links = [['about', 'ftAbout'], ['help', 'ftHelp'], ['contact', 'ftContact'], ['terms', 'ftTerms'], ['privacy', 'ftPrivacy'], ['cookies', 'ftCookies'], ['refunds', 'ftRefund'], ['copyright', 'ftCopyright'], ['ratings', 'ftRatings']];
  const methods = COUNTRIES[store.country].methods;
  return `<div class="site-footer">
    <div class="footer-top"><a class="brand" href="#/">${logoHTML()}</a>
      <div class="footer-socials">${['facebook', 'instagram', 'youtube'].map(s => `<a href="#/info/about" aria-label="${s}">${icon(s)}</a>`).join('')}</div></div>
    <div class="footer-prefs">
      <label>${icon('globe')}<span class="sr">${t('language')}</span><select class="input" data-change="setLang"><option value="en" ${store.lang === 'en' ? 'selected' : ''}>English</option><option value="si" ${store.lang === 'si' ? 'selected' : ''}>සිංහල</option></select></label>
      <label>${t('demoCountry')} <select class="input" data-change="setCountry">${Object.keys(COUNTRIES).map(c => `<option value="${c}" ${store.country === c ? 'selected' : ''}>${esc(countryName(c))}</option>`).join('')}</select></label>
    </div>
    <div class="footer-links">${links.map(l => `<a href="#/info/${l[0]}">${esc(t(l[1]))}</a>`).join('')}</div>
    <div class="pay-marks" aria-label="Payment methods">${methods.map(m => `<span>${esc(t({ card: 'payCard', voucher: 'payVoucher', dialog: 'payDialog' }[m]))}</span>`).join('')}</div>
    <p class="footer-small">© ${new Date().getFullYear()} Nexflix. ${esc(t('ftLegal'))}<br>${esc(t('ftSupport'))}<br>${esc(t('ftDemo'))}</p>
  </div>`;
}
function renderCookie() {
  const needs = COUNTRIES[store.country].cookies && !store.cookieChoice;
  $('#cookie-root').innerHTML = needs ? `<div class="cookie" role="dialog" aria-label="Cookies"><span>${esc(t('cookieMsg'))}</span><span class="acts">
    <button class="btn btn-ghost btn-sm" data-act="cookie" data-v="essential">${esc(t('cookieReject'))}</button>
    <button class="btn btn-primary btn-sm" data-act="cookie" data-v="all">${esc(t('cookieAccept'))}</button></span></div>` : '';
}
ACTIONS.cookie = el => { store.cookieChoice = el.dataset.v; save(); renderCookie(); };
ACTIONS.toggleMenu = () => { const m = $('#user-menu'); if (m) m.hidden = !m.hidden; };
ACTIONS.signOut = async () => {
  await syncProgress();
  try { await api('logout', {}); } catch (e) { /* signed out on this page anyway */ }
  clearAccount();
  go('#/welcome');
};
function onScroll() { const n = $('.nav'); if (n) n.classList.toggle('solid', window.scrollY > 40 || !/^#?\/?$/.test(location.hash.replace('#/', '')) && !/welcome|^#\/(login|signup|reset|new-password)/.test(location.hash) && !/^#\/browse/.test(location.hash)); }

/* Event delegation */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a && ACTIONS[a.dataset.act]) { e.preventDefault(); ACTIONS[a.dataset.act](a, e); }
  if (e.target.matches('[data-modal-back]')) closeModal();
  const m = $('#user-menu');
  if (m && !m.hidden && !e.target.closest('.menu')) m.hidden = true;
  if (m && !m.hidden && e.target.closest('.menu-pop a')) m.hidden = true;
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]');
  if (f && FORMS[f.dataset.form]) { e.preventDefault(); FORMS[f.dataset.form](f, e); }
});
document.addEventListener('change', e => {
  const c = e.target.closest('[data-change]');
  if (c && CHANGES[c.dataset.change]) CHANGES[c.dataset.change](c, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#modal-root').firstElementChild) closeModal();
});
window.addEventListener('scroll', onScroll, { passive: true });
