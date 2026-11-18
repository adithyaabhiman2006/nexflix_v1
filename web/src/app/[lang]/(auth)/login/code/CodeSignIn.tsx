'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { sendLoginCodeAction, signInWithCodeAction, type FormState } from '../../actions';
import { CodeField, FormError, Hidden, Submit } from '../../ui';

/** Sign in with a texted code, the "Get a one-time code by SMS" route from canvas 05-19. */
export function CodeSignIn({ lang }: { lang: Locale }) {
  const t = (k: StringKey, v?: Record<string, string>) => translate(lang, k, v);
  const [sent, sendAction] = useActionState<FormState, FormData>(sendLoginCodeAction, {});
  const [checked, checkAction] = useActionState<FormState, FormData>(signInWithCodeAction, {});
  const [restart, setRestart] = useState(0);
  const onCodeStep = sent.step === 'code' && restart === 0;

  return (
    <div className="auth-form">
      <h1>{t('codeTitle')}</h1>
      {!onCodeStep ? (
        <form action={a => { setRestart(0); sendAction(a); }}>
          <p className="auth-intro">{t('codeIntro')}</p>
          <Hidden name="lang" value={lang} />
          <label className="field">
            <span>{t('mobileNumber')}</span>
            <input className="input input-tall" name="phone" type="tel" required autoComplete="tel" placeholder="07X XXX XXXX" defaultValue={sent.values?.phone} key={sent.values?.phone} />
          </label>
          <FormError message={sent.error} />
          <Submit lang={lang}>{t('sendCode')}</Submit>
        </form>
      ) : (
        <form action={checkAction}>
          <p className="auth-intro">{t('codeSentTo', { to: sent.masked ?? '' })}</p>
          <Hidden name="lang" value={lang} />
          <CodeField lang={lang} />
          <label className="check" style={{ marginBottom: 6 }}><input type="checkbox" name="remember" defaultChecked />{t('keepSignedIn')}</label>
          <FormError message={checked.error} />
          <Submit lang={lang}>{t('signIn')}</Submit>
          <button type="button" className="link-btn" onClick={() => setRestart(r => r + 1)}>{t('useDifferentNumber')}</button>
        </form>
      )}
      <div className="or-line"><span>{t('or')}</span></div>
      <Link className="btn btn-ghost btn-block btn-tall" href={href(lang, '/login')}>{t('usePassword')}</Link>
    </div>
  );
}
