/* Plans, checkout and the account page. Membership changes are made by the local server
   (server/server.js). The card and Dialog gateway steps are still simulated: the payment
   step replaces /api/membership/start with the payment provider's confirmation. */

let checkout = { method: null, stage: 'choose' };

const methodLabel = m => t({ card: 'payCard', voucher: 'payVoucher', dialog: 'payDialog' }[m] || 'payCard');
const METHOD_ICON = { card: 'card', voucher: 'ticket', dialog: 'phone' };
const METHOD_NOTE = {
  card: ['Secure checkout by the payment provider', 'ගෙවීම් සේවාවේ ආරක්ෂිත පිටුවෙන්'],
  dialog: ['Sri Lanka only · pay from balance or bill', 'ශ්‍රී ලංකාවට පමණි · ශේෂයෙන් හෝ බිල්පතෙන්'],
  voucher: ['Bought from a reseller', 'අලෙවි නියෝජිතයෙකුගෙන් මිලදී ගත්'],
};

function viewPlans() {
  const c = COUNTRIES[store.country];
  if (!c.methods.includes(checkout.method)) checkout = { method: c.methods[0], stage: 'choose' };
  const trialOk = !store.sub.trialUsed;
  if (hasAccess() && store.sub.status !== 'cancelled') {
    app().innerHTML = `<div class="page page-narrow"><h1 class="page-title">${esc(L('You already have a membership', 'ඔබට දැනටමත් සාමාජිකත්වයක් ඇත'))}</h1><p class="page-sub">${esc(L('Manage it from your account page.', 'ගිණුම් පිටුවෙන් කළමනාකරණය කරන්න.'))}</p><a class="btn btn-primary" href="#/account">${esc(t('account'))}</a></div>`;
    return;
  }
  const steps = [L('Plan', 'සැලසුම'), L('Payment', 'ගෙවීම'), L('Start watching', 'නැරඹීම අරඹන්න')];
  app().innerHTML = `<div class="page plans-page">
    <ol class="steps" aria-label="${esc(L('Steps', 'පියවර'))}">${steps.map((s, i) => `<li class="${i === 0 ? 'on' : ''}">${i + 1} ${esc(s)}</li>`).join('')}</ol>
    <div class="checkout">
      <div>
        <h1 class="page-title">${esc(t('planTitle'))}</h1>
        <p class="page-sub">${esc(trialOk ? L('7 days free, then billed monthly. One free trial per account. Cancel any time.', 'දින 7ක් නොමිලේ, පසුව මාසිකව අය කෙරේ. එක් ගිණුමකට එක් නොමිලේ අත්හදා බැලීමක්. ඕනෑම විටෙක අවලංගු කළ හැක.')
          : L('Billed monthly. Your free trial has been used. Cancel any time.', 'මාසිකව අය කෙරේ. ඔබේ නොමිලේ අත්හදා බැලීම අවසන්. ඕනෑම විටෙක අවලංගු කළ හැක.'))}</p>
        <label class="prices-for">${esc(L('Prices for', 'මිල ගණන්'))}
          <select class="input" data-change="setCountry">${Object.keys(COUNTRIES).map(k => `<option value="${k}" ${store.country === k ? 'selected' : ''}>${esc(countryName(k))} · ${esc(COUNTRIES[k].currency)}</option>`).join('')}</select></label>
        <div class="plan-card on">
          <h2>${esc(t('planName'))}</h2>
          <div class="plan-price">${esc(priceNow())}<small> ${esc(t('perMonth'))}</small></div>
          <ul class="plan-list">${['planF1', 'planF2', 'planF3', 'planF4'].map(k => `<li>${icon('check')}<span>${esc(t(k))}</span></li>`).join('')}</ul>
        </div>
        <p class="plan-fine">${esc(t('terms', { price: priceNow() }))} ${esc(L('See the', 'බලන්න:'))} <a href="#/info/refunds">${esc(L('refund and cancellation policy', 'මුදල් ආපසු දීම සහ අවලංගු කිරීමේ ප්‍රතිපත්තිය'))}</a> ${esc(L('and', 'සහ'))} <a href="#/info/terms">${esc(L('terms', 'නියමයන්'))}</a>.</p>
      </div>
      <div class="panel pay-panel" id="pay-panel">${payPanel()}</div>
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

  const trialOk = !store.sub.trialUsed;
  const options = `<div class="pay-opts" role="radiogroup" aria-label="${esc(L('Payment method', 'ගෙවීමේ ක්‍රමය'))}">${c.methods.map(m => `<button type="button" class="pay-opt ${checkout.method === m ? 'on' : ''}" role="radio" aria-checked="${checkout.method === m}" data-act="payTab" data-m="${m}">
      <span class="radio" aria-hidden="true"></span>${icon(METHOD_ICON[m])}<span class="grow"><b>${esc(methodLabel(m))}</b><small>${esc(L(METHOD_NOTE[m][0], METHOD_NOTE[m][1]))}</small></span></button>`).join('')}</div>`;
  const summary = trialOk
    ? `<dl class="pay-sum"><dt>${esc(L('Today', 'අද'))}</dt><dd><b>${esc(L('Free', 'නොමිලේ'))}</b></dd><dt>${esc(L(`From ${fmtDate(Date.now() + 7 * DAY)}`, `${fmtDate(Date.now() + 7 * DAY)} සිට`))}</dt><dd>${esc(priceNow())} ${esc(t('perMonth'))}</dd></dl>`
    : `<dl class="pay-sum"><dt>${esc(L('Today', 'අද'))}</dt><dd><b>${esc(priceNow())}</b></dd><dt>${esc(L('Then every month', 'පසුව සෑම මසකම'))}</dt><dd>${esc(priceNow())} ${esc(t('perMonth'))}</dd></dl>`;
  const goLabel = trialOk ? L('Start 7-day free trial', 'දින 7ක නොමිලේ අත්හදා බැලීම අරඹන්න') : L(`Pay ${priceNow()}`, `${priceNow()} ගෙවන්න`);
  const head = `<h2>${esc(L('How would you like to pay?', 'ඔබ ගෙවීමට කැමති කෙසේද?'))}</h2>${options}`;
  if (checkout.method === 'voucher') {
    return `${head}<form data-form="voucher" class="pay-form">
      <label class="field"><span>${esc(L('Voucher code', 'වවුචර් කේතය'))}</span><input class="input" name="code" required placeholder="NXF-XXXX-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase"><div class="field-hint">${esc(L('Each code works once and adds the time printed on it.', 'එක් කේතයක් එක් වරක් පමණි. එහි සඳහන් කාලය එකතු කරයි.'))}</div></label>
      <div class="form-err" role="alert"></div><button class="btn btn-primary btn-block btn-lg">${esc(t('redeem'))}</button></form>`;
  }
  if (checkout.method === 'dialog') {
    return `${head}<form data-form="dialogStart" class="pay-form">
      <label class="field"><span>${esc(L('Dialog mobile number', 'ඩයලොග් දුරකථන අංකය'))}</span><input class="input" name="phone" type="tel" required pattern="(\\+94|0)7[0-9]{8}" placeholder="07X XXX XXXX" data-nospace></label>
      ${summary}<div class="form-err" role="alert"></div><button class="btn btn-primary btn-block btn-lg">${esc(L('Send confirmation code', 'තහවුරු කේතය යවන්න'))}</button></form>`;
  }
  return `${head}<form data-form="cardStart" class="pay-form">${summary}<button class="btn btn-primary btn-block btn-lg">${esc(goLabel)}</button></form>`;
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
/* Spaces typed in the phone number are removed as the member types. */
document.addEventListener('input', e => { if (e.target.matches('[data-nospace]')) e.target.value = e.target.value.replace(/\s/g, ''); });
FORMS.dialogStart = f => { checkout.phone = f.phone.value; checkout.stage = 'otp'; repaintPay(); };
FORMS.dialogOtp = f => {
  if (f.otp.value !== '123456') { $('.form-err', f).textContent = L('That code isn\'t right. Try 123456.', 'කේතය වැරදියි. 123456 උත්සාහ කරන්න.'); return; }
  verifyThenActivate('dialog');
};
ACTIONS.gwResult = el => {
  const r = el.dataset.r;
  if (r === 'ok') verifyThenActivate('card');
  else {
    if (r === 'failed') rpc('demo_record_failed', { p_method: 'card' }).then(refreshAccount);
    checkout.stage = r; repaintPay();
  }
};

/* Vouchers are checked by the database, which stores only a hash of each code. */
function voucherError(r) {
  if (r.error === 'too_many') return L('Too many attempts. Try again in an hour.', 'උත්සාහයන් වැඩියි. පැයකින් නැවත උත්සාහ කරන්න.');
  if (r.error === 'used') return L('This code has already been used.', 'මෙම කේතය දැනටමත් භාවිත කර ඇත.');
  if (r.error === 'expired') return L('This code has expired.', 'මෙම කේතය කල් ඉකුත් වී ඇත.');
  return L(`That code isn't valid. ${r.left} attempts left.`, `කේතය වලංගු නැත. තවත් උත්සාහ ${r.left}යි.`);
}
async function redeemCode(f) {
  formBusy(f, true);
  const r = await rpc('redeem_voucher', { p_code: f.code.value });
  if (!r) { formBusy(f, false); return false; }
  if (!r.ok) { formBusy(f, false); formErr(f, voucherError(r)); return false; }
  await refreshAccount();
  return r;
}
FORMS.voucher = async f => {
  if (!(await redeemCode(f))) return;
  checkout = { method: null, stage: 'choose' };
  toast(L('Payment confirmed. Enjoy!', 'ගෙවීම තහවුරු විය.'));
  go('#/');
};
async function verifyThenActivate(method) {
  checkout.stage = 'verify'; repaintPay();
  const r = await rpc('demo_start_membership', { p_method: method });
  if (!r || !r.ok) {
    checkout.stage = 'choose'; repaintPay();
    if (r && r.error === 'already') { await refreshAccount(); go('#/account'); }
    return;
  }
  await refreshAccount();
  checkout = { method: null, stage: 'choose' };
  toast(r.trial ? L('Your 7-day free trial has started', 'දින 7ක නොමිලේ අත්හදා බැලීම ආරම්භ විය') : L('Payment confirmed. Enjoy!', 'ගෙවීම තහවුරු විය.'));
  go('#/');
}

/* Account */
const STATUS_PILL = {
  trial: ['ok', ['On free trial', 'නොමිලේ අත්හදා බැලීම']], active: ['ok', ['Active', 'සක්‍රීය']],
  cancelled: ['warn', ['Cancelled', 'අවලංගු කර ඇත']], expired: ['err', ['Ended', 'අවසන් විය']], none: ['', ['No membership', 'සාමාජිකත්වයක් නැත']],
};
const PAY_PILL = { paid: ['ok', ['Paid', 'ගෙවා ඇත']], failed: ['err', ['Failed', 'අසාර්ථකයි']], trial: ['', ['Trial started', 'අත්හදා බැලීම']], pending: ['warn', ['Pending', 'පොරොත්තුවෙන්']] };
const pill = (cfg) => `<span class="pill ${cfg[0]}">${esc(L(cfg[1][0], cfg[1][1]))}</span>`;


const ACCOUNT_TABS = [
  ['membership', ['Membership', 'සාමාජිකත්වය']], ['payments', ['Payment history', 'ගෙවීම් ඉතිහාසය']],
  ['screens', ['Screens in use', 'භාවිතයේ ඇති තිර']], ['language', ['Language & subtitles', 'භාෂාව සහ උපසිරැසි']],
  ['voucher', ['Redeem voucher', 'වවුචරය භාවිත කරන්න']], ['help', ['Help & policies', 'උදව් සහ ප්‍රතිපත්ති']],
];
function payDescription(p) {
  if (p.status === 'trial') return L('Free trial, 7 days', 'නොමිලේ අත්හදා බැලීම, දින 7');
  if (p.method === 'voucher') return L('Voucher, 1 month', 'වවුචරය, මාස 1');
  return L('Standard plan, monthly', 'සම්මත සැලසුම, මාසික');
}
function viewAccount() {
  const u = store.user, s = store.sub;
  const tab = new URLSearchParams(location.hash.split('?')[1] || '').get('tab');
  const cur = ACCOUNT_TABS.some(x => x[0] === tab) ? tab : 'membership';
  const st = STATUS_PILL[s.status] || STATUS_PILL.none;
  const dateLabel = s.status === 'trial' ? L('First payment', 'පළමු ගෙවීම') : s.status === 'cancelled' ? L('Access ends', 'ප්‍රවේශය අවසන් වන්නේ') : s.status === 'expired' ? L('Ended on', 'අවසන් වූයේ') : L('Next payment', 'ඊළඟ ගෙවීම');
  const summaryLine = s.status === 'none' ? L('Choose a plan to start watching.', 'නැරඹීම ඇරඹීමට සැලසුමක් තෝරන්න.')
    : `${dateLabel} ${s.status === 'trial' || s.status === 'active' ? `${priceNow()} ` : ''}${L('on', '')} ${fmtDate(s.periodEnd)} · ${methodLabel(s.method)}`;
  const actions = `${s.status === 'none' || s.status === 'expired' ? `<a class="btn btn-primary btn-sm" href="#/plans">${esc(t('subscribeNow'))}</a>` : ''}
    ${s.status === 'cancelled' ? `<button class="btn btn-primary btn-sm" data-act="restart">${esc(t('restart'))}</button>` : ''}
    ${s.status === 'trial' || s.status === 'active' ? `<button class="btn btn-ghost btn-sm" data-act="askCancel">${esc(t('cancelMembership'))}</button>` : ''}`;
  const sections = {
    membership: () => `<section class="panel"><h2>${esc(t('membership'))}</h2>
      <dl class="kv"><dt>${esc(t('fName'))}</dt><dd>${esc(u.name)}</dd><dt>${esc(t('fEmail'))}</dt><dd>${esc(u.email)}</dd>
        <dt>${esc(L('Member since', 'සාමාජිකත්වය ආරම්භය'))}</dt><dd>${esc(fmtDate(u.since))}</dd>
        <dt>${esc(L('Status', 'තත්ත්වය'))}</dt><dd>${pill(st)}</dd>
        ${s.status !== 'none' ? `<dt>${esc(L('Plan', 'සැලසුම'))}</dt><dd>${esc(t('planName'))}, ${esc(priceNow())} ${esc(t('perMonth'))}</dd>` : ''}
        ${s.status === 'cancelled' && s.cancelReason && CANCEL_REASONS[s.cancelReason] ? `<dt>${esc(L('Reason given', 'ලබා දුන් හේතුව'))}</dt><dd>${esc(L(CANCEL_REASONS[s.cancelReason][0], CANCEL_REASONS[s.cancelReason][1]))}</dd>` : ''}
      </dl></section>`,
    payments: () => `<section class="panel panel-flush"><h2>${esc(t('paymentHistory'))}</h2>
      ${store.payments.length ? `<div class="table-wrap"><table class="tbl tbl-caps"><thead><tr><th>${esc(L('Date', 'දිනය'))}</th><th>${esc(L('Description', 'විස්තරය'))}</th><th>${esc(L('Paid with', 'ගෙවූ ක්‍රමය'))}</th><th>${esc(L('Amount', 'මුදල'))}</th><th>${esc(L('Reference', 'යොමුව'))}</th></tr></thead>
        <tbody>${store.payments.map(p => `<tr><td>${esc(fmtDate(p.date))}</td><td>${esc(payDescription(p))}${p.status === 'failed' || p.status === 'pending' ? ` ${pill(PAY_PILL[p.status])}` : ''}</td><td>${p.status === 'trial' ? '–' : esc(methodLabel(p.method))}</td><td>${p.status === 'trial' ? esc(L('Free', 'නොමිලේ')) : esc(money(p.amount, p.currency))}</td><td class="muted">${esc(p.ref)}</td></tr>`).join('')}</tbody></table></div>`
        : `<p class="muted pad">${esc(L('No payments yet.', 'තවම ගෙවීම් නැත.'))}</p>`}</section>
      <p class="acct-foot">${esc(L('Questions about a payment?', 'ගෙවීමක් ගැන ප්‍රශ්නද?'))} <a class="link" href="#/info/contact">${esc(L('Contact support', 'සහාය අමතන්න'))}</a> ${esc(L('with the reference shown above.', 'ඉහත යොමුව සමඟ.'))}</p>`,
    screens: () => {
      const streamingOthers = store.otherStreams.filter(d => d.streaming).length;
      return `<section class="panel"><h2>${esc(L('Screens in use', 'භාවිතයේ ඇති තිර'))}</h2>
        <p class="muted" style="font-size:14.5px;margin-bottom:6px">${esc(L(`Your plan allows ${STREAM_LIMIT} screens at once. ${streamingOthers} in use on other devices right now.`, `එකවර තිර ${STREAM_LIMIT}ක් සඳහා අවසර ඇත. දැන් වෙනත් උපාංගවල ${streamingOthers}ක් භාවිතයේ.`))}</p>
        <div class="device">${icon('laptop')}<div class="grow"><b>${esc(L('This browser', 'මෙම බ්‍රව්සරය'))}</b><small>${esc(COUNTRIES[store.country].name)}</small></div></div>
        ${store.otherStreams.map(d => `<div class="device">${icon(d.icon)}<div class="grow"><b>${esc(d.name)}</b><small>${esc(d.where)} · ${d.streaming ? esc(L('Streaming now', 'දැන් නරඹමින්')) : esc(L('Idle', 'නිෂ්ක්‍රීය'))}</small></div>
          ${d.streaming ? `<button class="btn btn-ghost btn-sm" data-act="stopStream" data-id="${d.id}">${esc(L('Stop stream', 'නවත්වන්න'))}</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-act="removeDevice" data-id="${d.id}">${esc(t('signOut'))}</button></div>`).join('')}
        <div class="panel-actions"><button class="btn btn-ghost btn-sm" data-act="simStream">${esc(L('Demo: start a stream on another device', 'ආදර්ශනය: වෙනත් උපාංගයක නරඹන්න'))}</button></div></section>`;
    },
    language: () => `<section class="panel"><h2>${esc(L('Language & subtitles', 'භාෂාව සහ උපසිරැසි'))}</h2><div class="pref-row">
      <label class="field"><span>${esc(t('language'))}</span><select class="input" data-change="setLang"><option value="en" ${store.lang === 'en' ? 'selected' : ''}>English</option><option value="si" ${store.lang === 'si' ? 'selected' : ''}>සිංහල</option></select></label>
      <label class="field"><span>${esc(L('Subtitles', 'උපසිරැසි'))}</span><select class="input" data-change="setSubs"><option value="si" ${store.subLang === 'si' ? 'selected' : ''}>සිංහල</option><option value="en" ${store.subLang === 'en' ? 'selected' : ''}>English</option><option value="off" ${store.subLang === 'off' ? 'selected' : ''}>${esc(L('Off', 'අක්‍රිය'))}</option></select></label>
      <label class="field"><span>${esc(L('Video quality', 'වීඩියෝ ගුණත්වය'))}</span><select class="input" data-change="setQuality">${QUALITIES().map(q => `<option value="${q[0]}" ${store.quality === q[0] ? 'selected' : ''}>${esc(q[1])}</option>`).join('')}</select></label>
      <label class="field"><span>${esc(L('Theme', 'තේමාව'))}</span><select class="input" data-change="setTheme"><option value="dark" ${store.theme === 'dark' ? 'selected' : ''}>${esc(t('themeDark'))}</option><option value="light" ${store.theme === 'light' ? 'selected' : ''}>${esc(t('themeLight'))}</option></select></label>
    </div></section>`,
    voucher: () => `<section class="panel"><h2>${esc(t('redeem'))}</h2>
      ${store.country !== 'LK' ? `<p class="muted">${esc(L('Vouchers are for viewers in Sri Lanka.', 'වවුචර් ශ්‍රී ලංකාවේ නරඹන්නන් සඳහා.'))}</p>` : `<form data-form="voucherAcct" style="max-width:420px">
        <label class="field"><span>${esc(L('Voucher code', 'වවුචර් කේතය'))}</span><input class="input" name="code" required placeholder="NXF-XXXX-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase"><div class="field-hint">${esc(L('Each code works once and adds the time printed on it.', 'එක් කේතයක් එක් වරක් පමණි. එහි සඳහන් කාලය එකතු කරයි.'))}</div></label>
        <div class="form-err" role="alert"></div><button class="btn btn-primary">${esc(t('redeem'))}</button></form>`}</section>`,
    help: () => `<section class="panel"><h2>${esc(L('Help & policies', 'උදව් සහ ප්‍රතිපත්ති'))}</h2>
      <ul class="link-list">${[['help', 'ftHelp'], ['contact', 'ftContact'], ['terms', 'ftTerms'], ['privacy', 'ftPrivacy'], ['refunds', 'ftRefund'], ['cookies', 'ftCookies']].map(x => `<li><a href="#/info/${x[0]}">${esc(t(x[1]))}${icon('right')}</a></li>`).join('')}</ul></section>`,
  };
  app().innerHTML = `<div class="page acct-page">
    <aside class="acct-side"><h1 class="page-title">${esc(t('account'))}</h1>
      <nav class="acct-nav" aria-label="${esc(t('account'))}">${ACCOUNT_TABS.map(x => `<a href="#/account?tab=${x[0]}" class="${x[0] === cur ? 'on' : ''}" ${x[0] === cur ? 'aria-current="page"' : ''}>${esc(L(x[1][0], x[1][1]))}</a>`).join('')}</nav></aside>
    <div class="acct-main">
      <section class="acct-summary"><div class="grow"><h2>${s.status === 'none' ? esc(L(st[1][0], st[1][1])) : `${esc(t('planName'))} ${esc(L('plan', 'සැලසුම'))} <span class="st st-${st[0] || 'none'}">· ${esc(L(st[1][0], st[1][1]))}</span>`}</h2><p>${esc(summaryLine)}</p></div><div class="acts">${actions}</div></section>
      ${sections[cur]()}
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
FORMS.cancelSub = async f => {
  formBusy(f, true);
  if (!(await rpc('cancel_membership', { p_reason: f.reason.value }))) { formBusy(f, false); return; }
  await refreshAccount();
  closeModal(); viewAccount();
  toast(L('Membership cancelled', 'සාමාජිකත්වය අවලංගු විය'));
};
ACTIONS.restart = async () => {
  const r = await rpc('restart_membership');
  if (!r) return;
  await refreshAccount();
  if (!r.ok) { go('#/plans'); return; }
  viewAccount(); toast(L('Welcome back', 'ආයුබෝවන්'));
};
ACTIONS.askVoucher = () => {
  if (store.country !== 'LK') { toast(L('Vouchers are for viewers in Sri Lanka', 'වවුචර් ශ්‍රී ලංකාවේ නරඹන්නන් සඳහා')); return; }
  openModal(`<div class="modal-pad"><h2>${esc(t('redeem'))}</h2><form data-form="voucherAcct">
    <label class="field"><span>${esc(t('payVoucher'))}</span><input class="input" name="code" required autocomplete="off" style="text-transform:uppercase"><div class="field-hint">${esc(L('Each code works once and adds the time printed on it.', 'එක් කේතයක් එක් වරක් පමණි. එහි සඳහන් කාලය එකතු කරයි.'))}</div></label>
    <div class="form-err" role="alert"></div><button class="btn btn-primary btn-block">${esc(t('redeem'))}</button></form></div>`, { size: 'sm', label: t('redeem') });
};
FORMS.voucherAcct = async f => {
  const r = await redeemCode(f);
  if (!r) return;
  const m = r.months || 1;
  closeModal(); viewAccount(); toast(L(m === 1 ? 'One month added' : ` months added`, m === 1 ? 'මාසයක් එකතු විය' : `මාස ක් එකතු විය`));
};
