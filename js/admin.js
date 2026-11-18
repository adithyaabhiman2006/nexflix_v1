/* Admin panel. Changes save in this browser and feed straight into the viewer-facing site. */

const ADMIN_NAV = [
  ['dashboard', 'Dashboard', 'grid'], ['titles', 'Titles and licences', 'film'], ['home', 'Home and banner', 'layers'],
  ['users', 'Users and subscriptions', 'user'], ['vouchers', 'Voucher batches', 'ticket'], ['links', 'Share links', 'link'],
];
const STATUS_CFG = { published: ['ok', 'Published'], scheduled: ['warn', 'Scheduled'], draft: ['', 'Draft'] };
const USER_STATUS = { active: 'ok', trial: 'ok', cancelled: 'warn', pending: 'warn', expired: 'err' };
const ROW_LABEL = { new: 'New on Nexflix', trending: 'Top 10', teledrama: 'Teledramas', cinema: 'Cinema', dubbed: 'Sinhala Dubbed', programme: 'Programmes', soon: 'Coming soon' };
const sampleTag = '<span class="sample-tag">Sample data</span>';

function viewAdmin(section) {
  if (!store.user || store.user.role !== 'admin') {
    document.body.classList.remove('has-tabs');
    app().innerHTML = `<div class="auth-wrap"><div class="auth-card"><h1>Administrators only</h1><p class="muted">Your account can't open the admin panel. In this demo, sign in with an address containing "admin".</p><div class="panel-actions"><a class="btn btn-primary" href="#/">${esc(t('backHome'))}</a><button class="btn btn-ghost" data-act="demoAdmin">Sign in as admin</button></div></div></div>`;
    return;
  }
  const sec = ADMIN_NAV.some(n => n[0] === section) ? section : 'dashboard';
  app().innerHTML = `<div class="admin"><aside class="admin-side" aria-label="Admin">
      <a class="brand" href="#/admin/dashboard"><img src="assets/logo-on-dark.png" alt="Nexflix"></a><div class="admin-tag">Admin panel</div>
      ${ADMIN_NAV.map(n => `<a class="lnk ${n[0] === sec ? 'on' : ''}" href="#/admin/${n[0]}" ${n[0] === sec ? 'aria-current="page"' : ''}>${icon(n[2])}${n[1]}</a>`).join('')}
      <div class="bottom"><a class="lnk" href="#/">${icon('back')}Viewer site</a><a class="lnk" href="#" data-act="toggleTheme">${icon(store.theme === 'dark' ? 'sun' : 'moon')}${store.theme === 'dark' ? 'Light theme' : 'Dark theme'}</a></div>
    </aside><div class="admin-main" id="admin-main"></div></div>`;
  ({ dashboard: adminDashboard, titles: adminTitles, home: adminHome, users: adminUsers, vouchers: adminVouchers, links: adminLinks })[sec]();
}
const adminHead = (title, sub, right = '') => `<div class="admin-head"><div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${right}</div>`;
const titleCell = ti => `<div class="t-cell"><span class="t-thumb">${art(ti)}</span><span><b>${esc(ti.en)}</b><small>${esc(ti.si || '')}</small></span></div>`;
const statusPill = ti => {
  if (!licensed(ti)) return '<span class="pill err">Licence ended</span>';
  const c = STATUS_CFG[ti.status] || STATUS_CFG.draft; return `<span class="pill ${c[0]}">${c[1]}</span>`;
};
const countriesText = ti => (ti.countries.includes('*') ? 'Worldwide' : ti.countries.join(', '));

/* Dashboard */
function adminDashboard() {
  const all = allTitles();
  const count = s => SAMPLE_USERS.filter(u => u.status === s).length;
  const expiring = all.filter(x => licensed(x) && x.licenceEnd && x.licenceEnd - Date.now() < 45 * DAY).sort((a, b) => a.licenceEnd - b.licenceEnd);
  const ended = all.filter(x => !licensed(x));
  const live = all.filter(x => isReleased(x) && licensed(x)).length;
  $('#admin-main').innerHTML = `${adminHead('Dashboard', 'Catalogue counts come from the titles below. Subscriber and sign-up figures are samples.', sampleTag)}
    <div class="stat-grid">
      <div class="stat"><div class="lbl">Active members</div><div class="val">${count('active')}</div><div class="note">of ${SAMPLE_USERS.length} sample users</div></div>
      <div class="stat"><div class="lbl">On free trial</div><div class="val">${count('trial')}</div><div class="note">7-day trial</div></div>
      <div class="stat"><div class="lbl">Payments pending</div><div class="val">${count('pending')}</div><div class="note">No access until confirmed</div></div>
      <div class="stat"><div class="lbl">Titles live</div><div class="val">${live}</div><div class="note">${all.filter(x => x.status === 'scheduled').length} scheduled, ${ended.length} licence ended</div></div>
    </div>
    <div class="two-col">
      <section class="panel"><h2>Sign-ups per week</h2>${signupChart()}</section>
      <section class="panel"><h2>Licences ending soon</h2>
        ${expiring.length || ended.length ? ended.concat(expiring).map(x => `<div class="device"><div class="grow"><b>${esc(x.en)}</b><small>${esc(x.rightsHolder || '')}</small></div>${licensed(x) ? `<span class="pill warn">${Math.ceil((x.licenceEnd - Date.now()) / DAY)} days</span>` : '<span class="pill err">Ended</span>'}<button class="btn btn-ghost btn-sm" data-act="editTitle" data-id="${x.id}">Edit</button></div>`).join('') : '<p class="muted">No licences end in the next 45 days.</p>'}
      </section>
    </div>`;
  wireChart();
}
function signupChart() {
  const W = 600, H = 250, L0 = 40, B = 28, T = 12;
  const max = Math.ceil(Math.max(...SAMPLE_SIGNUPS.map(d => d[1])) / 100) * 100;
  const y = v => T + (H - T - B) * (1 - v / max);
  const step = (W - L0) / SAMPLE_SIGNUPS.length;
  const barW = Math.min(30, step * 0.5);
  let grid = '';
  for (let v = 0; v <= max; v += 100) grid += `<line class="chart-grid" x1="${L0}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="${L0 - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const bars = SAMPLE_SIGNUPS.map((d, i) => {
    const cx = L0 + step * (i + 0.5), top = y(d[1]), h = y(0) - top, x = cx - barW / 2;
    return `<g tabindex="0" role="img" aria-label="${d[0]}: ${d[1]} sign-ups" data-tip="${d[0]}: ${d[1]}" data-cx="${cx}" data-top="${top}">
      <rect class="chart-hit" x="${L0 + step * i}" y="${T}" width="${step}" height="${H - T - B}" fill="transparent"/>
      <path class="chart-bar" d="M${x} ${y(0)} V${top + 4} q0 -4 4 -4 H${x + barW - 4} q4 0 4 4 V${y(0)} Z"/>
      <text class="chart-axis" x="${cx}" y="${H - 8}" text-anchor="middle">${d[0]}</text></g>`;
  }).join('');
  return `<div class="chart-box" id="chart-box"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Weekly sign-ups, sample data">${grid}${bars}</svg><div class="chart-tip" id="chart-tip" hidden></div></div>
    <details class="chart-table"><summary>View as table</summary><div class="table-wrap"><table class="tbl"><thead><tr><th>Week</th><th class="num">Sign-ups</th></tr></thead><tbody>${SAMPLE_SIGNUPS.map(d => `<tr><td>${d[0]}</td><td class="num">${d[1]}</td></tr>`).join('')}</tbody></table></div></details>`;
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
let adminTitleFilter = { q: '', cat: '', status: '' };
function adminTitles() {
  $('#admin-main').innerHTML = `${adminHead('Titles and licences', 'Upload, schedule and publish. Country and licence rules decide who can watch.', `<button class="btn btn-primary" data-act="newTitle">${icon('upload')}Upload title</button>`)}
    <div class="toolbar"><input class="input grow" id="t-q" type="search" placeholder="Search titles" aria-label="Search titles" value="${esc(adminTitleFilter.q)}">
      <select class="input" data-change="tFilter" data-k="cat" aria-label="Category"><option value="">All categories</option>${Object.keys(CATEGORIES).map(c => `<option value="${c}" ${adminTitleFilter.cat === c ? 'selected' : ''}>${CATEGORIES[c].en}</option>`).join('')}</select>
      <select class="input" data-change="tFilter" data-k="status" aria-label="Status"><option value="">All statuses</option>${['published', 'scheduled', 'draft'].map(s => `<option value="${s}" ${adminTitleFilter.status === s ? 'selected' : ''}>${STATUS_CFG[s][1]}</option>`).join('')}</select></div>
    <div class="panel table-wrap" style="padding:6px" id="t-table">${titlesTable()}</div>`;
  $('#t-q').addEventListener('input', e => { adminTitleFilter.q = e.target.value; $('#t-table').innerHTML = titlesTable(); });
}
CHANGES.tFilter = el => { adminTitleFilter[el.dataset.k] = el.value; $('#t-table').innerHTML = titlesTable(); };
function titlesTable() {
  const f = adminTitleFilter, q = f.q.trim().toLowerCase();
  const list = allTitles().filter(x => (!f.cat || x.cat === f.cat) && (!f.status || x.status === f.status) && (!q || x.en.toLowerCase().includes(q) || (x.si || '').includes(q)));
  if (!list.length) return '<div class="empty">No titles match.</div>';
  return `<table class="tbl"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Countries</th><th>Licence ends</th><th>Rights holder</th><th></th></tr></thead><tbody>
    ${list.map(x => `<tr><td>${titleCell(x)}</td><td>${esc(CATEGORIES[x.cat].en)}</td><td>${statusPill(x)}${x.status === 'scheduled' && x.releaseAt ? `<br><small class="muted">${fmtDate(x.releaseAt)}</small>` : ''}</td><td>${esc(countriesText(x))}</td><td style="white-space:nowrap">${x.licenceEnd ? fmtDate(x.licenceEnd) : 'Not set'}</td><td>${esc(x.rightsHolder || 'Not set')}</td><td><button class="btn btn-ghost btn-sm" data-act="editTitle" data-id="${x.id}">Edit</button></td></tr>`).join('')}</tbody></table>`;
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
FORMS.saveTitle = f => {
  const id = f.dataset.id;
  const countries = f.world.checked ? ['*'] : $$('input[name="c"]:checked', f).map(x => x.value);
  const err = $('.form-err', f);
  if (!countries.length) { err.textContent = 'Pick at least one country, or Worldwide.'; return; }
  const status = f.status.value;
  const releaseAt = f.releaseAt.value ? new Date(f.releaseAt.value + 'T20:00:00').getTime() : null;
  if (status === 'scheduled' && !releaseAt) { err.textContent = 'Scheduled titles need a release date.'; return; }
  store.admin.over[id] = Object.assign({}, store.admin.over[id], { status, releaseAt, countries, licenceEnd: new Date(f.licenceEnd.value + 'T23:59:00').getTime(), rightsHolder: f.rightsHolder.value.trim() });
  save(); closeModal(); route(true); toast('Saved. The viewer site is updated.');
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
  const timer = setInterval(() => {
    i += 1; paint();
    if (i < steps.length) return;
    clearInterval(timer);
    store.admin.custom.push(Object.assign(data, { id: 'c-' + Date.now().toString(36), year: new Date().getFullYear(), genres: ['drama'], font: 'display', status: 'draft', countries: ['LK'], licenceEnd: Date.now() + 365 * DAY, aliases: [] }));
    save(); closeModal(); route(true); toast('Draft created. Edit it to schedule or publish.');
  }, 550);
  CLEAN.push(() => clearInterval(timer));
};

/* Home and banner */
function adminHome() {
  const live = allTitles().filter(x => isReleased(x) && licensed(x));
  const banner = store.admin.banner.map(getTitle).filter(Boolean);
  const moveBtns = (kind, i, len) => `<button class="mini-icon" data-act="moveItem" data-kind="${kind}" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button><button class="mini-icon" data-act="moveItem" data-kind="${kind}" data-i="${i}" data-d="1" ${i === len - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button>`;
  $('#admin-main').innerHTML = `${adminHead('Home and banner', 'Choose the rotating banner and the order of rows on the home page.', '<a class="btn btn-ghost" href="#/">Open home page</a>')}
    <div class="two-col">
      <section class="panel"><h2>Banner titles</h2><p class="muted" style="font-size:14.5px;margin-bottom:12px">Up to 4. Titles not licensed for a viewer's country are skipped for that viewer.</p>
        <div class="order-list">${banner.map((x, i) => `<div class="order-item"><span class="num">${i + 1}</span><span class="t-thumb">${art(x)}</span><span class="grow">${esc(x.en)}</span>${moveBtns('banner', i, banner.length)}<button class="mini-icon" data-act="bannerRemove" data-id="${x.id}" aria-label="Remove ${esc(x.en)}">${icon('x')}</button></div>`).join('') || '<p class="muted">No banner titles. Viewers see the top trending title.</p>'}</div>
        ${banner.length < 4 ? `<div class="toolbar" style="margin:14px 0 0"><select class="input grow" id="banner-add" aria-label="Add a banner title">${live.filter(x => !store.admin.banner.includes(x.id) && !isTallOnly(x)).map(x => `<option value="${x.id}">${esc(x.en)}</option>`).join('')}</select><button class="btn btn-primary btn-sm" data-act="bannerAdd">Add</button></div>` : ''}
      </section>
      <section class="panel"><h2>Row order</h2>
        <div class="order-list">${store.admin.rows.map((r, i) => `<div class="order-item"><span class="num">${i + 1}</span><span class="grow">${ROW_LABEL[r]}</span>${moveBtns('rows', i, store.admin.rows.length)}</div>`).join('')}</div>
        <p class="muted" style="font-size:13.5px;margin-top:10px">Continue watching always comes first, for viewers who have it.</p></section>
    </div>`;
}
ACTIONS.moveItem = el => {
  const arr = store.admin[el.dataset.kind], i = Number(el.dataset.i), j = i + Number(el.dataset.d);
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  save(); adminHome();
};
ACTIONS.bannerRemove = el => { store.admin.banner = store.admin.banner.filter(id => id !== el.dataset.id); save(); adminHome(); };
ACTIONS.bannerAdd = () => { const v = $('#banner-add').value; if (v) store.admin.banner.push(v); save(); adminHome(); };

/* Users */
let userFilter = { q: '', status: '', shown: 15 };
function adminUsers() {
  $('#admin-main').innerHTML = `${adminHead('Users and subscriptions', 'Search members and fix account problems.', sampleTag)}
    <div class="toolbar"><input class="input grow" id="u-q" type="search" placeholder="Name, email or ID" aria-label="Search users" value="${esc(userFilter.q)}">
      <select class="input" data-change="uStatus" aria-label="Status"><option value="">All statuses</option>${Object.keys(USER_STATUS).map(s => `<option value="${s}" ${userFilter.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></div>
    <div class="panel table-wrap" style="padding:6px" id="u-table">${usersTable()}</div>`;
  $('#u-q').addEventListener('input', e => { userFilter.q = e.target.value; userFilter.shown = 15; $('#u-table').innerHTML = usersTable(); });
}
CHANGES.uStatus = el => { userFilter.status = el.value; userFilter.shown = 15; $('#u-table').innerHTML = usersTable(); };
function usersTable() {
  const q = userFilter.q.trim().toLowerCase();
  const list = SAMPLE_USERS.filter(u => (!userFilter.status || u.status === userFilter.status) && (!q || `${u.name} ${u.email} ${u.id}`.toLowerCase().includes(q)));
  if (!list.length) return '<div class="empty">No users match.</div>';
  return `<table class="tbl"><thead><tr><th>Member</th><th>ID</th><th>Country</th><th>Status</th><th>Pays with</th><th>Renews</th><th></th></tr></thead><tbody>
    ${list.slice(0, userFilter.shown).map(u => `<tr><td><b>${esc(u.name)}</b><br><small class="muted">${esc(u.email)}</small></td><td class="muted">${u.id}</td><td>${u.country}</td><td><span class="pill ${USER_STATUS[u.status]}">${u.status[0].toUpperCase() + u.status.slice(1)}</span></td><td>${u.method}</td><td style="white-space:nowrap">${u.status === 'active' || u.status === 'trial' ? fmtDate(NOW + u.renewsInDays * DAY) : '–'}</td>
    <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-act="userExtend" data-id="${u.id}">Add 7 days</button> ${u.status === 'active' || u.status === 'trial' ? `<button class="btn btn-ghost btn-sm" data-act="userCancel" data-id="${u.id}">Cancel</button>` : ''}</td></tr>`).join('')}</tbody></table>
    ${list.length > userFilter.shown ? `<div style="padding:12px;text-align:center"><button class="btn btn-ghost btn-sm" data-act="userMore">Show more (${list.length - userFilter.shown} left)</button></div>` : ''}`;
}
ACTIONS.userMore = () => { userFilter.shown += 15; $('#u-table').innerHTML = usersTable(); };
ACTIONS.userExtend = el => {
  const u = SAMPLE_USERS.find(x => x.id === el.dataset.id);
  u.renewsInDays += 7; if (u.status !== 'trial') u.status = 'active';
  $('#u-table').innerHTML = usersTable(); toast(`Added 7 days for ${u.name}`);
};
ACTIONS.userCancel = el => {
  const u = SAMPLE_USERS.find(x => x.id === el.dataset.id);
  u.status = 'cancelled'; $('#u-table').innerHTML = usersTable(); toast(`Cancelled ${u.name}'s membership`);
};

/* Vouchers */
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(12); crypto.getRandomValues(buf);
  const s = Array.from(buf, v => chars[v % chars.length]).join('');
  return `NXF-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}
function adminVouchers() {
  const b = store.admin.batches;
  $('#admin-main').innerHTML = `${adminHead('Voucher batches', 'Prepaid codes for viewers in Sri Lanka. Each code works once.')}
    <div class="two-col form-first">
      <section class="panel"><h2>New batch</h2><form data-form="newBatch">
        <label class="field"><span>Batch name</span><input class="input" name="name" required placeholder="Colombo resellers, December"></label>
        <label class="field"><span>Reseller</span><input class="input" name="reseller" required></label>
        <div class="pref-row"><label class="field"><span>Codes</span><input class="input" name="qty" type="number" min="1" max="500" value="50" required></label>
        <label class="field"><span>Expires</span><input class="input" name="exp" type="date" required value="${toDateInput(Date.now() + 180 * DAY)}"></label></div>
        <button class="btn btn-primary btn-block">Generate codes</button></form></section>
      <section class="panel table-wrap"><h2>Batches</h2>
        ${b.length ? `<table class="tbl"><thead><tr><th>Batch</th><th class="num">Codes</th><th class="num">Used</th><th>Expires</th><th></th></tr></thead><tbody>
        ${b.map((x, i) => `<tr><td><b>${esc(x.name)}</b><br><small class="muted">${esc(x.reseller)}</small></td><td class="num">${x.codes.length}</td><td class="num">${x.codes.filter(c => store.admin.redeemed.includes(c)).length}</td><td style="white-space:nowrap">${fmtDate(x.exp)}</td><td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-act="batchCsv" data-i="${i}">Download CSV</button></td></tr>`).join('')}</tbody></table>
        <p class="muted" style="font-size:13.5px;margin-top:10px">The live system stores only hashed codes. This demo keeps them readable so you can test one at checkout.</p>` : '<div class="empty">No batches yet. Generate one, then try a code at checkout.</div>'}
      </section></div>`;
}
FORMS.newBatch = f => {
  const codes = new Set();
  const qty = Math.min(500, Number(f.qty.value));
  while (codes.size < qty) codes.add(makeCode());
  store.admin.batches.unshift({ name: f.name.value.trim(), reseller: f.reseller.value.trim(), exp: new Date(f.exp.value + 'T23:59:00').getTime(), codes: Array.from(codes) });
  save(); adminVouchers(); toast(`${qty} codes generated`);
};
ACTIONS.batchCsv = el => {
  const b = store.admin.batches[Number(el.dataset.i)];
  const csv = 'code,batch,reseller,expires\n' + b.codes.map(c => [c, b.name, b.reseller, toDateInput(b.exp)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `vouchers-${b.name.replace(/[^\w-]+/g, '-').toLowerCase()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

/* Share links */
function adminLinks() {
  const live = allTitles().filter(x => x.status !== 'draft');
  const links = store.admin.links;
  $('#admin-main').innerHTML = `${adminHead('Share links', 'Create links for social posts and ads, with campaign tags for reporting.')}
    <div class="two-col form-first">
      <section class="panel"><h2>New link</h2><form data-form="newLink">
        <label class="field"><span>Title</span><select class="input" name="id">${live.map(x => `<option value="${x.id}">${esc(x.en)}</option>`).join('')}</select></label>
        <label class="field"><span>Source</span><select class="input" name="src"><option>facebook</option><option>instagram</option><option>tiktok</option><option>youtube</option><option>whatsapp</option></select></label>
        <label class="field"><span>Campaign</span><input class="input" name="camp" required pattern="[A-Za-z0-9_-]+" placeholder="new-year-launch"><div class="field-hint">Letters, numbers, hyphens and underscores</div></label>
        <button class="btn btn-primary btn-block">Create link</button></form></section>
      <section class="panel"><h2>Links</h2>${links.length ? links.map(l => { const ti = getTitle(l.id); return ti ? `<div class="share-preview" style="margin-top:0"><div class="sp-art">${art(ti)}</div><div class="sp-text"><b>${esc(ti.en)} · Nexflix</b><small>${esc(l.src)} / ${esc(l.camp)}</small>
        <div class="copy-row" style="margin-top:7px"><input class="input" style="min-height:36px;padding:4px 9px" readonly value="${esc(l.url)}" aria-label="Link"><button class="btn btn-ghost btn-sm" data-act="copy" data-text="${esc(l.url)}">Copy</button></div></div></div>` : ''; }).join('') : '<div class="empty">No links yet.</div>'}</section>
    </div>`;
}
FORMS.newLink = f => {
  const tags = `?utm_source=${encodeURIComponent(f.src.value)}&utm_campaign=${encodeURIComponent(f.camp.value)}`;
  store.admin.links.unshift({ id: f.id.value, src: f.src.value, camp: f.camp.value, url: titleUrl(f.id.value, tags) });
  save(); adminLinks(); toast('Link created');
};
