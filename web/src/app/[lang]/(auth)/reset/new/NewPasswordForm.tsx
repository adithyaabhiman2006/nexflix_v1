'use client';

import { useActionState } from 'react';
import type { Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { completeResetAction, type FormState } from '../../actions';
import { FormError, Hidden, Submit } from '../../ui';

/** Canvas 09-33, "Reset password · Step 2". */
export function NewPasswordForm({ lang, token, masked, minutesLeft }: { lang: Locale; token: string; masked: string; minutesLeft: number }) {
  const t = (k: StringKey, v?: Record<string, string | number>) => translate(lang, k, v);
  const [state, action] = useActionState<FormState, FormData>(completeResetAction, {});
  return (
    <section className="auth-card">
      <p className="kicker">{t('resetStep2')}</p>
      <h1>{t('newPasswordTitle')}</h1>
      <p className="auth-intro">{t('linkSentTo', { to: masked, n: minutesLeft })}</p>
      <form action={action}>
        <Hidden name="lang" value={lang} />
        <Hidden name="token" value={token} />
        <label className="field">
          <span>{t('newPassword')}</span>
          <input className="input input-tall" name="password" type="password" required minLength={8} autoComplete="new-password" aria-describedby="np-hint" />
          <div className="field-hint" id="np-hint">{t('passwordHint')}</div>
        </label>
        <label className="field">
          <span>{t('typeAgain')}</span>
          <input className="input input-tall" name="again" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label className="check"><input type="checkbox" name="others" defaultChecked />{t('signOutOthers')}</label>
        <FormError message={state.error} />
        <Submit lang={lang}>{t('saveAndSignIn')}</Submit>
      </form>
    </section>
  );
}
