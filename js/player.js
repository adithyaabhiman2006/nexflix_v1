/* Simulated player. There is no video file: the title's photo stands in for the picture,
   while the timeline, subtitles, resume, quality and next-episode logic all behave for real. */

const QUALITIES = () => [
  ['auto', L('Auto', 'ස්වයංක්‍රීය')], ['1080', '1080p'], ['720', '720p'], ['480', '480p'],
  ['saver', L('Data saver', 'දත්ත ඉතිරිය')],
];
const fmtTime = s => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : m) + ':' + String(r).padStart(2, '0');
};

function viewWatch(id, seg1, seg2) {
  const ti = getTitle(id);
  if (!ti) return viewNotFound();
  const trailer = seg1 === 'trailer';
  const s = trailer ? 1 : Number(seg1) || 1;
  const e = trailer ? 1 : Number(seg2) || 1;
  const ep = !trailer && isSeries(ti) ? episodes(ti, s)[e - 1] : null;

  if (!trailer && isSeries(ti) && !ep) return viewNotFound();

  const back = baseHash && !/^#\/watch/.test(baseHash) ? baseHash : (store.user ? '#/' : '#/welcome');
  const heading = trailer ? `${nm(ti)} · ${t('trailer')}` : nm(ti);
  const sub = ep ? `${t('season', { n: s })}, ${t('episode', { n: e })}` : '';

  const block = watchBlock(ti, trailer, ep, s, e);
  app().innerHTML = `<div class="player paused" id="player" tabindex="0" role="application" aria-label="${esc(L('Video player', 'වීඩියෝ වාදකය'))}">
    <div class="stage">${art(ti, 'lg')}</div>
    <div class="subs" id="p-subs" aria-live="off"></div>
    <div class="p-top">
      <a class="p-btn" href="${back}" aria-label="${esc(L('Back', 'ආපසු'))}">${icon('back')}</a>
      <div class="p-title">${esc(heading)}<small>${esc([altNm(ti), sub].filter(Boolean).join(' · '))}</small></div>
      <span class="demo-tag">${esc(L('Demo playback, no video file', 'ආදර්ශන වාදනය, වීඩියෝ ගොනුවක් නැත'))}</span>
    </div>
    <div class="p-center" id="p-center"></div>
    <div class="p-bottom">
      <div class="p-scrub"><input class="scrub" id="p-scrub" type="range" min="0" max="1000" value="0" aria-label="${esc(L('Seek', 'ගමන් කරන්න'))}"><span class="p-time" id="p-time">0:00</span></div>
      <div class="p-ctrls">
        <button class="p-btn" id="p-play" aria-label="${esc(t('play'))}">${icon('play')}</button>
        <button class="p-btn" id="p-back" aria-label="${esc(L('Back 10 seconds', 'තත්පර 10 ආපසු'))}">${icon('back10')}</button>
        <button class="p-btn" id="p-fwd" aria-label="${esc(L('Forward 10 seconds', 'තත්පර 10 ඉදිරියට'))}">${icon('fwd10')}</button>
        <button class="p-btn" id="p-mute" aria-label="${esc(L('Mute', 'නිහඬ'))}">${icon('volume')}</button>
        <span class="p-clock" id="p-clock">0:00 / 0:00</span><span class="spacer"></span>
        ${nextEpisode(ti, s, e) && !trailer ? `<button class="p-btn" id="p-next-btn" aria-label="${esc(L('Next episode', 'ඊළඟ කථාංගය'))}">${icon('next')}</button>` : ''}
        ${ep ? `<button class="p-btn" id="p-eps" aria-label="${esc(t('episodes'))}">${icon('list')}</button>` : ''}
        <button class="p-btn" id="p-settings" aria-label="${esc(L('Subtitles and quality', 'උපසිරැසි සහ ගුණත්වය'))}">${icon('subs')}</button>
        <button class="p-btn" id="p-full" aria-label="${esc(L('Full screen', 'සම්පූර්ණ තිරය'))}">${icon('full')}</button>
      </div>
    </div>
    <div id="p-panel-slot"></div><div id="p-next-slot"></div>
    ${block ? `<div class="p-block"><div>${block}</div></div>` : ''}
  </div>`;
  if (block) { const c = $('.p-bottom'); c.style.display = 'none'; return; }
  startPlayer(ti, { trailer, s, e, ep });
}

function watchBlock(ti, trailer, ep, s, e) {
  if (!inCountry(ti)) return `<h2>${esc(t('notAvailable', { country: countryName(store.country) }))}</h2><p>${esc(t('notAvailableBody'))}</p><div class="acts"><a class="btn btn-primary" href="${store.user ? '#/' : '#/welcome'}">${esc(t('backHome'))}</a></div>`;
  if (trailer) return '';
  if (!licensed(ti)) return `<h2>${esc(L('No longer available', 'දැන් ලබාගත නොහැක'))}</h2><p>${esc(L('The licence period for this title has ended.', 'මෙම මාතෘකාවේ බලපත්‍ර කාලය අවසන්.'))}</p><div class="acts"><a class="btn btn-primary" href="#/">${esc(t('backHome'))}</a></div>`;
  if (isUpcoming(ti) || ti.status === 'draft') return `<h2>${esc(ti.status === 'draft' ? L('Not published yet', 'තවම ප්‍රකාශ කර නැත') : t('releases', { date: fmtDate(ti.releaseAt) }))}</h2><p>${esc(L('You can watch the trailer in the meantime.', 'ඒ අතරතුර පෙරදැක්ම නරඹන්න.'))}</p><div class="acts"><a class="btn btn-primary" href="#/watch/${ti.id}/trailer">${esc(t('freeTrailer'))}</a><a class="btn btn-ghost" href="#/">${esc(t('backHome'))}</a></div>`;
  if (ep && ep.releaseAt) return `<h2>${esc(t('releases', { date: fmtDate(ep.releaseAt, { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) }))}</h2><p>${esc(t('episode', { n: e }))}</p><div class="acts"><a class="btn btn-primary" href="#/title/${ti.id}">${esc(t('episodes'))}</a></div>`;
  if (!hasAccess()) return `<h2>${esc(t('subscribeToWatch'))}</h2><p>${esc(store.sub.trialUsed ? priceNow() + t('perMonth') : t('heroPrice', { price: priceNow() }))}</p><div class="acts"><a class="btn btn-primary" href="${store.user ? '#/plans' : '#/signup'}">${esc(store.sub.trialUsed ? t('subscribeNow') : t('startTrial'))}</a><a class="btn btn-ghost" href="#/watch/${ti.id}/trailer">${esc(t('freeTrailer'))}</a></div>`;
  const busy = store.otherStreams.filter(d => d.streaming);
  if (busy.length >= STREAM_LIMIT) return `<h2>${esc(L('Too many screens at once', 'එකවර තිර වැඩියි'))}</h2><p>${esc(L(`Your plan allows ${STREAM_LIMIT} streams. Now playing on: ${busy.map(d => d.name).join(', ')}.`, `ඔබේ සැලසුමට එකවර ප්‍රවාහ ${STREAM_LIMIT}ක් පමණි.`))}</p><div class="acts"><a class="btn btn-primary" href="#/account">${esc(L('Manage devices', 'උපාංග කළමනාකරණය'))}</a></div>`;
  return '';
}

function startPlayer(ti, { trailer, s, e, ep }) {
  const root = $('#player');
  const dur = trailer ? 90 : (ep ? ep.mins : ti.mins) * 60;
  const saved = store.progress[ti.id];
  let pos = !trailer && saved && !saved.done && saved.s === s && saved.e === e ? Math.min(saved.pos, dur - 5) : 0;
  let playing = false, ready = false, muted = false, nextDismissed = false, lastSave = 0, idleTimer;
  const nxt = !trailer ? nextEpisode(ti, s, e) : null;

  const scrub = $('#p-scrub'), time = $('#p-time'), clock = $('#p-clock'), subs = $('#p-subs'), center = $('#p-center'), playBtn = $('#p-play');

  function paint() {
    const pct = (pos / dur) * 100;
    scrub.value = Math.round((pos / dur) * 1000);
    scrub.style.setProperty('--pct', pct + '%');
    time.textContent = fmtTime(dur - pos);
    clock.textContent = `${fmtTime(pos)} / ${fmtTime(dur)}`;
    const line = SUBTITLES[Math.floor(pos / 7) % SUBTITLES.length];
    const showing = store.subLang !== 'off' && pos % 7 < 5.2 && ready;
    const text = showing ? line[store.subLang === 'si' ? 1 : 0] : '';
    const cur = subs.textContent;
    if (cur !== text) subs.innerHTML = text ? `<span>${esc(text)}</span>` : '';
  }
  function setPlaying(v) {
    playing = v;
    root.classList.toggle('playing', v);
    root.classList.toggle('paused', !v);
    playBtn.innerHTML = icon(v ? 'pause' : 'play');
    playBtn.setAttribute('aria-label', v ? L('Pause', 'නවත්වන්න') : t('play'));
    if (!v) { root.classList.remove('idle'); center.innerHTML = ready ? `<div class="p-flash">${icon('play')}</div>` : ''; } else center.innerHTML = '';
    wake();
  }
  function persist(force) {
    if (trailer || !store.user) return;
    if (!force && Date.now() - lastSave < 5000) return;
    lastSave = Date.now();
    store.progress[ti.id] = { s, e, pos: Math.round(pos), dur, ts: Date.now(), done: false };
    save();
  }
  function wake() {
    root.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (playing && !$('#p-panel-slot').firstElementChild) root.classList.add('idle'); }, 3000);
  }
  function seek(to) { pos = Math.max(0, Math.min(dur - 0.5, to)); nextDismissed = false; if (dur - pos > 15) $('#p-next-slot').innerHTML = ''; paint(); persist(true); }
  function goNext() {
    store.progress[ti.id] = { s: nxt.s, e: nxt.e, pos: 0, dur: 60, ts: Date.now(), done: false };
    save();
    location.replace(`#/watch/${ti.id}/${nxt.s}/${nxt.e}`);
  }
  function finish() {
    setPlaying(false);
    if (trailer) {
      const can = hasAccess() && isVisible(ti);
      root.insertAdjacentHTML('beforeend', `<div class="p-block"><div><h2>${esc(nm(ti))}</h2><p>${esc(synOf(ti))}</p><div class="acts">
        ${isUpcoming(ti) ? `<a class="btn btn-primary" href="#/title/${ti.id}">${esc(t('moreInfo'))}</a>` : can ? `<a class="btn btn-primary" href="${playHref(ti)}">${esc(t('play'))}</a>` : `<a class="btn btn-primary" href="${store.user ? '#/plans' : '#/signup'}">${esc(t('startTrial'))}</a>`}
        <a class="btn btn-ghost" href="${store.user ? '#/' : '#/welcome'}">${esc(t('backHome'))}</a></div></div></div>`);
      return;
    }
    if (nxt) return goNext();
    store.progress[ti.id] = { s, e, pos: dur, dur, ts: Date.now(), done: true };
    save();
    root.insertAdjacentHTML('beforeend', `<div class="p-block"><div><h2>${esc(L('Finished', 'අවසන්'))}</h2><p>${esc(nm(ti))}</p><div class="acts"><a class="btn btn-primary" href="#/">${esc(t('backHome'))}</a></div></div></div>`);
  }
  function renderNextPrompt() {
    const slot = $('#p-next-slot');
    if (!nxt || nextDismissed) { slot.innerHTML = ''; return; }
    const left = Math.ceil(dur - pos);
    const n = $('#p-next-count');
    if (n) { n.textContent = left; return; }
    slot.innerHTML = `<div class="p-next"><h4>${esc(L('Next episode in', 'ඊළඟ කථාංගය'))} <span id="p-next-count">${left}</span>s</h4><b>${esc(t('season', { n: nxt.s }))}, ${esc(t('episode', { n: nxt.e }))}</b>
      <div class="btns"><button class="btn btn-primary btn-sm" id="p-next-now">${icon('play')}${esc(L('Play now', 'දැන් නරඹන්න'))}</button><button class="btn btn-ghost btn-sm" id="p-next-no">${esc(L('Watch credits', 'නාමාවලිය බලන්න'))}</button></div></div>`;
    $('#p-next-now').onclick = goNext;
    $('#p-next-no').onclick = () => { nextDismissed = true; slot.innerHTML = ''; };
  }

  const tick = setInterval(() => {
    if (!playing) return;
    pos += 0.25;
    if (pos >= dur) { pos = dur; paint(); clearInterval(tick); finish(); return; }
    if (dur - pos <= 15 && !trailer) renderNextPrompt();
    paint(); persist(false);
  }, 250);

  function togglePanel(kind) {
    const slot = $('#p-panel-slot');
    const close = () => { slot.innerHTML = ''; slot.dataset.kind = ''; $('#p-settings').classList.remove('on'); };
    if (slot.dataset.kind === kind && slot.firstElementChild) { close(); return; }
    slot.dataset.kind = kind;
    $('#p-settings').classList.toggle('on', kind === 'settings');
    if (kind === 'settings') {
      /* Audio, subtitles and quality side by side. A tick marks each current choice. */
      const opt = (attr, val, label, on) => `<button data-${attr}="${val}" class="${on ? 'sel' : ''}" aria-pressed="${on}">${on ? '✓ ' : ''}${esc(label)}</button>`;
      slot.innerHTML = `<div class="p-panel p-panel-3">
        <div><h4>${esc(L('Audio', 'හඬ'))}</h4>${opt('audio', 'si', L('Sinhala', 'සිංහල'), true)}</div>
        <div><h4>${esc(L('Subtitles', 'උපසිරැසි'))}</h4>${[['off', L('Off', 'අක්‍රිය')], ['si', 'සිංහල'], ['en', 'English']].map(o => opt('sub', o[0], o[1], store.subLang === o[0])).join('')}</div>
        <div><h4>${esc(L('Quality', 'ගුණත්වය'))}</h4>${QUALITIES().map(o => opt('q', o[0], o[1], store.quality === o[0])).join('')}</div></div>`;
      $$('[data-sub]', slot).forEach(b => { b.onclick = () => { store.subLang = b.dataset.sub; save(); close(); paint(); }; });
      $$('[data-q]', slot).forEach(b => { b.onclick = () => { store.quality = b.dataset.q; save(); close(); toast(`${L('Quality', 'ගුණත්වය')}: ${b.textContent.replace('✓ ', '')}`); }; });
    } else {
      slot.innerHTML = `<div class="p-panel"><h4>${esc(t('season', { n: s }))}</h4>${episodes(ti, s).map(x => x.releaseAt
        ? `<button disabled style="opacity:.55">${esc(t('episode', { n: x.n }))}</button>`
        : `<a href="#/watch/${ti.id}/${s}/${x.n}" class="${x.n === e ? 'sel' : ''}">${esc(t('episode', { n: x.n }))}</a>`).join('')}</div>`;
    }
  }

  playBtn.onclick = () => setPlaying(!playing);
  $('.stage', root).onclick = () => { if (ready) setPlaying(!playing); };
  center.style.pointerEvents = 'none';
  $('#p-back').onclick = () => seek(pos - 10);
  $('#p-fwd').onclick = () => seek(pos + 10);
  const muteBtn = $('#p-mute');
  muteBtn.onclick = () => { muted = !muted; muteBtn.innerHTML = icon(muted ? 'mute' : 'volume'); };
  scrub.addEventListener('input', () => { seek((Number(scrub.value) / 1000) * dur); });
  $('#p-settings').onclick = () => togglePanel('settings');
  const eps = $('#p-eps'); if (eps) eps.onclick = () => togglePanel('eps');
  const nb = $('#p-next-btn'); if (nb) nb.onclick = goNext;
  $('#p-full').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
  };

  const onMove = () => wake();
  const onKey = ev => {
    if (ev.target.tagName === 'INPUT' && ev.target.type !== 'range') return;
    const k = ev.key.toLowerCase();
    if (k === ' ' || k === 'k') { ev.preventDefault(); if (ready) setPlaying(!playing); }
    else if (k === 'arrowleft') { ev.preventDefault(); seek(pos - 10); wake(); }
    else if (k === 'arrowright') { ev.preventDefault(); seek(pos + 10); wake(); }
    else if (k === 'f') $('#p-full').click();
    else if (k === 'm') muteBtn.click();
    else if (k === 'c') { store.subLang = store.subLang === 'off' ? 'si' : store.subLang === 'si' ? 'en' : 'off'; save(); paint(); toast(`${L('Subtitles', 'උපසිරැසි')}: ${store.subLang}`); }
  };
  root.addEventListener('mousemove', onMove);
  root.addEventListener('touchstart', onMove, { passive: true });
  window.addEventListener('keydown', onKey);

  /* A short load shows the preview image first, then starts, as real HLS start-up would. */
  center.innerHTML = '<div class="spinner" role="status" aria-label="Loading"></div>';
  paint();
  const startTimer = setTimeout(() => { ready = true; setPlaying(true); paint(); }, 900);
  root.focus();

  CLEAN.push(() => {
    clearInterval(tick); clearTimeout(idleTimer); clearTimeout(startTimer);
    window.removeEventListener('keydown', onKey);
    if (ready && pos < dur) persist(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  });
}
