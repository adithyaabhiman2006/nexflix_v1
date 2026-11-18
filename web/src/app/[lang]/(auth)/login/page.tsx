import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SAMPLE_SIGN_IN_ART } from '@/config/sample-art';
import { hasLocale, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import { redirectIfSignedIn } from '../redirect-if-signed-in';
import { AuthTop } from '../ui';
import { SignInForm } from './SignInForm';

export async function generateMetadata({ params }: PageProps<'/[lang]/login'>): Promise<Metadata> {
  const { lang } = await params;
  return { title: translate(hasLocale(lang) ? lang : 'en', 'signIn') };
}

/** Canvas 05-19: artwork on the left, form on the right. */
export default async function SignInPage({ params }: PageProps<'/[lang]/login'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="auth-split">
      <div className="auth-art" aria-hidden="true">
        {SAMPLE_SIGN_IN_ART && <Image src={SAMPLE_SIGN_IN_ART} alt="" fill priority sizes="70vw" />}
      </div>
      <AuthTop lang={lang} />
      <div className="auth-side">
        <SignInForm lang={lang} />
        <Suspense fallback={null}><SignedInGoesHome lang={lang} /></Suspense>
      </div>
    </div>
  );
}

async function SignedInGoesHome({ lang }: { lang: Locale }) {
  await redirectIfSignedIn(lang);
  return null;
}
