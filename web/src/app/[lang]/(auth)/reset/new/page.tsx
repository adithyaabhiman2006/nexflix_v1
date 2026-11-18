import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { describeResetToken } from '@/core/auth/service';
import { hasLocale, href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import { AuthTop } from '../../ui';
import { NewPasswordForm } from './NewPasswordForm';

export async function generateMetadata({ params }: PageProps<'/[lang]/reset/new'>): Promise<Metadata> {
  const { lang } = await params;
  // The reset token is in this page's address, so it must never be sent on to other sites.
  return { title: translate(hasLocale(lang) ? lang : 'en', 'newPasswordTitle'), referrer: 'no-referrer', robots: { index: false } };
}

export default async function NewPasswordPage({ params, searchParams }: PageProps<'/[lang]/reset/new'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="auth-cards-page">
      <AuthTop lang={lang} />
      <div className="auth-cards">
        <Suspense fallback={<section className="auth-card" aria-busy="true"><p className="kicker">{translate(lang, 'resetStep2')}</p></section>}>
          <Step2 lang={lang} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Step2({ lang, searchParams }: { lang: Locale; searchParams: PageProps<'/[lang]/reset/new'>['searchParams'] }) {
  const { token } = await searchParams;
  const raw = typeof token === 'string' ? token : '';
  const info = await describeResetToken(raw);
  if (!info.ok) {
    return (
      <section className="auth-card">
        <p className="kicker">{translate(lang, 'resetStep2')}</p>
        <h1>{translate(lang, 'linkExpiredTitle')}</h1>
        <p className="auth-intro">{translate(lang, 'linkExpiredBody')}</p>
        <Link className="btn btn-primary btn-block btn-tall" href={href(lang, '/reset')}>{translate(lang, 'askNewLink')}</Link>
      </section>
    );
  }
  return <NewPasswordForm lang={lang} token={raw} masked={info.masked} minutesLeft={info.minutesLeft} />;
}
