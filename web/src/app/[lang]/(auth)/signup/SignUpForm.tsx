'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { confirmSignUpAction, signUpAction, type FormState } from '../actions';
import { CodeField, FormError, Hidden, Submit } from '../ui';

type Country = { code: string; name: string };

/** Canvas 09-33, first card. A mobile number gets a texted code before the account is made. */
export function SignUpForm({ lang, countries, defaultCountry, prefill }: { lang: Locale; countries: Country[]; defaultCountry: string; prefill: string }) {
  const t = (k: StringKey, v?: Record<string, string>) => translate(lang, k, v);
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});
  const [confirm, confirmAction] = useActionState<FormState, FormData>(confirmSignUpAction, {});
  const [editing, setEditing] = useState(false);
  const v = state.values ?? {};

  if (state.step === 'code' && !editing) {
    return (
      <section className="auth-card wide">
        <p className="kicker">{t('newAccount')}</p>
        <h1>{t('confirmNumber')}</h1>
        <p className="auth-intro">{t('confirmNumberBody', { to: state.masked ?? '' })}</p>
        <form action={confirmAction}>
          <Hidden name="lang" value={lang} />
          <CodeField lang={lang} />
          <FormError message={confirm.error} />
          <Submit lang={lang}>{t('continueToPlans')}</Submit>
          <button type="button" className="link-btn" onClick={() => setEditing(true)}>{t('useDifferentNumber')}</button>
        </form>
      </section>
    );
  }

  const terms = (
    <Link className="link-accent" href={href(lang, '/legal/terms')} target="_blank">{t('termsLink')}</Link>
  );
  const privacy = (
    <Link className="link-accent" href={href(lang, '/legal/privacy')} target="_blank">{t('privacyLink')}</Link>
  );
  const [before, middle, after] = splitAround(t('agreeTerms'), '{terms}', '{privacy}');

  return (
    <section className="auth-card wide">
      <p className="kicker">{t('newAccount')}</p>
      <h1>{t('createAccount')}</h1>
      <p className="auth-intro">{t('trialLine')}</p>
      <form action={a => { setEditing(false); action(a); }}>
        <Hidden name="lang" value={lang} />
        <label className="field">
          <span>{t('emailOrMobile')}</span>
          <input className="input input-tall" name="identifier" required autoComplete="username" placeholder={t('emailOrMobilePh')} defaultValue={v.identifier ?? prefill} key={`id-${v.identifier ?? prefill}`} />
        </label>
        <label className="field">
          <span>{t('createPassword')}</span>
          <input className="input input-tall" name="password" type="password" required minLength={8} autoComplete="new-password" aria-describedby="pw-hint" />
          <div className="field-hint ok" id="pw-hint">{t('passwordHint')}</div>
        </label>
        <label className="field">
          <span>{t('country')}</span>
          <select className="input input-tall" name="country" defaultValue={v.country ?? defaultCountry} key={`c-${v.country ?? defaultCountry}`}>
            {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('language')}</span>
          <select className="input input-tall" name="language" defaultValue={v.language ?? lang} key={`l-${v.language ?? lang}`}>
            <option value="en">English</option>
            <option value="si">සිංහල</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" name="terms" required />
          <span>{before}{terms}{middle}{privacy}{after}</span>
        </label>
        <label className="check" style={{ marginTop: 10 }}><input type="checkbox" name="news" defaultChecked={v.news === 'on'} />{t('newsOptIn')}</label>
        <FormError message={state.error} />
        <Submit lang={lang}>{t('continueToPlans')}</Submit>
      </form>
    </section>
  );
}

/** Splits "I agree to the {terms} and {privacy}." so the two links can sit inside the sentence in either language. */
function splitAround(text: string, a: string, b: string): [string, string, string] {
  const i = text.indexOf(a), j = text.indexOf(b);
  return [text.slice(0, i), text.slice(i + a.length, j), text.slice(j + b.length)];
}
