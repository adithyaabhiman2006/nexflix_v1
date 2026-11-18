'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { signInAction, type FormState } from '../actions';
import { FormError, Hidden, Submit } from '../ui';

/** Canvas 05-19. */
export function SignInForm({ lang }: { lang: Locale }) {
  const t = (k: StringKey) => translate(lang, k);
  const [state, action] = useActionState<FormState, FormData>(signInAction, {});
  const codeHref = href(lang, '/login/code');
  return (
    <div className="auth-form">
      <h1>{t('signIn')}</h1>
      <form action={action}>
        <Hidden name="lang" value={lang} />
        <label className="field">
          <span>{t('emailOrPhone')}</span>
          <input className="input input-tall" name="identifier" required autoComplete="username" defaultValue={state.values?.identifier} key={state.values?.identifier} />
        </label>
        <label className="field">
          <span>{t('fPassword')}</span>
          <input className="input input-tall" name="password" type="password" required autoComplete="current-password" />
        </label>
        <div className="auth-row">
          <label className="check"><input type="checkbox" name="remember" defaultChecked />{t('keepSignedIn')}</label>
          <Link className="link-accent" href={href(lang, '/reset')}>{t('forgotShort')}</Link>
        </div>
        <FormError message={state.error} />
        <Submit lang={lang}>{t('signIn')}</Submit>
      </form>
      <div className="or-line"><span>{t('or')}</span></div>
      <Link className="btn btn-ghost btn-block btn-tall" href={codeHref}>{t('getSmsCode')}</Link>
      <p className="auth-foot">{t('newHereTrial')} <Link className="link-accent" href={href(lang, '/signup')}>{t('startTrialLink')}</Link></p>
    </div>
  );
}
