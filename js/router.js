/* Hash router, so every page has a shareable link and the site runs from a plain folder. */

let baseHash = null;      /* the page to return to after a title modal or the player */
let renderedHash = null;  /* the page currently drawn in #app */

function parseHash() {
  const raw = location.hash || '#/';
  const [path, query] = raw.slice(1).split('?');
  const parts = path.split('/').filter(Boolean);
  return { raw, parts, params: new URLSearchParams(query || '') };
}

function requireUser(raw) {
  if (store.user) return true;
  try { sessionStorage.setItem('nx-return', raw); } catch (e) { /* ignored */ }
  location.replace('#/login');
  return false;
}

function renderPage(parts, params, raw) {
  const [name, a, b, c] = parts;
  switch (name) {
    case undefined: if (!store.user) { location.replace('#/welcome'); return false; } viewHome(); return true;
    case 'welcome': if (store.user) { location.replace('#/'); return false; } viewWelcome(); return true;
    case 'login': viewLogin(); return true;
    case 'signup': viewSignup(); return true;
    case 'reset': viewReset(); return true;
    case 'new-password': viewNewPassword(); return true;
    case 'browse': if (!requireUser(raw)) return false; viewBrowse(a); return true;
    case 'new': if (!requireUser(raw)) return false; viewNew(); return true;
    case 'search': if (!requireUser(raw)) return false; viewSearch(params.get('q') || ''); return true;
    case 'plans': if (!store.user) { location.replace('#/signup'); return false; } viewPlans(); return true;
    case 'account': if (!requireUser(raw)) return false; viewAccount(); return true;
    case 'info': viewInfo(a); return true;
    case 'title': viewTitle(a); return true;
    case 'admin': if (!requireUser(raw)) return false; viewAdmin(a); return true;
    case 'watch':
      if (b !== 'trailer' && !requireUser(raw)) return false;
      viewWatch(a, b, c); return true;
    default: viewNotFound(); return true;
  }
}

function route(force) {
  const { raw, parts, params } = parseHash();

  closeModal(true);

  /* Coming back from a title modal keeps the page and its scroll position. */
  if (!force && raw === renderedHash) {
    renderChrome();
    return;
  }

  runCleanups();
  const isSearchUpdate = parts[0] === 'search' && /^#\/search/.test(baseHash || '');
  const prevBase = baseHash;
  const ok = renderPage(parts, params, raw);
  if (ok === false) return;
  renderedHash = raw;
  if (parts[0] !== 'watch') baseHash = raw;
  else if (!prevBase) baseHash = store.user ? '#/' : '#/welcome';
  renderChrome(force);
  renderCookie();
  if (!isSearchUpdate) window.scrollTo(0, 0);
}

function parseFrom(hash) {
  const [path, query] = hash.slice(1).split('?');
  return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(query || '') };
}
function runCleanups() { CLEAN.forEach(fn => { try { fn(); } catch (e) { /* one failed cleanup shouldn't stop navigation */ } }); CLEAN = []; }

applyPrefs();
boot().then(ok => {
  if (!ok) { viewSetupNeeded(); return; }
  window.addEventListener('hashchange', () => route());
  route();
  showBootNotice();
});
