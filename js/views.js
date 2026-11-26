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
        <p class="lead lead-alt" lang="${store.lang === 'si' ? 'en' : 'si'}">${esc(STRINGS.heroTitle[store.lang === 'si' ? 0 : 1])}</p>
        <p class="price">${esc(t('heroPrice', { price: priceNow() }))}</p>
        <form class="signup-inline" data-form="landingSignup">
          <label class="sr" for="landing-email">${esc(t('emailPh'))}</label>
          <input class="input" id="landing-email" type="email" required placeholder="${esc(t('emailPh'))}" autocomplete="email">
          <button class="btn btn-primary btn-lg">${esc(t('startTrial'))}</button>
        </form>
      </div>
    </section>
    <section class="feature-grid">
      <div class="feature"><h3>${esc(t('feat1'))}</h3><p>${esc(t('feat1b'))}</p></div>
      <div class="feature"><h3>${esc(t('feat2'))}</h3><p>${esc(t('feat2b'))}</p></div>
      <div class="feature"><h3>${esc(t('feat3'))}</h3><p>${esc(t('feat3b'))}</p></div>
    </section>
    <section class="faq"><h2>${esc(t('faqTitle'))}</h2>
      ${faqs.map(q => `<details class="q"><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}
    </section>`;
}
FORMS.landingSignup = f => { sessionStorage.setItem('nx-email', f.querySelector('input').value); go('#/signup'); };


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
        <div class="hero-kicker">${ti.isNew ? `<span class="tag-new">${esc(isSeries(ti) ? L('New series', 'නව කතා මාලාව') : ti.cat === 'cinema' ? L('New film', 'නව චිත්‍රපටය') : L('New', 'අලුත්'))}</span>` : esc(catName(ti.cat))}</div>
        <h1 class="hero-name font-${ti.font}">${esc(nm(ti))}</h1>
        <div class="hero-alt">${esc(altNm(ti))}</div>
        <div class="hero-meta">${ti.year ? `<span>${ti.year}</span>` : ''}<span>${ti.genres.map(genreName).map(esc).join(', ')}</span><span>${isSeries(ti) ? seasonText(ti) : t('minutes', { n: ti.mins })}</span><span class="rating">${esc(ti.rating)}</span><span>${esc(L('Sinhala · English subtitles', 'සිංහල · ඉංග්‍රීසි උපසිරැසි'))}</span></div>
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
  const genresHere = Array.from(new Set(list.flatMap(x => x.genres)));
  const other = CATEGORIES[cat][store.lang === 'si' ? 'en' : 'si'];
  const sorts = [['new', L('Newest first', 'අලුත්ම මුලින්')], ['az', L('A to Z', 'අකාරාදී')], ['year', L('Oldest first', 'පැරණිම මුලින්')]];
  app().innerHTML = `<div class="page cat-page">
    <div class="cat-head"><h1 class="page-title">${esc(catName(cat))} <span class="tp-alt">${esc(other)}</span></h1>
      <label class="sort-box">${esc(L('Sort', 'පෙළගස්වන්න'))} <select class="input" data-change="catSort">${sorts.map(s => `<option value="${s[0]}">${esc(s[1])}</option>`).join('')}</select></label></div>
    <div class="chips" role="group" aria-label="${esc(t('genres'))}"><button class="chip on" data-act="genreFilter" data-g="">${esc(t('all'))}</button>${list.some(x => x.isNew) ? `<button class="chip" data-act="genreFilter" data-g="new">${esc(L('New', 'අලුත්'))}</button>` : ''}${genresHere.map(g => `<button class="chip" data-act="genreFilter" data-g="${g}">${esc(genreName(g))}</button>`).join('')}</div>
    <div class="poster-grid cat-items" id="cat-items">${catCells(list, soon, 'new')}</div>
  </div>`;
}
function catCells(list, soon, sort) {
  const by = { new: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || (b.year || 0) - (a.year || 0), az: (a, b) => nm(a).localeCompare(nm(b)), year: (a, b) => (a.year || 9999) - (b.year || 9999) }[sort];
  return list.slice().sort(by).concat(soon).map(x => {
    const g = x.genres.join(' ') + (x.isNew ? ' new' : '');
    const opts = isUpcoming(x) ? { tag: fmtDate(x.releaseAt, { day: 'numeric', month: 'short' }), tagClass: 'soon' } : x.isNew ? { tag: L('New', 'අලුත්'), tagClass: 'new' } : {};
    return `<div class="pcell" data-genres="${g}">${cardHTML(x, opts)}</div>`;
  }).join('');
}
CHANGES.catSort = el => {
  const cat = location.hash.split('/')[2];
  const list = visibleTitles().filter(x => x.cat === cat && x.poster);
  $('#cat-items').innerHTML = catCells(list, upcomingTitles().filter(x => x.cat === cat), el.value);
  const on = $('.chips .chip.on'); if (on) ACTIONS.genreFilter(on);
};
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
/* The search page keeps its box on screen and only redraws the results under it. */
function viewSearch(q) {
  app().innerHTML = `<div class="page search-page">
    <label class="search-big">${icon('search')}<input id="search-page" type="search" value="${esc(q)}" placeholder="${esc(t('searchPh'))}" aria-label="${esc(t('search'))}" autocomplete="off"><span class="hint">${esc(L('Type in Sinhala or English letters', 'සිංහල හෝ ඉංග්‍රීසි අකුරින් ලියන්න'))}</span></label>
    <div id="search-results">${searchResultsHTML(q)}</div></div>`;
  const box = $('#search-page');
  box.focus(); box.setSelectionRange(box.value.length, box.value.length);
  document.body.classList.add('on-search');
  CLEAN.push(() => document.body.classList.remove('on-search'));
}
function searchResultsHTML(q) {
  const tip = esc(t('searchEmpty', { a: 'නිල් කන්ද', b: 'neel kanda' }));
  if (!q.trim()) return `<p class="search-note">${tip}</p>`;
  const results = searchTitles(q);
  if (!results.length) return `<div class="empty"><h2>${esc(t('searchNone', { q, country: countryName(store.country) }))}</h2>${tip}</div>`;
  const top = results[0];
  /* Other matches first, then titles that share a genre with the top result. */
  const shown = new Set(results.map(x => x.id));
  const related = visibleTitles().filter(x => x.poster && !shown.has(x.id) && x.genres.some(g => top.genres.includes(g)));
  const rest = results.slice(1).concat(related).slice(0, Math.max(7, results.length - 1));
  const cats = Object.keys(CATEGORIES).map(c => [c, results.filter(x => x.cat === c).length]).filter(c => c[1]);
  const prog = store.progress[top.id];
  const topBtn = isUpcoming(top) ? `<a class="btn btn-primary btn-lg" href="#/title/${top.id}">${esc(t('moreInfo'))}</a>`
    : `<a class="btn btn-primary btn-lg" href="${playHref(top)}">${esc(prog && !prog.done ? (isSeries(top) ? `${L('Continue', 'දිගටම')} S${prog.s} · E${prog.e}` : L('Continue', 'දිගටම')) : t('play'))}</a>`;
  const topMeta = [isSeries(top) ? seasonText(top) : t('minutes', { n: top.mins }), top.genres.map(genreName).join(', '), L('Sinhala · English subtitles', 'සිංහල · ඉංග්‍රීසි උපසිරැසි')];
  return `<p class="search-note">${esc(L('Showing results for', 'ප්‍රතිඵල:'))} <b>${esc(q)}</b></p>
    <div class="chips" role="group" aria-label="${esc(L('Filter', 'පෙරහන'))}"><button class="chip on" data-act="searchFilter" data-c="">${esc(t('all'))} · ${results.length}</button>${cats.map(c => `<button class="chip" data-act="searchFilter" data-c="${c[0]}">${esc(catName(c[0]))} · ${c[1]}</button>`).join('')}</div>
    <div class="top-result" data-cat="${top.cat}"><a class="tr-art" href="#/title/${top.id}" aria-label="${esc(nm(top))}">${art(top, 'lg')}</a>
      <div class="grow"><div class="tp-kicker">${esc(L('Top result', 'ප්‍රධාන ප්‍රතිඵලය'))} · ${esc(catOne(top.cat))}</div>
        <h2><a href="#/title/${top.id}">${esc(nm(top))}</a> <span class="tp-alt">${esc(altNm(top))}</span></h2>
        <p class="muted">${topMeta.map(esc).join(' · ')}</p></div>${topBtn}</div>
    ${rest.length ? `<h2 class="row-title" style="padding:0">${esc(L('More like this', 'මෙවැනි තවත්'))}</h2><div class="poster-grid" id="search-grid">${rest.map(x => posterCell(x, isUpcoming(x) ? { tag: fmtDate(x.releaseAt, { day: 'numeric', month: 'short' }), tagClass: 'soon' } : {})).join('')}</div>` : ''}`;
}
ACTIONS.searchFilter = el => {
  $$('.chip', el.parentElement).forEach(c => c.classList.toggle('on', c === el));
  const c = el.dataset.c;
  $$('#search-grid .pcell, .top-result').forEach(d => { d.hidden = !!c && d.dataset.cat !== c; });
};
let searchTimer;
document.addEventListener('input', e => {
  if (e.target.id !== 'search-input' && e.target.id !== 'search-page') return;
  clearTimeout(searchTimer);
  const fromPage = e.target.id === 'search-page';
  const v = e.target.value;
  searchTimer = setTimeout(() => {
    const url = `#/search?q=${encodeURIComponent(v.trim())}`;
    if (/^#\/search/.test(location.hash) && $('#search-results')) {
      history.replaceState(null, '', url); renderedHash = url; baseHash = url;
      $('#search-results').innerHTML = searchResultsHTML(v);
      if (!fromPage) { const box = $('#search-page'); if (box) box.value = v; }
    } else if (v.trim()) go(url);
  }, 220);
});

/* Title page: poster on the left; details, buttons and episodes on the right. */
function viewTitle(id) {
  const ti = getTitle(id);
  if (!ti || (ti.status === 'draft' && !(store.user && store.user.role === 'admin'))) return viewNotFound();
  const blocked = !inCountry(ti), expired = !licensed(ti), upcoming = isUpcoming(ti);
  const prog = store.progress[ti.id];
  const resume = prog && !prog.done;
  const playText = resume && isSeries(ti) ? `${t('resume')} S${prog.s} · E${prog.e}` : playLabel(ti);
  let actions = '';
  if (upcoming) actions = `<a class="btn btn-primary btn-lg" href="#/watch/${ti.id}/trailer">${icon('film')}${esc(t('freeTrailer'))}</a>`;
  else if (!blocked && !expired) actions = `<a class="btn btn-primary btn-lg" href="${playHref(ti)}">${icon('play')}${esc(playText)}</a>
    <a class="btn btn-quiet btn-lg" href="#/watch/${ti.id}/trailer">${esc(L('Trailer', 'ට්‍රේලරය'))}</a>`;
  actions += `<button class="btn btn-ghost btn-lg" data-act="shareTitle" data-id="${ti.id}">${icon('share')}${esc(L('Share link', 'සබැඳිය බෙදාගන්න'))}</button>`;
  const meta = [ti.year, ti.genres.map(genreName).join(', '), isSeries(ti) ? `${seasonText(ti)} · ${t('minutes', { n: ti.mins })} ${L('episodes', 'කථාංග')}` : t('minutes', { n: ti.mins })].filter(Boolean);
  const startSeason = prog ? prog.s : 1;
  const more = visibleTitles().filter(x => x.cat === ti.cat && x.id !== ti.id && x.poster).slice(0, 7);
  const tallArt = ti.poster ? art(ti, 'lg', 'tall') : art(ti, 'lg');
  app().innerHTML = `<div class="page title-page">
    <div class="tp-art ${ti.poster ? '' : 'wide'}">${tallArt}</div>
    <div class="tp-body">
      <div class="tp-kicker">${esc(catOne(ti.cat))}${ti.isNew ? ` · ${esc(L('New', 'අලුත්'))}` : ''}</div>
      <h1 class="tp-name"><span class="font-${ti.font}">${esc(nm(ti))}</span> <span class="tp-alt">${esc(altNm(ti))}</span></h1>
      <div class="tp-meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}<span class="rating">${esc(ti.rating)}</span></div>
      ${blocked ? `<div class="block-msg">${icon('globe')}<div><b>${esc(t('notAvailable', { country: countryName(store.country) }))}</b><br>${esc(t('notAvailableBody'))}</div></div>` : ''}
      ${expired ? `<div class="block-msg">${icon('alert')}<div><b>${esc(L('No longer available', 'දැන් ලබාගත නොහැක'))}</b><br>${esc(L('The licence period for this title has ended.', 'මෙම මාතෘකාවේ බලපත්‍ර කාලය අවසන්.'))}</div></div>` : ''}
      ${upcoming ? `<div class="block-msg">${icon('clock')}<div><b>${esc(t('releases', { date: fmtDate(ti.releaseAt) }))}</b></div></div>` : ''}
      <p class="tp-syn">${esc(synOf(ti))}</p>
      <div class="tp-actions">${actions}</div>
      <p class="tp-info">${esc(L('Audio: Sinhala', 'හඬ: සිංහල'))} · ${esc(L('Subtitles: Sinhala, English', 'උපසිරැසි: සිංහල, ඉංග්‍රීසි'))}${ti.weekly ? ` · ${esc(L('New episode every Friday, 8 pm', 'සෑම සිකුරාදාම රාත්‍රී 8ට නව කථාංගයක්'))}` : ''}</p>
      ${isSeries(ti) ? `<section class="tp-eps"><div class="tp-eps-head"><h2>${esc(t('episodes'))}</h2>
        ${ti.seasons.length > 1 ? `<div class="season-pills" role="group" aria-label="${esc(L('Season', 'වාරය'))}">${ti.seasons.map((_, i) => `<button class="spill ${i + 1 === startSeason ? 'on' : ''}" data-act="seasonPick" data-id="${ti.id}" data-s="${i + 1}" aria-pressed="${i + 1 === startSeason}">${esc(t('season', { n: i + 1 }))}</button>`).join('')}</div>` : ''}</div>
        <div id="ep-list">${episodeList(ti, startSeason)}</div></section>` : ''}
    </div>
    ${more.length ? `<section class="tp-more"><h2 class="row-title">${esc(L('More like this', 'මෙවැනි තවත්'))}</h2><div class="poster-grid">${more.map(posterCell).join('')}</div></section>` : ''}
  </div>`;
}
function episodeList(ti, s) {
  const prog = store.progress[ti.id];
  const up = isUpcoming(ti) || !inCountry(ti) || !licensed(ti);
  return episodes(ti, s).map(ep => {
    const locked = up || !!ep.releaseAt;
    const here = prog && prog.s === s;
    const current = here && prog.e === ep.n && !prog.done;
    let status = ep.syn[store.lang === 'si' ? 1 : 0];
    if (ep.releaseAt) status = t('releases', { date: fmtDate(ep.releaseAt, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) });
    else if (current) status = t('left', { n: Math.max(1, Math.round((prog.dur - prog.pos) / 60)) });
    else if (here && (ep.n < prog.e || (prog.done && ep.n === prog.e))) status = L('Watched', 'නැරඹූ');
    else if (here && ep.n === prog.e + 1) status = L('Up next', 'ඊළඟට');
    const pct = current ? (prog.pos / prog.dur) * 100 : here && ep.n < prog.e ? 100 : 0;
    const inner = `<span class="ep-n">${ep.n}</span><span class="ep-art">${art(ti)}${pct ? `<span class="progress"><i style="width:${pct}%"></i></span>` : ''}</span>
      <span class="grow"><b>${esc(t('episode', { n: ep.n }))}</b><small>${esc(status)}</small></span><span class="ep-len">${esc(t('minutes', { n: ep.mins }))}</span>`;
    return locked ? `<div class="ep locked">${inner}</div>` : `<a class="ep ${current ? 'on' : ''}" href="#/watch/${ti.id}/${s}/${ep.n}">${inner}</a>`;
  }).join('');
}
ACTIONS.seasonPick = el => {
  $$('.spill', el.parentElement).forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); });
  $('#ep-list').innerHTML = episodeList(getTitle(el.dataset.id), Number(el.dataset.s));
};
/* One title's kind, in the singular: Film, Teledrama, Programme. */
const catOne = c => (c === 'cinema' ? L('Film', 'චිත්‍රපටය') : store.lang === 'si' ? catName(c) : catName(c).replace(/s$/, ''));
/* A poster with its name and category under it. */
function posterCell(x, opts = {}) {
  return `<div class="pcell" data-cat="${x.cat}" data-genres="${x.genres.join(' ')}">${cardHTML(x, opts)}<div class="pcap"><b>${esc(nm(x))}</b><small>${esc(catOne(x.cat))}</small></div></div>`;
}

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
/* Sign-in pages: film artwork on the left, the form on the right. */
function authShell(inner) {
  return `<div class="auth-split"><div class="auth-art" aria-hidden="true"><img src="assets/banners/vijayaba-kollaya.jpg" alt=""></div>
    <div class="auth-side"><div class="auth-card">${inner}</div></div></div>`;
}
function viewLogin() {
  app().innerHTML = authShell(`<h1>${esc(t('signIn'))}</h1><form data-form="login">
    <label class="field"><span>${esc(t('fEmail'))}</span><input class="input" name="email" type="email" required autocomplete="username"></label>
    <label class="field"><span>${esc(t('fPassword'))}</span><input class="input" name="password" type="password" required autocomplete="current-password"></label>
    <div class="auth-row"><label class="check"><input type="checkbox" name="remember" checked><span>${esc(L('Keep me signed in', 'පුරනය වී සිටින්න'))}</span></label><a class="link" href="#/reset">${esc(t('forgot'))}</a></div>
    <div class="form-err" role="alert"></div>
    <button class="btn btn-primary btn-block">${esc(t('signIn'))}</button></form>
    <p class="auth-links">${esc(L('New here?', 'අලුත්ද?'))} <a class="link" href="#/signup">${esc(L('Start your 7-day free trial', 'දින 7ක නොමිලේ අත්හදා බැලීම අරඹන්න'))}</a></p>`);
}
function viewSignup() {
  let email = '';
  try { email = sessionStorage.getItem('nx-email') || ''; } catch (e) { /* ignored */ }
  app().innerHTML = authShell(`<h1>${esc(t('createAccount'))}</h1><form data-form="signup">
    <label class="field"><span>${esc(t('fName'))}</span><input class="input" name="name" required autocomplete="name"></label>
    <label class="field"><span>${esc(t('fEmail'))}</span><input class="input" name="email" type="email" required value="${esc(email)}" autocomplete="email"></label>
    <label class="field"><span>${esc(t('fPassword'))}</span><input class="input" name="password" type="password" required minlength="8" autocomplete="new-password"><div class="field-hint">${esc(L('At least 8 characters', 'අවම වශයෙන් අකුරු 8ක්'))}</div></label>
    <label class="field"><span>${esc(t('country'))}</span><select class="input" name="country">${Object.keys(COUNTRIES).map(c => `<option value="${c}" ${c === store.country ? 'selected' : ''}>${esc(countryName(c))}</option>`).join('')}</select></label>
    <div class="form-err" role="alert"></div>
    <button class="btn btn-primary btn-block">${esc(t('getStarted'))}</button></form>
    <div class="auth-links">${esc(t('haveAccount'))} <a href="#/login">${esc(t('signIn'))}</a></div>`);
}
function viewReset() {
  app().innerHTML = authShell(`<h1>${esc(t('resetTitle'))}</h1><form data-form="reset">
    <label class="field"><span>${esc(t('fEmail'))}</span><input class="input" name="email" type="email" required></label>
    <div class="form-err" role="alert"></div>
    <button class="btn btn-primary btn-block">${esc(t('resetSend'))}</button></form>
    <div class="auth-links"><a href="#/login">${esc(t('signIn'))}</a></div>`);
}
function viewNewPassword() {
  app().innerHTML = authShell(`<h1>${esc(L('Choose a new password', 'නව මුරපදයක් තෝරන්න'))}</h1><form data-form="newPassword">
    <label class="field"><span>${esc(t('fPassword'))}</span><input class="input" name="password" type="password" required minlength="8" autocomplete="new-password"><div class="field-hint">${esc(L('At least 8 characters', 'අවම වශයෙන් අකුරු 8ක්'))}</div></label>
    <div class="form-err" role="alert"></div>
    <button class="btn btn-primary btn-block">${esc(L('Save password', 'මුරපදය සුරකින්න'))}</button></form>`);
}
const checkEmailCard = text => { $('.auth-card').innerHTML = `<h1>${esc(L('Check your email', 'විද්‍යුත් තැපෑල බලන්න'))}</h1><p class="muted">${esc(text)}</p><div class="auth-links"><a href="#/login">${esc(t('signIn'))}</a></div>`; };
const formErr = (f, msg) => { const e = $('.form-err', f); if (e) e.textContent = msg; };
const formBusy = (f, on) => { $$('button', f).forEach(b => { b.disabled = on; }); if (on) formErr(f, ''); };
function afterAuth() {
  let target = '';
  try { target = sessionStorage.getItem('nx-return') || ''; sessionStorage.removeItem('nx-return'); } catch (e) { /* ignored */ }
  go(target || '#/');
  renderChrome(true);
}
FORMS.login = async f => {
  formBusy(f, true);
  try { applyAccount(await api('login', { email: f.email.value.trim(), password: f.password.value, remember: f.remember.checked })); }
  catch (e) { formBusy(f, false); formErr(f, authMessage(e)); return; }
  afterAuth();
};
FORMS.signup = async f => {
  formBusy(f, true);
  const country = f.country.value;
  try { applyAccount(await api('signup', { name: f.name.value.trim(), email: f.email.value.trim(), password: f.password.value, country })); }
  catch (e) { formBusy(f, false); formErr(f, authMessage(e)); return; }
  store.country = country; save();
  try { sessionStorage.removeItem('nx-email'); } catch (e) { /* ignored */ }
  go('#/plans'); renderChrome(true);
};
FORMS.reset = async f => {
  formBusy(f, true);
  const email = f.email.value.trim();
  try { await api('reset-request', { email }); } catch (e) { formBusy(f, false); formErr(f, authMessage(e)); return; }
  checkEmailCard(L(`If an account exists for ${email}, a reset link is ready. This website runs on your own computer and sends no email: the link is shown in the black Nexflix server window, and saved in data/password-reset-links.txt.`,
    'ගිණුමක් තිබේ නම් යළි සැකසුම් සබැඳියක් සූදානම්. මෙම වෙබ් අඩවිය ඔබගේ පරිගණකයේ ක්‍රියා කරන නිසා ඊමේල් නොයවයි: සබැඳිය කළු Nexflix සේවාදායක කවුළුවේ පෙන්වයි.'));
};
FORMS.newPassword = async f => {
  formBusy(f, true);
  const token = new URLSearchParams(location.hash.split('?')[1] || '').get('token') || '';
  try { applyAccount(await api('reset-password', { token, password: f.password.value })); }
  catch (e) { formBusy(f, false); formErr(f, authMessage(e)); return; }
  toast(L('Your new password is saved', 'ඔබගේ නව මුරපදය සුරැකිණි'));
  go('#/'); renderChrome(true);
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
  app().innerHTML = `<div class="page err-page"><div class="err-num" aria-hidden="true">404</div>
    <h1>${esc(L('We can’t find that page', 'අපට එම පිටුව සොයාගත නොහැක'))}</h1>
    <p>${esc(L('The link may be old, or the title may have left Nexflix when its licence ended.', 'සබැඳිය පැරණි විය හැක, නැතහොත් බලපත්‍රය අවසන් වූ විට මාතෘකාව Nexflix වෙතින් ඉවත් වී තිබිය හැක.'))}</p>
    <div class="err-acts"><a class="btn btn-primary btn-lg" href="${store.user ? '#/' : '#/welcome'}">${esc(L('Go to home', 'මුල් පිටුවට'))}</a>${store.user ? `<a class="btn btn-quiet btn-lg" href="#/search">${esc(L('Search titles', 'මාතෘකා සොයන්න'))}</a>` : ''}</div></div>`;
}
