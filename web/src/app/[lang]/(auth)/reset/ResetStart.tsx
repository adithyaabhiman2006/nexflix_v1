'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { startResetAction, verifyResetCodeAction, type FormState } from '../actions';
import { CodeField, FormError, Hidden, Submit } from '../ui';

/** Canvas 09-33, "Reset password · Step 1". Email gets a link; a mobile number gets a code typed here. */
export function ResetStart({ lang }: { lang: Locale }) {
  const t = (k: StringKey, v?: Record<string, string>) => translate(lang, k, v);
  const [state, action] = useActionState<FormState, FormData>(startResetAction, {});
  const [codeState, codeAction] = useActionState<FormState, FormData>(verifyResetCodeAction, {});
  const [again, setAgain] = useState(false);
  const back = <Link className="link-accent center-link" href={href(lang, '/login')}>{t('backToSignIn')}</Link>;

  if (state.step === 'checkEmail' && !again) {
    return (
      <section className="auth-card">
        <p className="kicker">{t('resetStep1')}</p>
        <h1>{t('checkEmail')}</h1>
        <p className="auth-intro">{t('checkEmailBody', { to: state.masked ?? '' })}</p>
        <button type="button" className="btn btn-ghost btn-block btn-tall" onClick={() => setAgain(true)}>{t('askNewLink')}</button>
        {back}
      </section>
    );
  }

  if (state.step === 'code' && !again) {
    return (
      <section className="auth-card">
        <p className="kicker">{t('resetStep1')}</p>
        <h1>{t('forgotTitle')}</h1>
        <p className="auth-intro">{t('codeSentTo', { to: state.masked ?? '' })}</p>
        <form action={codeAction}>
          <Hidden name="lang" value={lang} />
          <CodeField lang={lang} />
          <FormError message={codeState.error} />
          <Submit lang={lang}>{t('verify')}</Submit>
        </form>
        <button type="button" className="link-btn" onClick={() => setAgain(true)}>{t('useDifferentNumber')}</button>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <p className="kicker">{t('resetStep1')}</p>
      <h1>{t('forgotTitle')}</h1>
      <p className="auth-intro">{t('forgotBody')}</p>
      <form action={a => { setAgain(false); action(a); }}>
        <Hidden name="lang" value={lang} />
        <label className="field">
          <span>{t('emailOrMobile')}</span>
          <input className="input input-tall" name="identifier" required autoComplete="username" defaultValue={state.values?.identifier} key={state.values?.identifier} />
        </label>
        <FormError message={state.error} />
        <Submit lang={lang}>{t('sendResetLink')}</Submit>
      </form>
      {back}
    </section>
  );
}
