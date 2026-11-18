/* Plans, checkout and the account page. The gateway step is simulated: card details are
   never collected here, because the real service sends customers to hosted checkout. */

const DEMO_VOUCHER = 'NXF-DEMO-2026-7KQ2';
let checkout = { method: null, stage: 'choose' };

const methodLabel = m => t({ card: 'payCard', voucher: 'payVoucher', dialog: 'payDialog' }[m] || 'payCard');
const METHOD_ICON = { card: 'card', voucher: 'ticket', dialog: 'phone' };

function viewPlans() {
  const c = COUNTRIES[store.country];
  if (!c.methods.includes(checkout.method)) checkout = { method: c.methods[0], stage: 'choose' };
  const trialOk = !store.sub.trialUsed;
  if (hasAccess() && store.sub.status !== 'cancelled') {
    app().innerHTML = `<div class="page page-narrow"><h1 class="page-title">${esc(L('You already have a membership', 'ඔබට දැනටමත් සාමාජිකත්වයක් ඇත'))}</h1><p class="page-sub">${esc(L('Manage it from your account page.', 'ගිණුම් පිටුවෙන් කළමනාකරණය කරන්න.'))}</p><a class="btn btn-primary" href="#/account">${esc(t('account'))}</a></div>`;
    return;
  }
  app().innerHTML = `<div class="page page-narrow">
    <h1 class="page-title">${esc(t('planTitle'))}</h1>
    <p class="page-sub">${esc(L(`Showing the price for ${c.name}. Change country in the footer to compare.`, `${c.siName} සඳහා මිල. සංසන්දනයට පාදකයෙන් රට වෙනස් කරන්න.`))}</p>
    <div class="checkout">
      <div class="panel">
        <div class="pill new" style="margin-bottom:12px">${esc(trialOk ? t('trial7') : t('trialUsed'))}</div>
        <h2>${esc(t('planName'))}</h2>
        <div class="plan-price">${esc(priceNow())}<small> ${esc(t('perMonth'))}</small></div>
        <ul class="plan-list">
          ${['planF1', 'planF2', 'planF3', 'planF4'].map(k => `<li>${icon('check')}<span>${esc(t(k))}</span></li>`).join('')}
        </ul>
      </div>
      <div class="panel" id="pay-panel">${payPanel()}</div>
    </div></div>`;
}
function payPanel() {
  const c = COUNTRIES[store.country];
  if (checkout.stage === 'gateway') return gatewayPanel();
  if (checkout.stage === 'verify') return `<div class="gateway-sim"><div class="spinner"></div><p style="margin-top:14px">${esc(L('Confirming your payment…', 'ගෙවීම තහවුරු කරමින්…'))}</p></div>`;
  if (checkout.stage === 'pending') return `<div class="gateway-sim"><span class="pill warn">${icon('clock')}${esc(L('Pending', 'පොරොත්තුවෙන්'))}</span><h2 style="margin-top:12px">${esc(L('Your payment is still being processed', 'ගෙවීම තවම සැකසෙමින් පවතී'))}</h2><p class="muted">${esc(L('Access starts only after the payment provider confirms it.', 'ගෙවීම තහවුරු වූ පසු පමණක් ප්‍රවේශය ලැබේ.'))}</p><div class="row-btns"><button class="btn btn-primary" data-act="gwResult" data-r="ok">${esc(L('Simulate: payment confirmed', 'අනුකරණය: තහවුරු විය'))}</button><button class="btn btn-ghost" data-act="payRestart">${esc(L('Try another way', 'වෙනත් ක්‍රමයක්'))}</button></div></div>`;
  if (checkout.stage === 'failed') return `<div class="gateway-sim"><span class="pill err">${icon('alert')}${esc(L('Payment failed', 'ගෙවීම අසාර්ථකයි'))}</span><h2 style="margin-top:12px">${esc(L('You haven\'t been charged', 'ඔබෙන් මුදල් අය වී නැත'))}</h2><p class="muted">${esc(L('Check your details or try a different method.', 'විස්තර පරීක්ෂා කරන්න හෝ වෙනත් ක්‍රමයක් උත්සාහ කරන්න.'))}</p><div class="row-btns"><button class="btn btn-primary" data-act="payRestart">${esc(L('Try again', 'නැවත උත්සාහ කරන්න'))}</button></div></div>`;
  if (checkout.stage === 'otp') return `<h2>${esc(t('payDialog'))}</h2><form data-form="dialogOtp"><p class="muted" style="margin-bottom:12px">${esc(L(`We sent a code to ${checkout.phone}. In this demo the code is 123456.`, `${checkout.phone} වෙත කේතයක් යැවීය. ආදර්ශනයේ කේතය 123456.`))}</p>
    <label class="field"><span>${esc(L('Confirmation code', 'තහවුරු කේතය'))}</span><input class="input" name="otp" inputmode="numeric" maxlength="6" required autocomplete="one-time-code"></label>
    <div class="form-err" role="alert"></div><button class="btn btn-primary btn-block">${esc(t('linkDialog'))}</button></form>`;

  const tabs = `<div class="tabs" role="tablist">${c.methods.map(m => `<button class="tab ${checkout.method === m ? 'on' : ''}" role="tab" aria-selected="${checkout.method === m}" data-act="payTab" data-m="${m}">${icon(METHOD_ICON[m])}${esc(methodLabel(m))}</button>`).join('')}</div>`;
  const termsText = t('terms', { price: priceNow() });
  const agree = `<p class="terms-box">${esc(termsText)}</p><label class="check" style="margin-bottom:14px"><input type="checkbox" name="agree" required><span>${esc(t('termsAgree'))}</span></label>`;
  if (checkout.method === 'voucher') {
    return `${tabs}<form data-form="voucher">
      <label class="field"><span>${esc(t('payVoucher'))}</span><input class="input" name="code" required placeholder="XXX-XXXX-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase"><div class="field-hint">${esc(L(`Demo code: ${DEMO_VOUCHER}. Each code works once and adds one month.`, `ආදර්ශන කේතය: ${DEMO_VOUCHER}. එක් කේතයක් එක් වරක් පමණි.`))}</div></label>
      <div class="form-err" role="alert"></div><button class="btn btn-primary btn-block">${esc(t('redeem'))}</button></form>`;
  }
  if (checkout.method === 'dialog') {
    return `${tabs}<form data-form="dialogStart">
      <label class="field"><span>${esc(L('Dialog mobile number', 'ඩයලොග් දුරකථන අංකය'))}</span><input class="input" name="phone" type="tel" required pattern="(\\+94|0)7[0-9]{8}" placeholder="07X XXX XXXX" oninput="this.value=this.value.replace(/\\s/g,'')"></label>
      ${agree}<div class="form-err" role="alert"></div><button class="btn btn-primary btn-block">${esc(L('Send confirmation code', 'තහවුරු කේතය යවන්න'))}</button></form>
      <div class="demo-note">${icon('info')}<span>${esc(L('Charged to your Dialog balance or bill. Sri Lanka only. Simulated in this demo.', 'ඩයලොග් ශේෂයෙන් හෝ බිල්පතෙන් අය වේ. ශ්‍රී ලංකාවට පමණි.'))}</span></div>`;
  }
  return `${tabs}<form data-form="cardStart">${agree}<button class="btn btn-primary btn-block">${esc(t('continueCheckout'))} ${icon('right')}</button></form>
    <div class="demo-note">${icon('info')}<span>${esc(L('You enter card details on the payment provider\'s secure page. Nexflix never sees or stores your card number.', 'කාඩ්පත් විස්තර ඇතුළත් කරන්නේ ගෙවීම් සේවාවේ ආරක්ෂිත පිටුවේය.'))}</span></div>`;
}
function gatewayPanel() {
  return `<div class="gateway-sim"><span class="pill">${esc(L('Payment gateway simulator', 'ගෙවීම් අනුකාරකය'))}</span>
    <h2 style="margin-top:12px">${esc(L('The provider\'s hosted page opens here', 'සේවාවේ පිටුව මෙහි විවෘත වේ'))}</h2>
    <p class="muted">${esc(L('Choose how the demo payment should turn out.', 'ආදර්ශන ගෙවීමේ ප්‍රතිඵලය තෝරන්න.'))}</p>
    <div class="row-btns">
      <button class="btn btn-primary" data-act="gwResult" data-r="ok">${esc(L('Approved', 'අනුමතයි'))}</button>
      <button class="btn btn-ghost" data-act="gwResult" data-r="pending">${esc(L('Stays pending', 'පොරොත්තුවෙන්'))}</button>
      <button class="btn btn-ghost" data-act="gwResult" data-r="failed">${esc(L('Declined', 'ප්‍රතික්ෂේපිතයි'))}</button>
    </div></div>`;
}
const repaintPay = () => { const p = $('#pay-panel'); if (p) p.innerHTML = payPanel(); };
ACTIONS.payTab = el => { checkout = { method: el.dataset.m, stage: 'choose' }; repaintPay(); };
ACTIONS.payRestart = () => { checkout.stage = 'choose'; repaintPay(); };
FORMS.cardStart = () => { checkout.stage = 'gateway'; repaintPay(); };
FORMS.dialogStart = f => { checkout.phone = f.phone.value; checkout.stage = 'otp'; repaintPay(); };
FORMS.dialogOtp = f => {
  if (f.otp.value !== '123456') { $('.form-err', f).textContent = L('That code isn\'t right. Try 123456.', 'කේතය වැරදියි. 123456 උත්සාහ කරන්න.'); return; }
  verifyThenActivate('dialog');
};
ACTIONS.gwResult = el => {
  const r = el.dataset.r;
  if (r === 'ok') verifyThenActivate('card');
  else {
    if (r === 'failed') recordPayment('card', 'failed');
    checkout.stage = r; repaintPay();
  }
};
FORMS.voucher = f => {
  const err = $('.form-err', f);
  if (store.voucherFails >= 5) { err.textContent = L('Too many attempts. Try again later.', 'උත්සාහයන් වැඩියි. පසුව උත්සාහ කරන්න.'); return; }
  const code = f.code.value.trim().toUpperCase();
  const batchCodes = store.admin.batches.flatMap(b => b.codes);
  if (store.admin.redeemed.includes(code)) { err.textContent = L('This code has already been used.', 'මෙම කේතය දැනටමත් භාවිත කර ඇත.'); return; }
  if (code !== DEMO_VOUCHER && !batchCodes.includes(code)) {
    store.voucherFails += 1; save();
    err.textContent = L(`That code isn't valid. ${5 - store.voucherFails} attempts left.`, `කේතය වලංගු නැත. තවත් උත්සාහ ${5 - store.voucherFails}යි.`);
    return;
  }
  store.admin.redeemed.push(code);
  store.voucherFails = 0;
  checkout.stage = 'verify'; repaintPay();
  setTimeout(() => activate('voucher', true), 800);
};
function verifyThenActivate(method) {
  checkout.stage = 'verify'; repaintPay();
  setTimeout(() => activate(method, false), 1000);
}
function recordPayment(method, status) {
  const c = COUNTRIES[store.country];
  store.payments.unshift({ date: Date.now(), label: L('Monthly plan', 'මාසික සැලසුම'), method, amount: status === 'trial' ? 0 : c.amount, currency: c.currency, status, ref: 'DEMO-' + Math.floor(10000 + Math.random() * 89999) });
  save();
}
function activate(method, voucher) {
  const trial = !voucher && !store.sub.trialUsed;
  const periodDays = trial ? 7 : 30;
  store.sub = { status: trial ? 'trial' : 'active', trialUsed: store.sub.trialUsed || trial, method, start: Date.now(), periodEnd: Date.now() + periodDays * DAY };
  recordPayment(method, trial ? 'trial' : 'paid');
  checkout = { method: null, stage: 'choose' };
  save();
  toast(trial ? L('Your 7-day free trial has started', 'දින 7ක නොමිලේ අත්හදා බැලීම ආරම්භ විය') : L('Payment confirmed. Enjoy!', 'ගෙවීම තහවුරු විය.'));
  go('#/');
}

/* Account */
const STATUS_PILL = {
  trial: ['ok', ['On free trial', 'නොමිලේ අත්හදා බැලීම']], active: ['ok', ['Active', 'සක්‍රීය']],
  cancelled: ['warn', ['Cancelled', 'අවලංගු කර ඇත']], none: ['', ['No membership', 'සාමාජිකත්වයක් නැත']],
};
const PAY_PILL = { paid: ['ok', ['Paid', 'ගෙවා ඇත']], failed: ['err', ['Failed', 'අසාර්ථකයි']], trial: ['', ['Trial started', 'අත්හදා බැලීම']], pending: ['warn', ['Pending', 'පොරොත්තුවෙන්']] };
const pill = (cfg) => `<span class="pill ${cfg[0]}">${esc(L(cfg[1][0], cfg[1][1]))}</span>`;

function viewAccount() {
  const u = store.user, s = store.sub;
  const streamingOthers = store.otherStreams.filter(d => d.streaming).length;
  const dateLabel = s.status === 'trial' ? L('First charge', 'පළමු ගෙවීම') : s.status === 'cancelled' ? L('Access ends', 'ප්‍රවේශය අවසන් වන දිනය') : L('Next payment', 'ඊළඟ ගෙවීම');
  app().innerHTML = `<div class="page page-narrow">
    <h1 class="page-title">${esc(t('account'))}</h1>
    <p class="page-sub">${esc(t('memberSince', { date: fmtDate(u.since) }))}</p>
    <div class="acct-grid">
      <section class="panel"><h2>${esc(t('membership'))}</h2>
        <dl class="kv"><dt>${esc(L('Status', 'තත්ත්වය'))}</dt><dd>${pill(STATUS_PILL[s.status] || STATUS_PILL.none)}</dd>
          <dt>${esc(t('fName'))}</dt><dd>${esc(u.name)}</dd><dt>${esc(t('fEmail'))}</dt><dd>${esc(u.email)}</dd>
          ${s.status !== 'none' ? `<dt>${esc(L('Plan', 'සැලසුම'))}</dt><dd>${esc(t('planName'))}, ${esc(priceNow())} ${esc(t('perMonth'))}</dd>
          <dt>${esc(L('Paying with', 'ගෙවන ක්‍රමය'))}</dt><dd>${esc(methodLabel(s.method))}</dd>
          <dt>${esc(dateLabel)}</dt><dd>${esc(fmtDate(s.periodEnd))}</dd>` : ''}
          ${s.status === 'cancelled' && s.cancelReason ? `<dt>${esc(L('Reason given', 'ලබා දුන් හේතුව'))}</dt><dd>${esc(L(CANCEL_REASONS[s.cancelReason][0], CANCEL_REASONS[s.cancelReason][1]))}</dd>` : ''}
        </dl>
        <div class="panel-actions">
          ${s.status === 'none' ? `<a class="btn btn-primary" href="#/plans">${esc(t('subscribeNow'))}</a>` : ''}
          ${s.status === 'trial' || s.status === 'active' ? `<button class="btn btn-danger" data-act="askCancel">${esc(t('cancelMembership'))}</button>` : ''}
          ${s.status === 'cancelled' ? `<button class="btn btn-primary" data-act="restart">${esc(t('restart'))}</button>` : ''}
          <button class="btn btn-ghost" data-act="askVoucher">${icon('ticket')}${esc(t('redeem'))}</button>
        </div></section>

      <section class="panel"><h2>${esc(t('devices'))}</h2>
        <p class="muted" style="font-size:14.5px;margin-bottom:6px">${esc(L(`Your plan allows ${STREAM_LIMIT} screens at once. ${streamingOthers} in use on other devices right now.`, `එකවර තිර ${STREAM_LIMIT}ක් සඳහා අවසර ඇත. දැන් වෙනත් උපාංගවල ${streamingOthers}ක් භාවිතයේ.`))}</p>
        <div class="device">${icon('laptop')}<div class="grow"><b>${esc(L('This browser', 'මෙම බ්‍රව්සරය'))}</b><small>${esc(COUNTRIES[store.country].name)}</small></div></div>
        ${store.otherStreams.map(d => `<div class="device">${icon(d.icon)}<div class="grow"><b>${esc(d.name)}</b><small>${esc(d.where)} · ${d.streaming ? esc(L('Streaming now', 'දැන් නරඹමින්')) : esc(L('Idle', 'නිෂ්ක්‍රීය'))}</small></div>
          ${d.streaming ? `<button class="btn btn-ghost btn-sm" data-act="stopStream" data-id="${d.id}">${esc(L('Stop stream', 'නවත්වන්න'))}</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-act="removeDevice" data-id="${d.id}">${esc(t('signOut'))}</button></div>`).join('')}
        <div class="panel-actions"><button class="btn btn-ghost btn-sm" data-act="simStream">${esc(L('Demo: start a stream on another device', 'ආදර්ශනය: වෙනත් උපාංගයක නරඹන්න'))}</button></div></section>

      <section class="panel"><h2>${esc(t('paymentHistory'))}</h2>
        ${store.payments.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>${esc(L('Date', 'දිනය'))}</th><th>${esc(L('Paid with', 'ගෙවූ ක්‍රමය'))}</th><th class="num">${esc(L('Amount', 'මුදල'))}</th><th>${esc(L('Status', 'තත්ත්වය'))}</th><th>${esc(L('Reference', 'යොමුව'))}</th></tr></thead>
          <tbody>${store.payments.map(p => `<tr><td>${esc(fmtDate(p.date))}</td><td>${esc(methodLabel(p.method))}</td><td class="num">${esc(money(p.amount, p.currency))}</td><td>${pill(PAY_PILL[p.status] || PAY_PILL.pending)}</td><td class="muted">${esc(p.ref)}</td></tr>`).join('')}</tbody></table></div>`
          : `<p class="muted">${esc(L('No payments yet.', 'තවම ගෙවීම් නැත.'))}</p>`}</section>

      <section class="panel"><h2>${esc(t('preferences'))}</h2><div class="pref-row">
        <label class="field"><span>${esc(t('language'))}</span><select class="input" data-change="setLang"><option value="en" ${store.lang === 'en' ? 'selected' : ''}>English</option><option value="si" ${store.lang === 'si' ? 'selected' : ''}>සිංහල</option></select></label>
        <label class="field"><span>${esc(L('Theme', 'තේමාව'))}</span><select class="input" data-change="setTheme"><option value="dark" ${store.theme === 'dark' ? 'selected' : ''}>${esc(t('themeDark'))}</option><option value="light" ${store.theme === 'light' ? 'selected' : ''}>${esc(t('themeLight'))}</option></select></label>
        <label class="field"><span>${esc(L('Subtitles', 'උපසිරැසි'))}</span><select class="input" data-change="setSubs"><option value="si" ${store.subLang === 'si' ? 'selected' : ''}>සිංහල</option><option value="en" ${store.subLang === 'en' ? 'selected' : ''}>English</option><option value="off" ${store.subLang === 'off' ? 'selected' : ''}>${esc(L('Off', 'අක්‍රිය'))}</option></select></label>
        <label class="field"><span>${esc(L('Video quality', 'වීඩියෝ ගුණත්වය'))}</span><select class="input" data-change="setQuality">${QUALITIES().map(q => `<option value="${q[0]}" ${store.quality === q[0] ? 'selected' : ''}>${esc(q[1])}</option>`).join('')}</select></label>
      </div>
      <div class="panel-actions"><button class="btn btn-ghost btn-sm" data-act="resetDemo">${esc(L('Reset demo data', 'ආදර්ශන දත්ත යළි සකසන්න'))}</button></div></section>
    </div></div>`;
}
CHANGES.setSubs = el => { store.subLang = el.value; save(); };
CHANGES.setQuality = el => { store.quality = el.value; save(); };
ACTIONS.simStream = () => {
  const pool = [['Living room TV', 'Kandy', 'tv'], ['Office laptop', 'London', 'laptop'], ['Tablet', 'Dubai', 'phone']];
  const idle = store.otherStreams.find(d => !d.streaming);
  if (idle) idle.streaming = true;
  else { const p = pool[store.otherStreams.length % pool.length]; store.otherStreams.push({ id: 'd' + Date.now(), name: p[0], where: p[1], icon: p[2], streaming: true }); }
  save(); viewAccount();
};
ACTIONS.stopStream = el => { const d = store.otherStreams.find(x => x.id === el.dataset.id); if (d) d.streaming = false; save(); viewAccount(); };
ACTIONS.removeDevice = el => { store.otherStreams = store.otherStreams.filter(x => x.id !== el.dataset.id); save(); viewAccount(); };
ACTIONS.askCancel = () => {
  openModal(`<div class="modal-pad"><h2>${esc(t('cancelMembership'))}?</h2>
    <p class="muted">${esc(L(`You can keep watching until ${fmtDate(store.sub.periodEnd)}. You won't be charged again.`, `${fmtDate(store.sub.periodEnd)} දක්වා නැරඹිය හැක. නැවත මුදල් අය නොවේ.`))}</p>
    <form data-form="cancelSub"><fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700;margin-top:14px">${esc(L('What\'s the main reason?', 'ප්‍රධාන හේතුව කුමක්ද?'))}</legend>
    <div class="radio-list">${Object.keys(CANCEL_REASONS).map(k => `<label><input type="radio" name="reason" value="${k}" required>${esc(L(CANCEL_REASONS[k][0], CANCEL_REASONS[k][1]))}</label>`).join('')}</div></fieldset>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-act="closeModal">${esc(L('Keep membership', 'තබා ගන්න'))}</button><button class="btn btn-danger">${esc(t('cancelMembership'))}</button></div></form></div>`, { size: 'sm', label: t('cancelMembership') });
};
FORMS.cancelSub = f => {
  store.sub.status = 'cancelled';
  store.sub.cancelReason = f.reason.value;
  save(); closeModal(); viewAccount();
  toast(L('Membership cancelled', 'සාමාජිකත්වය අවලංගු විය'));
};
ACTIONS.restart = () => {
  store.sub.status = 'active'; delete store.sub.cancelReason;
  if (store.sub.periodEnd < Date.now()) store.sub.periodEnd = Date.now() + 30 * DAY;
  save(); viewAccount(); toast(L('Welcome back', 'ආයුබෝවන්'));
};
ACTIONS.askVoucher = () => {
  if (store.country !== 'LK') { toast(L('Vouchers are for viewers in Sri Lanka', 'වවුචර් ශ්‍රී ලංකාවේ නරඹන්නන් සඳහා')); return; }
  openModal(`<div class="modal-pad"><h2>${esc(t('redeem'))}</h2><form data-form="voucherAcct">
    <label class="field"><span>${esc(t('payVoucher'))}</span><input class="input" name="code" required autocomplete="off" style="text-transform:uppercase"><div class="field-hint">${esc(L(`Demo code: ${DEMO_VOUCHER}`, `ආදර්ශන කේතය: ${DEMO_VOUCHER}`))}</div></label>
    <div class="form-err" role="alert"></div><button class="btn btn-primary btn-block">${esc(t('redeem'))}</button></form></div>`, { size: 'sm', label: t('redeem') });
};
FORMS.voucherAcct = f => {
  const err = $('.form-err', f);
  const code = f.code.value.trim().toUpperCase();
  if (store.voucherFails >= 5) { err.textContent = L('Too many attempts. Try again later.', 'උත්සාහයන් වැඩියි.'); return; }
  if (store.admin.redeemed.includes(code)) { err.textContent = L('This code has already been used.', 'මෙම කේතය දැනටමත් භාවිත කර ඇත.'); return; }
  if (code !== DEMO_VOUCHER && !store.admin.batches.flatMap(b => b.codes).includes(code)) { store.voucherFails += 1; save(); err.textContent = L('That code isn\'t valid.', 'කේතය වලංගු නැත.'); return; }
  store.admin.redeemed.push(code); store.voucherFails = 0;
  const from = Math.max(Date.now(), store.sub.periodEnd || 0);
  store.sub = Object.assign({}, store.sub, { status: store.sub.status === 'cancelled' || store.sub.status === 'none' ? 'active' : store.sub.status, method: store.sub.method || 'voucher', periodEnd: from + 30 * DAY });
  recordPayment('voucher', 'paid');
  closeModal(); viewAccount(); toast(L('One month added', 'මාසයක් එකතු විය'));
};
ACTIONS.resetDemo = () => {
  if (!confirm(L('Reset all demo data in this browser?', 'මෙම බ්‍රව්සරයේ ආදර්ශන දත්ත මකන්නද?'))) return;
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nothing stored */ }
  location.hash = '#/welcome';
  location.reload();
};
