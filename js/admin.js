/* Admin panel. Changes save to the database and feed straight into the viewer-facing site.
   The server only accepts them from accounts whose role is admin. */

const ADMIN_NAV = [
  ['dashboard', 'Dashboard'], ['titles', 'Titles & uploads'], ['home', 'Home & banners'],
  ['users', 'Users & subscriptions'], ['vouchers', 'Vouchers'], ['links', 'Share links'], ['licences', 'Licences & rights'],
];
const STATUS_CFG = { published: ['ok', 'Published'], scheduled: ['info', 'Scheduled'], draft: ['', 'Draft'] };
const USER_STATUS = { active: 'ok', trial: 'info', cancelled: 'warn', expired: 'err', none: '' };
const ROW_LABEL = { new: 'New on Nexflix', trending: 'Top 10', teledrama: 'Teledramas', cinema: 'Cinema', dubbed: 'Sinhala Dubbed', programme: 'Programmes', soon: 'Coming soon' };
const loadingHTML = '<div class="empty"><div class="spinner"></div></div>';
const uploadBtn = '<button class="btn btn-primary" data-act="newTitle">+ Upload title</button>';

/* Members, read from the database. Admins may read every profile and membership. */
let adminUserList = [];
async function loadAdminUsers() {
  let data;
  try { data = await api('admin/users'); } catch (e) { toast('Could not load members.'); adminUserList = []; return; }
  adminUserList = data.map(p => {
    const s = subFromRow(p.subscriptions);
    return { id: p.id, name: p.name, email: p.email, country: p.country, role: p.role, since: toMs(p.created_at), status: s.status, method: s.method, periodEnd: s.periodEnd };
  });
}

function viewAdmin(section) {
  if (!store.user || store.user.role !== 'admin') {
    document.body.classList.remove('has-tabs');
    app().innerHTML = `<div class="auth-wrap"><div class="auth-card"><h1>Administrators only</h1><p class="muted">Your account can't open the admin panel.</p><div class="panel-actions"><a class="btn btn-primary" href="#/">${esc(t('backHome'))}</a></div></div></div>`;
    return;
  }
  const sec = ADMIN_NAV.some(n => n[0] === section) ? section : 'dashboard';
  app().innerHTML = `<div class="admin"><aside class="admin-side" aria-label="Admin">
      <a class="brand" href="#/admin/dashboard">${logoHTML()}</a><div class="admin-tag">Admin panel</div>
      <nav class="admin-nav">${ADMIN_NAV.map(n => `<a class="lnk ${n[0] === sec ? 'on' : ''}" href="#/admin/${n[0]}" ${n[0] === sec ? 'aria-current="page"' : ''}>${n[1]}</a>`).join('')}</nav>
      <div class="bottom"><a class="lnk" href="#/">← Viewer site</a></div>
    </aside><div class="admin-main" id="admin-main"></div></div>`;
  ({ dashboard: adminDashboard, titles: adminTitles, home: adminHome, users: adminUsers, vouchers: adminVouchers, links: adminLinks, licences: adminLicences })[sec]();
}
const adminHead = (title, sub, right = '') => `<div class="admin-head"><div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${right}</div>`;
const titleCell = ti => `<div class="t-cell"><span class="t-thumb">${art(ti)}</span><span><b>${esc(ti.en)}</b><small>${esc(ti.si || '')}</small></span></div>`;
const statusPill = ti => {
  if (!licensed(ti)) return '<span class="pill err">Licence ended</span>';
  const c = STATUS_CFG[ti.status] || STATUS_CFG.draft; return `<span class="pill ${c[0]}">${c[1]}</span>`;
};
const countryCode = c => (c === 'GB' ? 'UK' : c);
const countriesText = ti => (ti.countries.includes('*') ? 'All' : ti.countries.map(countryCode).join(', '));
const typeText = ti => (ti.cat === 'cinema' ? 'Film' : CATEGORIES[ti.cat].en.replace(/s$/, ''));
const daysLeft = ti => Math.ceil((ti.licenceEnd - Date.now()) / DAY);

/* Dashboard */
async function adminDashboard() {
  $('#admin-main').innerHTML = loadingHTML;
  const here = location.hash;
  const [, weeks, stats] = await Promise.all([loadAdminUsers(), api('admin/signups').catch(() => []), api('admin/stats').catch(() => ({ revenue: [] }))]);
  const signups = weeks.map(w => [fmtDate(new Date(w.week_start + 'T00:00:00').getTime(), { day: 'numeric', month: 'short' }), w.signups]);
  if (location.hash !== here || !$('#admin-main')) return;
  const titles = allTitles();
  const count = s => adminUserList.filter(u => u.status === s).length;
  const revenue = stats.revenue.length ? stats.revenue.map(r => money(r.total, r.currency)).join(' + ') : money(0, 'LKR');
  /* Coming up: scheduled titles, the next held-back episodes of weekly series, then drafts. */
  const upcoming = [];
  titles.filter(x => x.status === 'scheduled' && x.releaseAt > Date.now()).forEach(x => upcoming.push({ ti: x, label: x.en, at: x.releaseAt, status: 'scheduled' }));
  titles.filter(x => isSeries(x) && x.weekly && isReleased(x)).forEach(x => {
    const s = x.seasons.length;
    episodes(x, s).filter(ep => ep.releaseAt).forEach(ep => upcoming.push({ ti: x, label: `${x.en}`, ep: `S${s} E${ep.n}`, at: ep.releaseAt, status: 'scheduled' }));
  });
  upcoming.sort((a, b) => a.at - b.at);
  titles.filter(x => x.status === 'draft').forEach(x => upcoming.push({ ti: x, label: x.en, at: null, status: 'draft' }));
  const ending = titles.filter(x => x.licenceEnd && x.licenceEnd - Date.now() < 45 * DAY).sort((a, b) => a.licenceEnd - b.licenceEnd).slice(0, 5);
  $('#admin-main').innerHTML = `${adminHead('Dashboard', 'Today · all countries', uploadBtn)}
    <div class="stat-grid">
      <div class="stat"><div class="lbl">Paying members</div><div class="val">${count('active')}</div></div>
      <div class="stat"><div class="lbl">On free trial</div><div class="val">${count('trial')}</div></div>
      <div class="stat"><div class="lbl">Revenue this month</div><div class="val val-sm">${esc(revenue)}</div></div>
      <div class="stat"><div class="lbl">Cancelled</div><div class="val">${count('cancelled')}</div></div>
    </div>
    <div class="two-col dash-cols">
      <section class="panel panel-flush"><h2>Scheduled releases</h2>
        ${upcoming.length ? `<div class="table-wrap"><table class="tbl tbl-caps"><thead><tr><th>Title</th><th>Release</th><th>Countries</th><th>Status</th></tr></thead><tbody>
        ${upcoming.slice(0, 8).map(u => `<tr><td><b>${esc(u.label)}</b>${u.ep ? ` · ${u.ep}` : ''}</td><td>${u.at ? esc(fmtDate(u.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) : '–'}</td><td>${esc(countriesText(u.ti))}</td><td>${statusPill(Object.assign({}, u.ti, { status: u.status }))}</td></tr>`).join('')}</tbody></table></div>`
          : '<p class="muted pad">Nothing scheduled.</p>'}
      </section>
      <section class="panel"><h2>Licences ending soon</h2>
        ${ending.length ? ending.map(x => `<div class="lic-row"><span class="t-thumb wide">${art(x)}</span><div class="grow"><b>${esc(x.en)}</b><small>${licensed(x) ? `Ends ${esc(fmtDate(x.licenceEnd))}` : 'Ended'} · ${esc(countriesText(x))}</small></div>${licensed(x) ? `<span class="pill ${daysLeft(x) <= 14 ? 'err' : 'warn'}">${daysLeft(x)} days</span>` : '<span class="pill err">Ended</span>'}</div>`).join('')
          : '<p class="muted">No licences end in the next 45 days.</p>'}
        <a class="link see-all" href="#/admin/licences">See all licences →</a>
      </section>
    </div>
    <section class="panel"><h2>Sign-ups per week</h2>${signupChart(signups)}</section>`;
  wireChart();
}

/* Licences and rights: every title, soonest licence end first. */
function adminLicences() {
  const list = allTitles().slice().sort((a, b) => (a.licenceEnd || Infinity) - (b.licenceEnd || Infinity));
  $('#admin-main').innerHTML = `${adminHead('Licences & rights', 'Who owns each title, where it may be shown and until when')}
    <div class="panel panel-flush"><div class="table-wrap"><table class="tbl tbl-caps"><thead><tr><th>Title</th><th>Rights holder</th><th>Countries</th><th>Licence ends</th><th>Time left</th><th></th></tr></thead><tbody>
    ${list.map(x => `<tr><td>${titleCell(x)}</td><td>${esc(x.rightsHolder || 'Not set')}</td><td>${esc(countriesText(x))}</td><td style="white-space:nowrap">${x.licenceEnd ? esc(fmtDate(x.licenceEnd)) : 'Not set'}</td>
      <td>${!x.licenceEnd ? '–' : licensed(x) ? `<span class="pill ${daysLeft(x) <= 14 ? 'err' : daysLeft(x) <= 45 ? 'warn' : 'ok'}">${daysLeft(x)} days</span>` : '<span class="pill err">Ended</span>'}</td>
      <td><button class="link" data-act="editTitle" data-id="${x.id}">Edit</button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function signupChart(data) {
  if (!data.length) return '<p class="muted">No sign-up figures yet.</p>';
  const W = 600, H = 250, L0 = 40, B = 28, T = 12;
  const top = Math.max(4, ...data.map(d => d[1]));
  const unit = Math.pow(10, Math.floor(Math.log10(top)));
  const gridStep = top / unit > 5 ? unit * 2 : unit;
  const max = Math.ceil(top / gridStep) * gridStep;
  const y = v => T + (H - T - B) * (1 - v / max);
  const step = (W - L0) / data.length;
  const barW = Math.min(30, step * 0.5);
  let grid = '';
  for (let v = 0; v <= max; v += gridStep) grid += `<line class="chart-grid" x1="${L0}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="${L0 - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const bars = data.map((d, i) => {
    const cx = L0 + step * (i + 0.5), top = y(d[1]), h = y(0) - top, x = cx - barW / 2;
    return `<g tabindex="0" role="img" aria-label="${d[0]}: ${d[1]} sign-ups" data-tip="${d[0]}: ${d[1]}" data-cx="${cx}" data-top="${top}">
      <rect class="chart-hit" x="${L0 + step * i}" y="${T}" width="${step}" height="${H - T - B}" fill="transparent"/>
      <path class="chart-bar" d="M${x} ${y(0)} V${top + 4} q0 -4 4 -4 H${x + barW - 4} q4 0 4 4 V${y(0)} Z"/>
      <text class="chart-axis" x="${cx}" y="${H - 8}" text-anchor="middle">${d[0]}</text></g>`;
  }).join('');
  return `<div class="chart-box" id="chart-box"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Weekly sign-ups">${grid}${bars}</svg><div class="chart-tip" id="chart-tip" hidden></div></div>
    <details class="chart-table"><summary>View as table</summary><div class="table-wrap"><table class="tbl"><thead><tr><th>Week starting</th><th class="num">Sign-ups</th></tr></thead><tbody>${data.map(d => `<tr><td>${d[0]}</td><td class="num">${d[1]}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function wireChart() {
  const box = $('#chart-box'), tip = $('#chart-tip');
  if (!box) return;
  const svg = $('svg', box);
  const show = g => {
    const scale = svg.getBoundingClientRect().width / 600;
    tip.textContent = g.dataset.tip;
    tip.style.left = Number(g.dataset.cx) * scale + 'px';
    tip.style.top = Number(g.dataset.top) * scale - 6 + 'px';
    tip.hidden = false;
    $$('.chart-bar', box).forEach(b => b.classList.toggle('hot', b.parentElement === g));
  };
  const hide = () => { tip.hidden = true; $$('.chart-bar', box).forEach(b => b.classList.remove('hot')); };
  $$('g[data-tip]', box).forEach(g => {
    g.addEventListener('mouseenter', () => show(g)); g.addEventListener('focus', () => show(g));
    g.addEventListener('mouseleave', hide); g.addEventListener('blur', hide);
  });
}

/* Titles */
let adminTitleFilter = { q: '', cat: '', status: '', country: '' };
function adminTitles() {
  const sel = (k, all, opts) => `<select class="input" data-change="tFilter" data-k="${k}" aria-label="${all}"><option value="">${all}</option>${opts.map(o => `<option value="${o[0]}" ${adminTitleFilter[k] === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  $('#admin-main').innerHTML = `${adminHead('Titles', 'Films, teledramas and programmes', uploadBtn)}
    <div class="toolbar"><input class="input" id="t-q" type="search" placeholder="Search by name, සිංහල or English" aria-label="Search titles" value="${esc(adminTitleFilter.q)}">
      ${sel('cat', 'All types', Object.keys(CATEGORIES).map(c => [c, c === 'cinema' ? 'Film' : CATEGORIES[c].en.replace(/s$/, '')]))}
      ${sel('status', 'All statuses', ['published', 'scheduled', 'draft'].map(s => [s, STATUS_CFG[s][1]]).concat([['ended', 'Licence ended']]))}
      ${sel('country', 'All countries', Object.keys(COUNTRIES).map(c => [c, COUNTRIES[c].name]))}</div>
    <div class="panel panel-flush" id="t-table">${titlesTable()}</div>`;
  $('#t-q').addEventListener('input', e => { adminTitleFilter.q = e.target.value; $('#t-table').innerHTML = titlesTable(); });
}
CHANGES.tFilter = el => { adminTitleFilter[el.dataset.k] = el.value; $('#t-table').innerHTML = titlesTable(); };
function titlesTable() {
  const f = adminTitleFilter, q = f.q.trim().toLowerCase();
  const statusOk = x => !f.status || (f.status === 'ended' ? !licensed(x) : x.status === f.status && licensed(x));
  const list = allTitles().filter(x => (!f.cat || x.cat === f.cat) && statusOk(x) && (!f.country || inCountry(x, f.country)) && (!q || x.en.toLowerCase().includes(q) || (x.si || '').includes(q)));
  if (!list.length) return '<div class="empty">No titles match.</div>';
  return `<div class="table-wrap"><table class="tbl tbl-caps"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Countries</th><th>Licence ends</th><th>Rights holder</th><th></th></tr></thead><tbody>
    ${list.map(x => `<tr><td>${titleCell(x)}</td><td>${esc(typeText(x))}</td><td>${statusPill(x)}${x.status === 'scheduled' && x.releaseAt ? `<br><small class="muted">${fmtDate(x.releaseAt)}</small>` : ''}</td><td>${esc(countriesText(x))}</td><td style="white-space:nowrap">${!x.licenceEnd ? 'Not set' : licensed(x) ? fmtDate(x.licenceEnd) : 'Ended'}</td><td>${esc(x.rightsHolder || 'Not set')}</td><td><button class="link" data-act="editTitle" data-id="${x.id}">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
}
const toDateInput = ms => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '');
ACTIONS.editTitle = el => {
  const ti = getTitle(el.dataset.id);
  const world = ti.countries.includes('*');
  openModal(`<div class="modal-pad"><h2>${esc(ti.en)}</h2><form data-form="saveTitle" data-id="${ti.id}">
    <div class="pref-row">
      <label class="field"><span>Status</span><select class="input" name="status">${['draft', 'scheduled', 'published'].map(s => `<option value="${s}" ${ti.status === s ? 'selected' : ''}>${STATUS_CFG[s][1]}</option>`).join('')}</select></label>
      <label class="field"><span>Release date</span><input class="input" type="date" name="releaseAt" value="${toDateInput(ti.releaseAt)}"><div class="field-hint">Used when scheduled</div></label>
      <label class="field"><span>Licence ends</span><input class="input" type="date" name="licenceEnd" value="${toDateInput(ti.licenceEnd)}" required></label>
    </div>
    <label class="field"><span>Rights holder</span><input class="input" name="rightsHolder" value="${esc(ti.rightsHolder || '')}" required></label>
    <fieldset style="border:0;padding:0;margin:0 0 14px"><legend style="font-size:14px;font-weight:700;margin-bottom:6px">Permitted countries</legend>
      <label class="check" style="margin-bottom:8px"><input type="checkbox" name="world" ${world ? 'checked' : ''} data-change="worldToggle"><span>Worldwide</span></label>
      <div class="country-checks" id="country-checks" ${world ? 'hidden' : ''}>${Object.keys(COUNTRIES).map(c => `<label class="check"><input type="checkbox" name="c" value="${c}" ${world || ti.countries.includes(c) ? 'checked' : ''}><span>${esc(COUNTRIES[c].name)}</span></label>`).join('')}</div></fieldset>
    <div class="form-err" role="alert"></div>
    <div class="modal-actions"><a class="btn btn-ghost" href="#/watch/${ti.id}/trailer">Preview</a><button type="button" class="btn btn-ghost" data-act="closeModal">Cancel</button><button class="btn btn-primary">Save changes</button></div></form></div>`, { size: '', label: `Edit ${ti.en}` });
};
CHANGES.worldToggle = el => { $('#country-checks').hidden = el.checked; };
FORMS.saveTitle = async f => {
  const id = f.dataset.id;
  const countries = f.world.checked ? ['*'] : $$('input[name="c"]:checked', f).map(x => x.value);
  const err = $('.form-err', f);
  if (!countries.length) { err.textContent = 'Pick at least one country, or Worldwide.'; return; }
  const status = f.status.value;
  const releaseAt = f.releaseAt.value ? new Date(f.releaseAt.value + 'T20:00:00').getTime() : null;
  if (status === 'scheduled' && !releaseAt) { err.textContent = 'Scheduled titles need a release date.'; return; }
  store.admin.over[id] = Object.assign({}, store.admin.over[id], { status, releaseAt, countries, licenceEnd: new Date(f.licenceEnd.value + 'T23:59:00').getTime(), rightsHolder: f.rightsHolder.value.trim() });
  formBusy(f, true);
  const ok = await saveSettings();
  closeModal(); route(true);
  if (ok) toast('Saved. The viewer site is updated.');
};
ACTIONS.newTitle = () => {
  openModal(`<div class="modal-pad"><h2>Upload title</h2><form data-form="uploadTitle">
    <div class="pref-row"><label class="field"><span>English name</span><input class="input" name="en" required></label><label class="field"><span>Sinhala name</span><input class="input" name="si" lang="si" required></label></div>
    <div class="pref-row"><label class="field"><span>Category</span><select class="input" name="cat">${Object.keys(CATEGORIES).map(c => `<option value="${c}">${CATEGORIES[c].en}</option>`).join('')}</select></label>
      <label class="field"><span>Rating</span><select class="input" name="rating"><option>PG</option><option>12+</option><option>15+</option></select></label>
      <label class="field"><span>Length in minutes</span><input class="input" name="mins" type="number" min="1" max="400" value="90" required></label></div>
    <label class="field"><span>Synopsis</span><textarea class="input" name="syn" rows="2" required></textarea></label>
    <label class="field"><span>Rights holder</span><input class="input" name="rightsHolder" required><div class="field-hint">A signed licence is required before publishing.</div></label>
    <label class="dropzone">${icon('upload')}<span id="drop-text">Choose a video file. It stays on your computer in this demo.</span><input type="file" name="video" accept="video/*" data-change="pickVideo"></label>
    <div id="upload-progress"></div>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-act="closeModal">Cancel</button><button class="btn btn-primary" id="upload-go">Upload as draft</button></div></form></div>`, { label: 'Upload title' });
};
CHANGES.pickVideo = el => { if (el.files[0]) $('#drop-text').textContent = el.files[0].name; };
FORMS.uploadTitle = f => {
  const steps = ['Upload to video storage', 'Encode 1080p, 720p and 480p', 'Create HLS segments', 'Generate preview image'];
  const box = $('#upload-progress');
  $('#upload-go').disabled = true;
  const data = { en: f.en.value.trim(), si: f.si.value.trim(), cat: f.cat.value, rating: f.rating.value, mins: Number(f.mins.value), syn: f.syn.value.trim(), rightsHolder: f.rightsHolder.value.trim() };
  let i = 0;
  const paint = () => { box.innerHTML = `<div class="upload-steps">${steps.map((s, n) => `<div class="${n < i ? 'done' : ''}">${n < i ? icon('check') : n === i ? '<span class="spinner" style="width:17px;height:17px;border-width:2px;margin:0 2px"></span>' : icon('clock')}${s}</div>`).join('')}</div>`; };
  paint();
  const timer = setInterval(async () => {
    i += 1; paint();
    if (i < steps.length) return;
    clearInterval(timer);
    store.admin.custom.push(Object.assign(data, { id: 'c-' + Date.now().toString(36), year: new Date().getFullYear(), genres: ['drama'], font: 'display', status: 'draft', countries: ['LK'], licenceEnd: Date.now() + 365 * DAY, aliases: [] }));
    const ok = await saveSettings();
    closeModal(); route(true);
    if (ok) toast('Draft created. Edit it to schedule or publish.');
  }, 550);
  CLEAN.push(() => clearInterval(timer));
};

/* Home and banners: the rotating banner and which rows the home page shows, in what order. */
const ROW_NOTE = { new: 'Titles marked new', trending: 'Automatic, top 10', teledrama: 'Category', cinema: 'Category', dubbed: 'Category', programme: 'Category', soon: 'Scheduled titles' };
function adminHome() {
  const live = allTitles().filter(x => isReleased(x) && licensed(x));
  const banner = store.admin.banner.map(getTitle).filter(Boolean);
  const moveBtns = (kind, i, len) => `<span class="move"><button class="mini-icon" data-act="moveItem" data-kind="${kind}" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button><button class="mini-icon" data-act="moveItem" data-kind="${kind}" data-i="${i}" data-d="1" ${i === len - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button></span>`;
  const off = DEFAULT_ROWS.filter(r => !store.admin.rows.includes(r));
  const addable = live.filter(x => !store.admin.banner.includes(x.id) && !isTallOnly(x));
  const toggle = (key, on, locked) => `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''} ${locked ? 'disabled' : `data-change="rowToggle" data-row="${key}"`} aria-label="Show this row"><span></span></label>`;
  $('#admin-main').innerHTML = `${adminHead('Home & banners', 'What viewers see first. Changes go live straight away.', '<a class="btn btn-ghost" href="#/">Open home page</a>')}
    <div class="two-col home-cols">
      <section class="panel"><h2>Banner slides</h2>
        <div class="slide-list">${banner.map((x, i) => `<div class="slide-item"><span class="slide-art">${art(x)}</span>
          <div class="grow"><b>${esc(x.en)}</b><small>${x.trailer ? 'Trailer plays' : 'Image only'} · ${x.status === 'scheduled' && x.releaseAt > Date.now() ? `from ${esc(fmtDate(x.releaseAt))}` : x.licenceEnd ? `until ${esc(fmtDate(x.licenceEnd))}` : 'always'}</small></div>
          ${moveBtns('banner', i, banner.length)}<button class="link" data-act="editTitle" data-id="${x.id}">Edit</button><button class="mini-icon" data-act="bannerRemove" data-id="${x.id}" aria-label="Remove ${esc(x.en)}">${icon('x')}</button></div>`).join('') || '<p class="muted">No banner slides. Viewers see the top trending title.</p>'}</div>
        ${banner.length < 4 && addable.length ? `<div class="add-slide" id="add-slide"><button class="dashed" data-act="addSlideOpen">+ Add slide</button></div>` : banner.length >= 4 ? '<p class="muted" style="font-size:13.5px;margin-top:12px">Up to 4 slides. Remove one to add another.</p>' : ''}
        <p class="muted" style="font-size:13.5px;margin-top:12px">Titles not licensed for a viewer's country are skipped for that viewer.</p>
      </section>
      <section class="panel"><h2>Rows on the home page</h2>
        <div class="row-list">
          <div class="row-item"><div class="grow"><b>Continue watching</b><small>Automatic, per viewer</small></div>${toggle('continue', true, true)}</div>
          ${store.admin.rows.map((r, i) => `<div class="row-item"><div class="grow"><b>${ROW_LABEL[r]}</b><small>${ROW_NOTE[r]}</small></div>${moveBtns('rows', i, store.admin.rows.length)}${toggle(r, true)}</div>`).join('')}
          ${off.map(r => `<div class="row-item off"><div class="grow"><b>${ROW_LABEL[r]}</b><small>${ROW_NOTE[r]} · hidden</small></div>${toggle(r, false)}</div>`).join('')}
        </div></section>
    </div>`;
}
ACTIONS.addSlideOpen = () => {
  const live = allTitles().filter(x => isReleased(x) && licensed(x) && !store.admin.banner.includes(x.id) && !isTallOnly(x));
  $('#add-slide').innerHTML = `<div class="toolbar" style="margin:0"><select class="input grow" id="banner-add" aria-label="Add a banner title">${live.map(x => `<option value="${x.id}">${esc(x.en)}</option>`).join('')}</select><button class="btn btn-primary btn-sm" data-act="bannerAdd">Add</button><button class="btn btn-ghost btn-sm" data-act="addSlideClose">Cancel</button></div>`;
};
ACTIONS.addSlideClose = () => adminHome();
CHANGES.rowToggle = async el => {
  const r = el.dataset.row;
  if (el.checked) { if (!store.admin.rows.includes(r)) store.admin.rows.push(r); } else store.admin.rows = store.admin.rows.filter(x => x !== r);
  adminHome(); if (await saveSettings()) toast(el.checked ? `${ROW_LABEL[r]} is now on the home page` : `${ROW_LABEL[r]} is hidden`); adminHome();
};
ACTIONS.moveItem = async el => {
  const arr = store.admin[el.dataset.kind], i = Number(el.dataset.i), j = i + Number(el.dataset.d);
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  adminHome(); await saveSettings(); adminHome();
};
ACTIONS.bannerRemove = async el => { store.admin.banner = store.admin.banner.filter(id => id !== el.dataset.id); adminHome(); await saveSettings(); adminHome(); };
ACTIONS.bannerAdd = async () => { const v = $('#banner-add').value; if (!v) return; store.admin.banner.push(v); adminHome(); await saveSettings(); adminHome(); };

/* Users: the member list on the left, the chosen member's details on the right. */
let userFilter = { q: '', status: '', shown: 25 }, userPick = null;
const capWord = s => (s ? s[0].toUpperCase() + s.slice(1) : '–');
const USER_LABEL = { active: 'Active', trial: 'Trial', cancelled: 'Cancelled', expired: 'Ended', none: 'No plan' };
const payWay = m => ({ card: 'Card', dialog: 'Dialog bill', voucher: 'Voucher' }[m] || '–');
async function adminUsers() {
  $('#admin-main').innerHTML = loadingHTML;
  const here = location.hash;
  await loadAdminUsers();
  if (location.hash !== here || !$('#admin-main')) return;
  if (!adminUserList.some(u => u.id === userPick)) userPick = adminUserList.length ? adminUserList[0].id : null;
  $('#admin-main').innerHTML = `${adminHead('Users & subscriptions', '')}
    <div class="toolbar"><input class="input" id="u-q" type="search" placeholder="Search by name, email or ID" aria-label="Search users" value="${esc(userFilter.q)}">
      <select class="input" data-change="uStatus" aria-label="Status"><option value="">All statuses</option>${Object.keys(USER_LABEL).map(s => `<option value="${s}" ${userFilter.status === s ? 'selected' : ''}>${USER_LABEL[s]}</option>`).join('')}</select></div>
    <div class="users-cols"><div class="panel panel-flush" id="u-table">${usersTable()}</div><div class="panel" id="u-detail"></div></div>`;
  $('#u-q').addEventListener('input', e => { userFilter.q = e.target.value; userFilter.shown = 25; $('#u-table').innerHTML = usersTable(); });
  userDetail();
}
CHANGES.uStatus = el => { userFilter.status = el.value; userFilter.shown = 25; $('#u-table').innerHTML = usersTable(); };
function usersTable() {
  const q = userFilter.q.trim().toLowerCase();
  const list = adminUserList.filter(u => (!userFilter.status || u.status === userFilter.status) && (!q || `${u.name} ${u.email} ${u.id}`.toLowerCase().includes(q)));
  if (!list.length) return '<div class="empty">No users match.</div>';
  return `<div class="table-wrap"><table class="tbl tbl-caps tbl-pick"><thead><tr><th>Member</th><th>Country</th><th>Plan</th><th>Pays by</th><th>Status</th></tr></thead><tbody>
    ${list.slice(0, userFilter.shown).map(u => `<tr class="${u.id === userPick ? 'on' : ''}" data-act="userPick" data-id="${u.id}" tabindex="0"><td><b>${esc(u.name)}</b>${u.role === 'admin' ? ' <span class="pill">Admin</span>' : ''}</td><td>${esc(COUNTRIES[u.country] ? COUNTRIES[u.country].name : u.country)}</td><td>${u.status === 'none' ? '–' : 'Standard'}</td><td>${esc(payWay(u.method))}</td><td><span class="pill ${USER_STATUS[u.status] || ''}">${USER_LABEL[u.status] || capWord(u.status)}</span></td></tr>`).join('')}</tbody></table></div>
    ${list.length > userFilter.shown ? `<div style="padding:12px;text-align:center"><button class="btn btn-ghost btn-sm" data-act="userMore">Show more (${list.length - userFilter.shown} left)</button></div>` : ''}`;
}
async function userDetail() {
  const box = $('#u-detail'); if (!box) return;
  const u = adminUserList.find(x => x.id === userPick);
  if (!u) { box.innerHTML = '<p class="muted">Choose a member to see their details.</p>'; return; }
  const c = COUNTRIES[u.country] || COUNTRIES.LK;
  const until = u.periodEnd ? `${u.status === 'cancelled' ? 'access until' : u.status === 'expired' ? 'ended' : 'until'} ${fmtDate(u.periodEnd)}` : '';
  box.innerHTML = `<div class="ud-head"><span class="avatar">${esc(u.name.charAt(0).toUpperCase())}</span><div><b>${esc(u.email)}</b><small>${esc(u.name)} · Joined ${esc(fmtDate(u.since))}</small></div></div>
    <dl class="ud-kv"><dt>Plan</dt><dd>${u.status === 'none' ? 'None' : `Standard · ${esc(c.currency)}`}</dd>
      <dt>Status</dt><dd class="st-${USER_STATUS[u.status] || 'none'}">${esc(USER_LABEL[u.status] || u.status)}${until ? ` · ${esc(until)}` : ''}</dd>
      <dt>Pays by</dt><dd>${esc(payWay(u.method))}</dd><dt>ID</dt><dd class="muted">${esc(u.id.slice(0, 8))}</dd></dl>
    <h3 class="ud-sub">Payments</h3><div id="ud-pay"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div></div>
    <div class="ud-acts"><button class="btn btn-quiet btn-sm" data-act="userExtend" data-id="${u.id}">Extend access 7 days</button>
      ${u.status === 'active' || u.status === 'trial' ? `<button class="btn btn-quiet btn-sm" data-act="userCancel" data-id="${u.id}">Cancel membership</button>` : ''}
      <button class="btn btn-quiet btn-sm" data-act="userSignout" data-id="${u.id}">Sign out all screens</button></div>`;
  let pays = [];
  try { pays = await api('admin/payments?user=' + encodeURIComponent(u.id)); } catch (e) { /* shown as none */ }
  const slot = $('#ud-pay'); if (!slot || userPick !== u.id) return;
  const payText = p => (p.status === 'trial' ? 'Trial started' : p.status === 'failed' ? '<span class="st-err">Failed</span>' : `${esc(money(p.amount, p.currency))} · ${p.status === 'paid' ? 'Paid' : capWord(p.status)}`);
  slot.innerHTML = pays.length ? pays.map(p => `<div class="ud-pay"><span>${esc(fmtDate(p.created_at))} · ${esc(p.ref)}</span><span>${payText(p)}</span></div>`).join('') : '<p class="muted" style="font-size:14px">No payments yet.</p>';
}
ACTIONS.userPick = el => { userPick = el.dataset.id; $$('#u-table tr.on').forEach(r => r.classList.remove('on')); el.classList.add('on'); userDetail(); };
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('tr[data-act="userPick"]')) ACTIONS.userPick(e.target); });
ACTIONS.userMore = () => { userFilter.shown += 25; $('#u-table').innerHTML = usersTable(); };
async function refreshUsers(msg) { await loadAdminUsers(); $('#u-table').innerHTML = usersTable(); userDetail(); toast(msg); }
ACTIONS.userExtend = async el => {
  const u = adminUserList.find(x => x.id === el.dataset.id);
  el.disabled = true;
  if (!(await rpc('admin_extend', { p_user: u.id, p_days: 7 }))) { el.disabled = false; return; }
  await refreshUsers(`Added 7 days for ${u.name}`);
};
ACTIONS.userCancel = async el => {
  const u = adminUserList.find(x => x.id === el.dataset.id);
  if (!confirm(`Cancel ${u.name}'s membership? They keep watching until their paid time ends.`)) return;
  el.disabled = true;
  if (!(await rpc('admin_cancel', { p_user: u.id }))) { el.disabled = false; return; }
  await refreshUsers(`Cancelled ${u.name}'s membership`);
};
ACTIONS.userSignout = async el => {
  const u = adminUserList.find(x => x.id === el.dataset.id);
  if (!confirm(`Sign ${u.name} out on every device?${u.id === store.user.id ? ' This includes you, on this computer.' : ''}`)) return;
  el.disabled = true;
  try { const r = await api('admin/signout', { user: u.id }); toast(`Signed ${u.name} out of ${r.screens} screen${r.screens === 1 ? '' : 's'}`); }
  catch (e) { toast('Could not sign out. Please try again.'); }
  el.disabled = false;
};

/* Vouchers. The server makes the codes, returns them once, and keeps only their hashes. */
const monthsText = m => `${m} month${m === 1 ? '' : 's'}`;
async function adminVouchers() {
  $('#admin-main').innerHTML = loadingHTML;
  const here = location.hash;
  let b = [];
  try { b = await api('admin/batches'); } catch (e) { toast('Could not load voucher batches.'); }
  if (location.hash !== here || !$('#admin-main')) return;
  $('#admin-main').innerHTML = `${adminHead('Voucher batches', 'Single-use codes for resellers in Sri Lanka')}
    <div class="vouch-cols">
      <section class="panel"><h2>New batch</h2><form data-form="newBatch">
        <label class="field"><span>Reseller</span><input class="input" name="reseller" required placeholder="Shop or reseller name" list="resellers"><datalist id="resellers">${Array.from(new Set(b.map(x => x.reseller))).map(r => `<option value="${esc(r)}">`).join('')}</datalist></label>
        <div class="pref-row"><label class="field"><span>Number of codes</span><input class="input" name="qty" type="number" min="1" max="500" value="500" required></label>
          <label class="field"><span>Each code gives</span><select class="input" name="months">${[1, 3, 6, 12].map(m => `<option value="${m}">${monthsText(m)}</option>`).join('')}</select></label></div>
        <div class="pref-row"><label class="field"><span>Plan</span><select class="input" name="plan"><option>Standard</option></select></label>
          <label class="field"><span>Codes expire</span><input class="input" name="exp" type="date" required value="${toDateInput(Date.now() + 180 * DAY)}"></label></div>
        <p class="muted" style="font-size:13.5px;margin:4px 0 16px">Codes are random and work once. The full list downloads one time only, when you create the batch. Keep that file safe.</p>
        <button class="btn btn-primary btn-block">Create batch</button></form></section>
      <section class="panel panel-flush">
        ${b.length ? `<div class="table-wrap"><table class="tbl tbl-caps"><thead><tr><th>Batch</th><th>Reseller</th><th>Codes</th><th>Used</th><th>Expires</th><th></th></tr></thead><tbody>
        ${b.map(x => `<tr><td><b>${esc(x.name)}</b><br><small class="muted">${monthsText(x.months || 1)} · Standard</small></td><td>${esc(x.reseller)}</td><td>${x.codes.toLocaleString('en-GB')}</td>
          <td><span class="use-bar"><i style="width:${x.codes ? (x.used / x.codes) * 100 : 0}%"></i></span> ${x.used}</td><td style="white-space:nowrap">${toMs(x.expires_at) < Date.now() ? '<span class="pill err">Expired</span>' : esc(fmtDate(toMs(x.expires_at)))}</td>
          <td><button class="link" data-act="batchReport" data-id="${x.id}" data-name="${esc(x.name)}">Report</button></td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty">No batches yet. Create one, then try a code at checkout.</div>'}
      </section></div>`;
}
FORMS.newBatch = async f => {
  formBusy(f, true);
  const qty = Math.min(500, Number(f.qty.value));
  const batch = { reseller: f.reseller.value.trim(), months: Number(f.months.value), exp: new Date(f.exp.value + 'T23:59:00').getTime() };
  const r = await rpc('admin_create_batch', { reseller: batch.reseller, months: batch.months, expires: batch.exp, qty });
  if (!r) { formBusy(f, false); return; }
  batch.codes = r.codes; batch.name = r.name;
  downloadCsv(`vouchers-${batch.name}`, ['code', 'batch', 'reseller', 'gives', 'expires'], batch.codes.map(c => [c, batch.name, batch.reseller, monthsText(batch.months), toDateInput(batch.exp)]));
  await adminVouchers();
  toast(`${batch.name}: ${qty} codes made. The CSV file has downloaded.`);
};
/* Report: when each code was used and by whom. */
ACTIONS.batchReport = async el => {
  let rows = [];
  try { rows = await api('admin/batch-report?id=' + el.dataset.id); } catch (e) { toast('Could not make the report.'); return; }
  if (!rows.length) { toast(`No codes from ${el.dataset.name} have been used yet.`); return; }
  downloadCsv(`report-${el.dataset.name}`, ['used on', 'member email', 'member name'], rows.map(r => [new Date(r.redeemed_at).toISOString().slice(0, 16).replace('T', ' '), r.email || '(account deleted)', r.name || '']));
};
function downloadCsv(name, head, rows) {
  const cell = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [head, ...rows].map(r => r.map(cell).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `${name.replace(/[^\w-]+/g, '-').toLowerCase()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* Share links: make a tagged link and see how it looks when posted. */
const SOURCES = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['whatsapp', 'WhatsApp']];
function linkUrl(target, src, camp) {
  const tags = `?utm_source=${encodeURIComponent(src)}&utm_campaign=${encodeURIComponent(camp || 'campaign')}`;
  return target === 'plans' ? `${location.origin}${location.pathname}#/plans${tags}` : titleUrl(target, tags);
}
function adminLinks() {
  const live = allTitles().filter(x => x.status !== 'draft');
  const links = store.admin.links;
  const first = live.find(x => x.wide) || live[0];
  $('#admin-main').innerHTML = `${adminHead('Share links', 'Links for social posts and ads. Each one carries its campaign name, so you can tell where viewers came from.')}
    <div class="two-col links-cols">
      <section class="panel"><h2>Make a link</h2><form data-form="newLink">
        <div class="pref-row"><label class="field"><span>Goes to</span><select class="input" name="id" data-change="linkPreview"><option value="plans">Plans page</option>${live.map(x => `<option value="${x.id}" ${first && x.id === first.id ? 'selected' : ''}>Title · ${esc(x.en)}</option>`).join('')}</select></label>
          <label class="field"><span>Posted on</span><select class="input" name="src" data-change="linkPreview">${SOURCES.map(s => `<option value="${s[0]}">${s[1]}</option>`).join('')}</select></label></div>
        <label class="field"><span>Campaign name</span><input class="input" name="camp" id="link-camp" required pattern="[A-Za-z0-9_-]+" placeholder="neera-launch"><div class="field-hint">Letters, numbers, hyphens and underscores</div></label>
        <div class="link-box"><code id="link-url"></code><button type="button" class="btn btn-primary btn-sm" data-act="copyLink">Copy</button></div>
        <button class="btn btn-quiet btn-block" style="margin-top:12px">Save link</button></form></section>
      <section class="panel"><h2>How it looks when shared</h2><div id="link-card"></div></section>
    </div>
    <section class="panel panel-flush">${links.length ? `<div class="table-wrap"><table class="tbl tbl-caps"><thead><tr><th>Campaign</th><th>Goes to</th><th>Posted on</th><th>Link</th></tr></thead><tbody>
      ${links.map(l => { const ti = l.id === 'plans' ? null : getTitle(l.id); return `<tr><td><b>${esc(l.camp)}</b></td><td>${esc(l.id === 'plans' ? 'Plans page' : ti ? ti.en : l.id)}</td><td>${esc((SOURCES.find(s => s[0] === l.src) || [0, l.src])[1])}</td><td><button class="link" data-act="copy" data-text="${esc(l.url)}">Copy link</button></td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="empty">No saved links yet.</div>'}</section>`;
  $('#link-camp').addEventListener('input', linkPreview);
  linkPreview();
}
function linkPreview() {
  const f = $('[data-form="newLink"]'); if (!f) return;
  const url = linkUrl(f.id.value, f.src.value, f.camp.value.trim());
  $('#link-url').textContent = url;
  const ti = f.id.value === 'plans' ? null : getTitle(f.id.value);
  $('#link-card').innerHTML = `<div class="og-card"><div class="og-art">${ti ? art(ti) : `<span class="og-plans">${logoHTML()}</span>`}</div>
    <div class="og-text"><small>${esc(location.host)}</small><b>${esc(ti ? `${ti.en} · watch on Nexflix` : 'Nexflix · 7 days free')}</b><span>${esc(ti ? synOf(ti).slice(0, 90) : 'Sri Lankan films and teledramas, wherever you are.')}</span></div></div>`;
}
CHANGES.linkPreview = () => linkPreview();
ACTIONS.copyLink = () => copyText($('#link-url').textContent);
FORMS.newLink = async f => {
  const camp = f.camp.value.trim();
  store.admin.links.unshift({ id: f.id.value, src: f.src.value, camp, url: linkUrl(f.id.value, f.src.value, camp) });
  formBusy(f, true);
  const ok = await saveSettings();
  adminLinks();
  if (ok) toast('Link saved');
};
