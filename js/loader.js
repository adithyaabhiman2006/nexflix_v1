/* Nexflix loading screen.
   Runs straight after the loading screen in index.html (it must be a file: the server's security rules block inline scripts).
   1. Switches on the stylesheets, which load in the background so the loading screen can show at once.
   2. Keeps the loading screen up until the page, its images and fonts have finished loading.
      The percentage follows real image downloads, creeping forward so it never looks stuck. */
(function () {
  var root = document.documentElement;
  root.classList.add('nx-loading');

  [].forEach.call(document.querySelectorAll('link[data-nx-async]'), function (link) {
    function on() { link.media = 'all'; }
    if (link.sheet) on(); else { link.addEventListener('load', on); link.addEventListener('error', on); }
  });

  var el = document.getElementById('nx-loader');
  if (!el) { root.classList.remove('nx-loading'); return; }
  var pct = el.querySelector('.nx-pct'), note = el.querySelector('.nx-note');
  var shown = 0, done = false, start = Date.now();

  function set(p) {
    shown = Math.max(shown, Math.min(100, p));
    el.style.setProperty('--p', shown + '%');
    pct.textContent = Math.round(shown) + '%';
  }

  function tick() {
    if (done) return;
    var imgs = [].filter.call(document.images, function (i) { return i.loading !== 'lazy'; });
    var ok = imgs.filter(function (i) { return i.complete; }).length;
    var real = imgs.length ? ok / imgs.length : 0;
    var creep = 1 - Math.exp(-(Date.now() - start) / 6000); /* slow, steady forward motion */
    set(Math.min(94, 6 + 88 * Math.max(real * 0.8 + creep * 0.2, creep * 0.55)));
    var s = (Date.now() - start) / 1000;
    if (s > 6) { note.textContent = 'Slow connection. Nexflix is still loading, almost there…'; note.classList.add('nx-show'); }
    if (s > 15) note.textContent = 'Still loading on a slow network. Thanks for your patience.';
    setTimeout(tick, 200);
  }

  function finish() {
    if (done) return;
    done = true;
    set(100);
    setTimeout(function () {
      el.classList.add('nx-done');
      root.classList.remove('nx-loading');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, 400);
  }

  tick();
  var loaded = new Promise(function (r) { if (document.readyState === 'complete') r(); else window.addEventListener('load', r); });
  var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([loaded, fonts]).then(finish, finish);
  setTimeout(finish, 45000); /* never trap someone behind the loading screen */
})();
