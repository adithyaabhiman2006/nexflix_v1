import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { COUNTRY_COOKIE } from '@/config/consent';
import { PREFILL_COOKIE } from '../prefill';
import { listCountries } from '@/core/countries';
import { readCookie } from '@/core/request';
import { hasLocale, href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import { redirectIfSignedIn } from '../redirect-if-signed-in';
import { AuthTop, CardSkeleton } from '../ui';
import { SignUpForm } from './SignUpForm';

export async function generateMetadata({ params }: PageProps<'/[lang]/signup'>): Promise<Metadata> {
  const { lang } = await params;
  return { title: translate(hasLocale(lang) ? lang : 'en', 'createAccount') };
}

/** Canvas 09-33, "Create your account". */
export default async function SignUpPage({ params }: PageProps<'/[lang]/signup'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const countries = (await listCountries()).map(c => ({ code: c.code, name: lang === 'si' ? c.nameSi : c.nameEn }));
  const right = <>{translate(lang, 'alreadyMember')} <Link className="link-accent" href={href(lang, '/login')}>{translate(lang, 'signIn')}</Link></>;
  return (
    <div className="auth-cards-page">
      <AuthTop lang={lang} right={right} />
      <div className="auth-cards">
        <Suspense fallback={<CardSkeleton wide />}>
          <WithRequest lang={lang} countries={countries} />
        </Suspense>
      </div>
    </div>
  );
}

async function WithRequest({ lang, countries }: { lang: Locale; countries: { code: string; name: string }[] }) {
  await redirectIfSignedIn(lang);
  const fromCookie = (await readCookie(COUNTRY_COOKIE)) ?? '';
  const defaultCountry = countries.some(c => c.code === fromCookie) ? fromCookie : 'LK';
  // What was typed in the welcome page's "Email or phone number" box (kept out of the address bar).
  const prefill = ((await readCookie(PREFILL_COOKIE)) ?? '').slice(0, 254);
  return <SignUpForm lang={lang} countries={countries} defaultCountry={defaultCountry} prefill={prefill} />;
}
