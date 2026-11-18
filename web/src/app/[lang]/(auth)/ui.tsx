'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';

/** Logo bar on account screens (canvas 05-19, 09-33), with optional text on the right. */
export function AuthTop({ lang, right }: { lang: Locale; right?: ReactNode }) {
  return (
    <header className="auth-top">
      <Link className="brand" href={href(lang, '/welcome')}><Logo /></Link>
      {right && <div className="auth-top-right">{right}</div>}
    </header>
  );
}

/** Main button that greys out and says "One moment…" while the form is being sent. */
export function Submit({ lang, children, className = 'btn btn-primary btn-block btn-tall' }: { lang: Locale; children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} aria-busy={pending}>
      {pending ? translate(lang, 'working') : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  return <div className="form-err" role="alert" aria-live="assertive">{message}</div>;
}

/** The 6-digit code box. One field so phones can fill it straight from the text message. */
export function CodeField({ lang }: { lang: Locale }) {
  return (
    <label className="field">
      <span>{translate(lang, 'enterCode')}</span>
      <input
        className="input code-input" name="code" required inputMode="numeric" autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}" maxLength={7} placeholder="000000" autoFocus
      />
    </label>
  );
}

export const Hidden = ({ name, value }: { name: string; value: string }) => <input type="hidden" name={name} value={value} />;

/** Placeholder card while a form that needs request data loads. Deliberately not a form, so nobody types into a copy. */
export function CardSkeleton({ wide = false }: { wide?: boolean }) {
  return <section className={`auth-card ${wide ? 'wide' : ''} skeleton`} aria-busy="true"><div /><div /><div /><div /></section>;
}
