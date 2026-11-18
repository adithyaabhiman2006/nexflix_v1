/* Public pages and browsing: landing, home, category, new, search, title details, sign-in. */

const app = () => $('#app');

/* Landing */
function viewWelcome() {
  const posters = visibleTitles().filter(x => x.poster);
  const picks = posters.length ? Array.from({ length: 27 }, (_, i) => posters[i % posters.length]) : [];
  const faqs = [
    [L('What is Nexflix?', 'Nexflix යනු කුමක්ද?'), L('A subscription service for Sri Lankan programmes and Sinhala-dubbed entertainment, for viewers in Sri Lanka, Sri Lankans abroad and anyone interested in Sri Lanka.', 'ශ්‍රී ලාංකේය වැඩසටහන් සහ සිංහල හඬකැවූ විනෝදාස්වාදය සඳහා දායක සේවාවකි.')],
    [L('How much does it cost?', 'මිල කීයද?'), L(`In ${COUNTRIES[store.country].name} it's ${priceNow()} a month after a 7-day free trial. Prices are set per country.`, `${COUNTRIES[store.country].siName} තුළ දින 7ක නොමිලේ අත්හදා බැලීමෙන් පසු මසකට ${priceNow()}.`)],
    [L('How can I pay?', 'ගෙවන්නේ කෙසේද?'), L('By debit or credit card everywhere. In Sri Lanka you can also use voucher codes or Dialog billing.', 'සෑම තැනම කාඩ්පතකින්. ශ්‍රී ලංකාවේ වවුචර් හෝ ඩයලොග් බිල්පතෙන් ද ගෙවිය හැක.')],
    [L('Can I cancel?', 'අවලංගු කළ හැකිද?'), L('Yes, any time from your account page. You keep access until the end of the period you paid for.', 'ඔව්, ගිණුම් පිටුවෙන් ඕනෑම විටෙක. ගෙවූ කාලය අවසන් වන තුරු නැරඹිය හැක.')],
    [L('Is everything available in my country?', 'මගේ රටේ සියල්ල තිබේද?'), L('Each title is licensed country by country, so the catalogue changes with where you are watching from. Try switching country in the footer.', 'සෑම මාතෘකාවක්ම රට අනුව බලපත්‍ර ලබා ඇති නිසා නාමාවලිය රට අනුව වෙනස් වේ.')],
  ];
  app().innerHTML = `
    <section class="landing-hero">
      <div class="mosaic" aria-hidden="true">${picks.map(x => `<div>${art(x, 'sm', 'tall')}</div>`).join('')}</div>
      <div class="landing-copy">
        <h1>${esc(t('heroTitle'))}</h1>
        <p class="lead">${esc(t('heroSub'))}</p>
        <p class="price">${esc(t('heroPrice', { price: priceNow() }))}</p>
        <form class="signup-inline" data-form="landingSignup">
          <label class="sr" for="landing-email">${esc(t('emailPh'))}</label>
          <input class="input" id="landing-email" type="email" required placeholder="${esc(t('emailPh'))}" autocomplete="email">
          <button class="btn btn-primary btn-lg">${esc(t('getStarted'))} ${icon('right')}</button>
        </form>
        <div class="demo-actions"><span class="pill">${esc(t('demoBadge'))}</span>
          <a href="#" data-act="demoViewer">${esc(t('tryViewer'))}</a> · <a href="#" data-act="demoAdmin">${esc(t('tryAdmin'))}</a></div>
      </div>
    </section>
    <section class="feature-grid">
      <div class="feature">${icon('globe')}<h3>${esc(t('feat1'))}</h3><p>${esc(t('feat1b'))}</p></div>
      <div class="feature">${icon('card')}<h3>${esc(t('feat2'))}</h3><p>${esc(t('feat2b'))}</p></div>
      <div class="feature">${icon('phone')}<h3>${esc(t('feat3'))}</h3><p>${esc(t('feat3b'))}</p></div>
    </section>
    <section class="faq"><h2>${esc(t('faqTitle'))}</h2>
      ${faqs.map(q => `<details class="q"><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}
    </section>`;
}
FORMS.landingSignup = f => { sessionStorage.setItem('nx-email', f.querySelector('input').value); go('#/signup'); };

ACTIONS.demoViewer = () => {
  store.user = { name: 'Demo Viewer', email: 'viewer@example.com', role: 'viewer', since: NOW - 62 * DAY };
  seedMember(); save(); go('#/');
};
ACTIONS.demoAdmin = () => {
  store.user = { name: 'Demo Admin', email: 'admin@example.com', role: 'admin', since: NOW - 200 * DAY };
  seedMember(); save(); go('#/admin/dashboard');
};
function seedMember() {
  store.sub = { status: 'active', trialUsed: true, method: 'card', start: NOW - 62 * DAY, periodEnd: NOW + 18 * DAY };
  const c = COUNTRIES[store.country];
  store.payments = [
    { date: NOW - 12 * DAY, label: 'Monthly plan', method: 'card', amount: c.amount, currency: c.currency, status: 'paid', ref: 'DEMO-48213' },
    { date: NOW - 42 * DAY, label: 'Monthly plan', method: 'card', amount: c.amount, currency: c.currency, status: 'failed', ref: 'DEMO-47102' },
    { date: NOW - 41 * DAY, label: 'Monthly plan', method: 'card', amount: c.amount, currency: c.currency, status: 'paid', ref: 'DEMO-47118' },
  ];
  store.otherStreams = [{ id: 'd1', name: 'Android phone', where: 'Colombo', icon: 'phone', streaming: false }];
  if (!Object.keys(store.progress).length) {
    store.progress = {
      'koombiyo': { s: 1, e: 3, pos: 840, dur: 1800, ts: NOW - 3600000 },
      'ayu': { s: 1, e: 1, pos: 4300, dur: 7200, ts: NOW - 86400000 },
      'passport': { s: 1, e: 1, pos: 1500, dur: 7200, ts: NOW - 172800000 },
    };
  }
}

/* Rows */
function rowHTML(title, inner, id = '') {
  return `<section class="row" ${id ? `id="${id}"` : ''}><h2 class="row-title">${esc(title)}</h2>
    <div class="row-wrap"><button class="row-arrow l" data-act="rowScroll" data-dir="-1" aria-label="${esc(L('Scroll left', 'වමට'))}" hidden>${icon('left')}</button>
    <div class="row-track">${inner}</div>
    <button class="row-arrow r" data-act="rowScroll" data-dir="1" aria-label="${esc(L('Scroll right', 'දකුණට'))}">${icon('right')}</button></div></section>`;
}
ACTIONS.rowScroll = el => {
  const track = $('.row-track', el.parentElement);
  track.scrollBy({ left: track.clientWidth * 0.86 * Number(el.dataset.dir), behavior: 'smooth' });
};
function wireRows(root = document) {
  $$('.row-track', root).forEach(track => {
    const wrap = track.parentElement, l = $('.row-arrow.l', wrap), r = $('.row-arrow.r', wrap);
    const sync = () => {
      l.hidden = track.scrollLeft < 8;
      r.hidden = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    };
    track.addEventListener('scroll', sync, { passive: true });
    sync();
  });
}
function trendingList() {
  const vis = visibleTitles().filter(x => x.poster);
  const ranked = vis.filter(x => x.trending).sort((a, b) => a.trending - b.trending);
  const rest = vis.filter(x => !x.trending && !isWideOnly(x));
  return ranked.concat(rest).slice(0, 10);
}
function rankRow() {
  return trendingList().map((ti, i) => `<div class="rank-card"><span class="rank-num" aria-hidden="true">${i + 1}</span>
    <a class="rank-poster" href="#/title/${ti.id}" data-card="${ti.id}" aria-label="${i + 1}. ${esc(nm(ti))}">${art(ti, 'sm', 'tall')}${ti.poster || ti.wide ? '' : `<span class="card-shade"></span>
    <span class="card-text"><span class="art-title font-${ti.font}" style="display:block">${esc(nm(ti))}</span></span>`}</a></div>`).join('');
}
function homeRow(key) {
  const vis = visibleTitles().filter(x => x.poster);
  if (key === 'new') { const l = vis.filter(x => x.isNew); return l.length ? rowHTML(t('rowNew'), l.map(x => cardHTML(x, { tag: L('New', 'අලුත්') })).join('')) : ''; }
  if (key === 'trending') return vis.length ? rowHTML(t('rowTrending', { country: countryName(store.country) }), rankRow()) : '';
  if (key === 'soon') { const l = upcomingTitles(); return l.length ? rowHTML(t('rowSoon'), l.map(x => cardHTML(x, { tag: fmtDate(x.releaseAt, { day: 'numeric', month: 'short' }), tagClass: 'soon' })).join('')) : ''; }
  const l = vis.filter(x => x.cat === key);
  return l.length ? rowHTML(catName(key), l.map(x => cardHTML(x)).join('')) : '';
}

/* Hero */
function heroSlides(list) {
  return `<section class="hero" aria-label="${esc(L('Featured', 'විශේෂාංග'))}">
    ${list.map((ti, i) => `<div class="hero-slide ${i === 0 ? 'on' : ''}" data-id="${ti.id}" ${i ? 'aria-hidden="true"' : ''}>
      <div class="hero-art">${art(ti, 'lg')}${ti.poster && ti.wide ? art(ti, 'lg', 'tall') : ''}</div>
      ${trailerSoundBtn(ti)}
      <div class="hero-body" style="z-index:2">
        <div class="hero-kicker">${esc(catName(ti.cat))}</div>
        <h1 class="hero-name font-${ti.font}">${esc(nm(ti))}</h1>
        <div class="hero-alt">${esc(altNm(ti))}</div>
        <div class="hero-meta"><span class="rating">${esc(ti.rating)}</span>${ti.year ? `<span>${ti.year}</span>` : ''}<span>${isSeries(ti) ? seasonText(ti) : t('minutes', { n: ti.mins })}</span><span>${ti.genres.map(genreName).map(esc).join(' · ')}</span></div>
        <p class="hero-syn">${esc(synOf(ti))}</p>
        <div class="hero-cta"><a class="btn btn-primary btn-lg" href="${playHref(ti)}">${icon('play')}${esc(playLabel(ti))}</a>
          <a class="btn btn-secondary btn-lg" href="#/title/${ti.id}">${icon('info')}${esc(t('moreInfo'))}</a></div>
      </div></div>`).join('')}
    ${list.length > 1 ? `<div class="hero-dots">${list.map((ti, i) => `<button class="${i === 0 ? 'on' : ''}" data-act="heroGo" data-i="${i}" aria-label="${esc(nm(ti))}"></button>`).join('')}</div>` : ''}
  </section>`;
}
const seasonText = ti => (ti.seasons.length > 1 ? t('seasons', { n: ti.seasons.length }) : t('seasonOne'));
const HERO_SECONDS = 14;
let heroIndex = 0, heroWait = 0, heroTrailer = null;
/* Starts the current slide: its image now, its trailer a few seconds later. */
function heroPlay() {
  if (heroTrailer) heroTrailer.stop();
  heroWait = 0;
  const slide = $$('.hero-slide')[heroIndex];
  const ti = slide && getTitle(slide.dataset.id);
  heroTrailer = ti ? playTrailer($('.hero-art', slide), ti, { sound: true, onEnd: () => { heroWait = HERO_SECONDS; } }) : null;
}
function heroShow(i) {
  const slides = $$('.hero-slide'), dots = $$('.hero-dots button');
  if (!slides.length) return;
  heroIndex = (i + slides.length) % slides.length;
  slides.forEach((s, n) => { s.classList.toggle('on', n === heroIndex); if (n === heroIndex) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); });
  dots.forEach((d, n) => d.classList.toggle('on', n === heroIndex));
  heroPlay();
}
function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* The next slide in random order: every other movie plays before the queue is drawn again, so none repeats back to back. */
let heroQueue = [];
function heroNext() {
  if (!heroQueue.length) heroQueue = shuffled($$('.hero-slide').map((_, i) => i).filter(i => i !== heroIndex));
  return heroQueue.length ? heroQueue.shift() : heroIndex;
}
ACTIONS.heroGo = el => {
  const i = Number(el.dataset.i);
  heroQueue = heroQueue.filter(x => x !== i);
  heroShow(i);
};
function startHero() {
  heroIndex = 0;
  heroQueue = [];
  CLEAN.push(() => { if (heroTrailer) heroTrailer.stop(); heroTrailer = null; });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  heroPlay();
  /* A slide with a trailer stays up until the video ends; other slides stay for HERO_SECONDS. */
  const timer = setInterval(() => {
    const hero = $('.hero');
    const away = document.hidden || $('#modal-root').firstElementChild || (location.hash && !/^#\/?$|^#\/browse/.test(location.hash)) || !hero || hero.getBoundingClientRect().bottom < 80;
    if (heroTrailer) { if (away) heroTrailer.pause(); else heroTrailer.resume(); }
    /* Holds only over the buttons, so a slide never changes under a click. The banner fills most of the screen, so pausing on all of it would stop rotation. */
    if (away || $('.hero-slide.on .hero-cta:hover, .hero-dots:hover') || (heroTrailer && heroTrailer.running())) return;
    if (++heroWait >= HERO_SECONDS) heroShow(heroNext());
  }, 1000);
  CLEAN.push(() => clearInterval(timer));
}

/* Home */
function viewHome() {
  let banner = store.admin.banner.map(getTitle).filter(x => x && isVisible(x) && x.wide);
  if (!banner.length) banner = DEFAULT_BANNER.map(getTitle).filter(x => x && isVisible(x));
  if (!banner.length) banner = visibleTitles().filter(x => x.wide).slice(0, 3);
  if (!banner.length) { app().innerHTML = `<div class="page"><div class="empty"><h2>${esc(L('Nothing here yet', 'තවම කිසිවක් නැත'))}</h2></div></div>`; return; }
  const cont = continueList();
  const notice = !hasAccess() ? `<div class="notice-bar"><span>${esc(t('trialBar'))}</span><a class="btn btn-primary btn-sm" href="#/plans">${esc(store.sub.trialUsed ? t('subscribeNow') : t('startTrial'))}</a></div>` : '';
  const trailers = visibleTitles().filter(x => x.trailer);
  app().innerHTML = `${heroSlides(shuffled(banner))}
    <div class="rows">${notice}
      ${cont.length ? rowHTML(t('rowContinue'), cont.map(x => cardHTML(x.ti, { progress: x.p })).join('')) : ''}
      ${trailers.length ? rowHTML(t('rowTrailers'), trailers.map(x => cardHTML(x)).join('')) : ''}
      ${store.admin.rows.map(homeRow).join('')}
    </div>`;
  wireRows(); startHero();
}

/* Category */
function viewBrowse(cat) {
  if (!CATEGORIES[cat]) return viewNotFound();
  const hasPoster = x => (x.poster || x.wide ? 1 : 0);
  const list = visibleTitles().filter(x => x.cat === cat && x.poster).sort((a, b) => hasPoster(b) - hasPoster(a));
  const soon = upcomingTitles().filter(x => x.cat === cat);
  if (!list.length && !soon.length) {
    app().innerHTML = `<div class="page"><h1 class="page-title">${esc(catName(cat))}</h1><div class="empty">${esc(L(`Nothing in this category is licensed for ${COUNTRIES[store.country].name} yet.`, 'මෙම කාණ්ඩයේ කිසිවක් තවම ඔබේ රටට බලපත්‍ර ලබා නැත.'))}</div></div>`;
    return;
  }
  const inCat = visibleTitles().filter(x => x.cat === cat);
  const hero = inCat.find(x => x.bannerPos) || inCat.find(x => x.wide);
  const genresHere = Array.from(new Set(list.flatMap(x => x.genres)));
  app().innerHTML = `${hero ? heroSlides([hero]) : ''}<div class="page" style="${hero ? 'padding-top:0;' : ''}position:relative;z-index:3">${hero ? '' : `<h1 class="page-title">${esc(catName(cat))}</h1>`}
    <div class="chips" role="group" aria-label="${esc(t('genres'))}"><button class="chip on" data-act="genreFilter" data-g="">${esc(t('all'))}</button>${genresHere.map(g => `<button class="chip" data-act="genreFilter" data-g="${g}">${esc(genreName(g))}</button>`).join('')}</div>
    ${shapeGrids(list.concat(soon), x => `<div data-genres="${x.genres.join(' ')}">${cardHTML(x, isUpcoming(x) ? { tag: fmtDate(x.releaseAt, { day: 'numeric', month: 'short' }), tagClass: 'soon' } : {})}</div>`, 'cat-items')}
  </div>`;
  if (hero) startHero();
}
ACTIONS.genreFilter = el => {
  $$('.chip', el.parentElement).forEach(c => c.classList.toggle('on', c === el));
  $$('.cat-items > div').forEach(d => { d.hidden = !!el.dataset.g && !d.dataset.genres.split(' ').includes(el.dataset.g); });
};

/* New and trending */
function viewNew() {
  const soon = upcomingTitles();
  const fresh = visibleTitles().filter(x => x.isNew && x.poster);
  app().innerHTML = `<div class="page">
    <h1 class="page-title">${esc(t('newTrending'))}</h1>
    <p class="page-sub">${esc(L(`What's arriving and what people in ${COUNTRIES[store.country].name} are watching.`, 'අලුතින් එන දේ සහ ජනප්‍රිය දේ.'))}</p>
    ${soon.length ? `<h2 class="row-title" style="padding:0">${esc(t('rowSoon'))}</h2><div class="soon-list" style="margin-bottom:34px">${soon.map(x => `
      <div class="soon-item"><div class="soon-date"><b>${fmtDate(x.releaseAt, { day: 'numeric' })}</b>${esc(fmtDate(x.releaseAt, { month: 'short' }))}</div>
      ${cardHTML(x)}
      <div class="soon-copy"><h3 class="font-${x.font}" style="font-size:22px">${esc(nm(x))}</h3><p class="muted" style="font-size:14.5px;margin:4px 0 10px">${esc(synOf(x))}</p>
      <a class="btn btn-ghost btn-sm" href="#/watch/${x.id}/trailer">${icon('film')}${esc(t('freeTrailer'))}</a></div></div>`).join('')}</div>` : ''}
    </div>
    <div style="margin-top:-30px;padding-bottom:40px">
    ${rowHTML(t('rowTrending', { country: countryName(store.country) }), rankRow())}
    ${fresh.length ? rowHTML(t('rowNew'), fresh.map(x => cardHTML(x, { tag: L('New', 'අලුත්') })).join('')) : ''}
    </div>`;
  wireRows();
}

/* Search: Sinhala script or English letters, tolerant of spelling, like trigram matching. */
const norm = s => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
function trigrams(s) {
  const p = `  ${s} `; const g = new Set();
  for (let i = 0; i < p.length - 2; i++) g.add(p.slice(i, i + 3));
  return g;
}
function similarity(a, b) {
  const A = trigrams(a), B = trigrams(b); let both = 0;
  A.forEach(x => { if (B.has(x)) both++; });
  return both / (A.size + B.size - both);
}
function searchTitles(q) {
  const nq = norm(q);
  if (!nq) return [];
  return visibleTitles().concat(upcomingTitles()).map(ti => {
    const names = [ti.en, ti.si, ...(ti.aliases || [])].filter(Boolean).map(norm);
    let score = 0;
    names.forEach(n => {
      if (n === nq) score = Math.max(score, 3);
      else if (n.startsWith(nq)) score = Math.max(score, 2);
      else if (n.includes(nq)) score = Math.max(score, 1.5);
      else score = Math.max(score, similarity(n, nq));
    });
    return { ti, score };
  }).filter(x => x.score >= 0.3).sort((a, b) => b.score - a.score).map(x => x.ti);
}
function viewSearch(q) {
  const results = searchTitles(q);
  if (!q) {
    app().innerHTML = `<div class="page"><div class="empty"><h2>${esc(t('search'))}</h2>${esc(t('searchEmpty', { a: 'නිල් කන්ද', b: 'neel kanda' }))}</div></div>`;
  } else if (!results.length) {
    app().innerHTML = `<div class="page"><div class="empty"><h2>${esc(t('searchNone', { q, country: countryName(store.country) }))}</h2>${esc(t('searchEmpty', { a: 'නිල් කන්ද', b: 'neel kanda' }))}</div></div>`;
  } else {
    app().innerHTML = `<div class="page"><h1 class="page-title">${esc(t('searchResults', { q }))}</h1><p class="page-sub">${results.length}</p>${shapeGrids(results, x => cardHTML(x, isUpcoming(x) ? { tag: fmtDate(x.releaseAt, { day: 'numeric', month: 'short' }), tagClass: 'soon' } : {}))}</div>`;
  }
}
let searchTimer;
document.addEventListener('input', e => {
  if (e.target.id !== 'search-input') return;
  clearTimeout(searchTimer);
  const v = e.target.value;
  searchTimer = setTimeout(() => {
    if (v.trim()) { history.replaceState(null, '', `#/search?q=${encodeURIComponent(v.trim())}`); route(); } else if (/^#\/search/.test(location.hash)) go('#/');
  }, 220);
});

/* Title details */
function titleModal(id) {
  const ti = getTitle(id);
  if (!ti || (ti.status === 'draft' && !(store.user && store.user.role === 'admin'))) {
    openModal(`<div class="modal-pad"><h2>${esc(t('notFound'))}</h2><a class="btn btn-primary" href="#/">${esc(t('backHome'))}</a></div>`, { size: 'sm', label: t('notFound'), onClose: closeTitleRoute });
    return;
  }
  const blocked = !inCountry(ti);
  const expired = !licensed(ti);
  const upcoming = isUpcoming(ti);
  let actions = '';
  if (blocked || expired) actions = '';
  else if (upcoming) actions = `<a class="btn btn-primary" href="#/watch/${ti.id}/trailer">${icon('film')}${esc(t('freeTrailer'))}</a>`;
  else actions = `<a class="btn btn-primary" href="${playHref(ti)}">${icon('play')}${esc(playLabel(ti))}</a>
    <a class="btn btn-ghost" href="#/watch/${ti.id}/trailer">${icon('film')}${esc(t('freeTrailer'))}</a>`;
  actions += `<button class="btn btn-ghost" data-act="shareTitle" data-id="${ti.id}">${icon('share')}${esc(t('share'))}</button>`;
  const prog = store.progress[ti.id];
  const startSeason = prog ? prog.s : 1;
  const more = visibleTitles().filter(x => x.cat === ti.cat && x.id !== ti.id && x.poster).slice(0, 6);
  openModal(`
    <div class="m-hero">${art(ti, 'lg')}${blocked || expired ? '' : trailerSoundBtn(ti)}<div class="m-hero-body"><h2 class="art-title font-${ti.font}">${esc(nm(ti))}</h2><div class="m-alt">${esc(altNm(ti))}</div></div></div>
    <div class="m-body">
      ${blocked ? `<div class="block-msg">${icon('globe')}<div><b>${esc(t('notAvailable', { country: countryName(store.country) }))}</b><br>${esc(t('notAvailableBody'))}</div></div>` : ''}
      ${expired ? `<div class="block-msg">${icon('alert')}<div><b>${esc(L('No longer available', 'දැන් ලබාගත නොහැක'))}</b><br>${esc(L('The licence period for this title has ended.', 'මෙම මාතෘකාවේ බලපත්‍ර කාලය අවසන්.'))}</div></div>` : ''}
      ${upcoming ? `<div class="block-msg">${icon('clock')}<div><b>${esc(t('releases', { date: fmtDate(ti.releaseAt) }))}</b></div></div>` : ''}
      <div class="m-actions">${actions}</div>
      <div class="m-grid"><div>
        <div class="m-meta"><span class="rating">${esc(ti.rating)}</span>${ti.year ? `<span>${ti.year}</span>` : ''}<span>${isSeries(ti) ? seasonText(ti) : t('minutes', { n: ti.mins })}</span>${ti.isNew ? `<span class="pill new">${esc(L('New', 'අලුත්'))}</span>` : ''}</div>
        <p>${esc(synOf(ti))}</p></div>
        <div class="m-side"><span><b>${esc(t('genres'))}:</b> ${ti.genres.map(genreName).map(esc).join(', ')}</span><span>${esc(t('subtitlesAvail'))}</span><span><b>${esc(L('Category', 'කාණ්ඩය'))}:</b> ${esc(catName(ti.cat))}</span></div>
      </div>
      ${isSeries(ti) ? `<div class="m-sec"><div class="m-sec-head"><h3>${esc(t('episodes'))}</h3>
        ${ti.seasons.length > 1 ? `<select class="input" data-change="seasonPick" data-id="${ti.id}" aria-label="${esc(L('Season', 'වාරය'))}">${ti.seasons.map((_, i) => `<option value="${i + 1}" ${i + 1 === startSeason ? 'selected' : ''}>${esc(t('season', { n: i + 1 }))}</option>`).join('')}</select>` : ''}</div>
        <div id="ep-list">${episodeList(ti, startSeason)}</div></div>` : ''}
      ${more.length ? `<div class="m-sec"><div class="m-sec-head"><h3>${esc(t('more', { cat: catName(ti.cat) }))}</h3></div><div class="mini-grid">${more.map(x => cardHTML(x)).join('')}</div></div>` : ''}
    </div>`, { label: nm(ti), onClose: closeTitleRoute });
  if (!blocked && !expired) playTrailer($('.m-hero'), ti, { delay: 1500, loop: true, sound: true });
}
function closeTitleRoute() { if (/^#\/title\//.test(location.hash)) go(baseHash || (store.user ? '#/' : '#/welcome')); }
function episodeList(ti, s) {
  const prog = store.progress[ti.id];
  const up = isUpcoming(ti) || !inCountry(ti) || !licensed(ti);
  return episodes(ti, s).map(ep => {
    const locked = up || !!ep.releaseAt;
    const inner = `<span class="ep-n">${ep.n}</span><span class="ep-art">${art(ti)}${prog && prog.s === s && prog.e === ep.n && !prog.done ? `<span class="progress"><i style="width:${(prog.pos / prog.dur) * 100}%"></i></span>` : ''}</span>
      <span><span class="ep-head"><span>${esc(t('episode', { n: ep.n }))}</span><span>${ep.releaseAt ? esc(t('releases', { date: fmtDate(ep.releaseAt, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) })) : esc(t('minutes', { n: ep.mins }))}</span></span>
      <span class="ep-syn">${esc(ep.syn[store.lang === 'si' ? 1 : 0])}</span></span>`;
    return locked ? `<div class="ep locked">${inner}</div>` : `<a class="ep" href="#/watch/${ti.id}/${s}/${ep.n}">${inner}</a>`;
  }).join('');
}
CHANGES.seasonPick = el => { $('#ep-list').innerHTML = episodeList(getTitle(el.dataset.id), Number(el.value)); };

function titleUrl(id, tags = '') {
  return `${location.origin}${location.pathname}#/title/${id}${tags}`;
}
ACTIONS.shareTitle = el => {
  const ti = getTitle(el.dataset.id);
  const url = titleUrl(ti.id, '?utm_source=share');
  const inner = `<div class="modal-pad"><h2>${esc(t('share'))}</h2>
    <p class="muted" style="font-size:14px">${esc(L('This is how the link looks in social and chat apps.', 'සමාජ මාධ්‍යවල සබැඳිය පෙනෙන ආකාරය.'))}</p>
    <div class="share-preview"><div class="sp-art">${art(ti)}</div><div class="sp-text"><b>${esc(nm(ti))} · Nexflix</b><small>${esc(synOf(ti).slice(0, 96))}…</small></div></div>
    <div class="copy-row"><input class="input" readonly value="${esc(url)}" aria-label="Link"><button class="btn btn-primary" data-act="copy" data-text="${esc(url)}">${esc(L('Copy', 'පිටපත්'))}</button></div></div>`;
  openModal(inner, { size: 'sm', label: t('share'), onClose: () => { route(true); } });
};

/* Hover preview */
/* Sign in, sign up, reset */
function authShell(inner) { return `<div class="auth-wrap"><div class="auth-card">${inner}</div></div>`; }
const demoNote = () => `<div class="demo-note">${icon('info')}<span>${esc(L('Demo only. Nothing leaves this browser and no password is saved. Use any address containing "admin" to get the admin panel.', 'ආදර්ශනයකි. කිසිවක් සේවාදායකයට නොයයි, මුරපද ගබඩා නොවේ.'))}</span></div>`;
function viewLogin() {
  app().innerHTML = authShell(`<h1>${esc(t('signIn'))}</h1><form data-form="login">
    <label class="field"><span>${esc(t('fEmail'))}</span><input class="input" name="email" type="email" required autocomplete="username"></label>
    <label class="field"><span>${esc(t('fPassword'))}</span><input class="input" name="password" type="password" required autocomplete="current-password"></label>
    <div class="form-err" role="alert"></div>
    <button class="btn btn-primary btn-block">${esc(t('signIn'))}</button></form>
    <div class="auth-links"><a href="#/reset">${esc(t('forgot'))}</a><br><br>${esc(t('newHere'))} <a href="#/signup">${esc(t('signUp'))}</a></div>${demoNote()}`);
}
function viewSignup() {
  let email = '';
  try { email = sessionStorage.getItem('nx-email') || ''; } catch (e) { /* ignored */ }
  app().innerHTML = authShell(`<h1>${esc(t('createAccount'))}</h1><form data-form="signup">
    <label class="field"><span>${esc(t('fName'))}</span><input class="input" name="name" required autocomplete="name"></label>
    <label class="field"><span>${esc(t('fEmail'))}</span><input class="input" name="email" type="email" required value="${esc(email)}" autocomplete="email"></label>
    <label class="field"><span>${esc(t('fPassword'))}</span><input class="input" name="password" type="password" required minlength="8" autocomplete="new-password"><div class="field-hint">${esc(L('At least 8 characters', 'අවම වශයෙන් අකුරු 8ක්'))}</div></label>
    <label class="field"><span>${esc(t('country'))}</span><select class="input" name="country">${Object.keys(COUNTRIES).map(c => `<option value="${c}" ${c === store.country ? 'selected' : ''}>${esc(countryName(c))}</option>`).join('')}</select></label>
    <button class="btn btn-primary btn-block">${esc(t('getStarted'))}</button></form>
    <div class="auth-links">${esc(t('haveAccount'))} <a href="#/login">${esc(t('signIn'))}</a></div>${demoNote()}`);
}
function viewReset() {
  app().innerHTML = authShell(`<h1>${esc(t('resetTitle'))}</h1><form data-form="reset">
    <label class="field"><span>${esc(t('fEmail'))}</span><input class="input" name="email" type="email" required></label>
    <button class="btn btn-primary btn-block">${esc(t('resetSend'))}</button></form>
    <div class="auth-links"><a href="#/login">${esc(t('signIn'))}</a></div>`);
}
const roleFor = email => (/admin/i.test(email) ? 'admin' : 'viewer');
function afterAuth() {
  let target = '';
  try { target = sessionStorage.getItem('nx-return') || ''; sessionStorage.removeItem('nx-return'); } catch (e) { /* ignored */ }
  go(target || '#/');
}
FORMS.login = f => {
  const email = f.email.value.trim();
  const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  store.user = { name, email, role: roleFor(email), since: NOW };
  if (store.user.role === 'admin' && store.sub.status === 'none') seedMember();
  save(); afterAuth();
};
FORMS.signup = f => {
  store.user = { name: f.name.value.trim(), email: f.email.value.trim(), role: roleFor(f.email.value), since: NOW };
  store.country = f.country.value;
  store.sub = { status: 'none', trialUsed: false };
  store.payments = []; store.progress = {}; store.otherStreams = [];
  try { sessionStorage.removeItem('nx-email'); } catch (e) { /* ignored */ }
  save(); go('#/plans');
};
FORMS.reset = f => {
  $('.auth-card').innerHTML = `<h1>${esc(L('Check your email', 'විද්‍යුත් තැපෑල බලන්න'))}</h1><p class="muted">${esc(L(`If an account exists for ${f.email.value}, a reset link is on its way. In this demo no email is sent.`, 'ගිණුමක් තිබේ නම් යළි සැකසුම් සබැඳියක් එවනු ලැබේ. මෙම ආදර්ශනයේ තැපෑලක් නොයැවේ.'))}</p><div class="auth-links"><a href="#/login">${esc(t('signIn'))}</a></div>`;
};

/* Simple pages */
const INFO = {
  about: ['ftAbout', 'Nexflix brings Sri Lankan programmes and Sinhala-dubbed entertainment to viewers in Sri Lanka, Sri Lankans abroad and anyone interested in Sri Lanka.'],
  help: ['ftHelp', 'Help articles will be published here.'],
  contact: ['ftContact', 'General support, billing support and copyright complaints will each have a named contact and a reply-time promise.'],
  terms: ['ftTerms', 'Placeholder. Terms of service need review by a lawyer before launch.'],
  privacy: ['ftPrivacy', 'Placeholder. The privacy policy needs review by a lawyer before launch.'],
  cookies: ['ftCookies', 'Placeholder. A cookie policy with a consent banner applies to UK and EU viewers.'],
  refunds: ['ftRefund', 'Placeholder. The refund and cancellation policy needs review by a lawyer before launch.'],
  copyright: ['ftCopyright', 'Placeholder. Copyright owners will be able to send takedown requests here.'],
  ratings: ['ftRatings', 'Titles are rated PG, 12+ or 15+. Rating rules and parental guidance will be published here.'],
};
function viewInfo(page) {
  const p = INFO[page];
  if (!p) return viewNotFound();
  app().innerHTML = `<div class="page page-narrow"><h1 class="page-title">${esc(t(p[0]))}</h1><p class="page-sub" style="font-size:18px">${esc(p[1])}</p></div>`;
}
function viewNotFound() {
  app().innerHTML = `<div class="page"><div class="empty"><h2>${esc(t('notFound'))}</h2><p style="margin-bottom:18px"></p><a class="btn btn-primary" href="#/">${esc(t('backHome'))}</a></div></div>`;
}
