import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SAMPLE_SIGN_IN_ART } from '@/config/sample-art';
import { hasLocale, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import { redirectIfSignedIn } from '../../redirect-if-signed-in';
import { AuthTop } from '../../ui';
import { CodeSignIn } from './CodeSignIn';

export async function generateMetadata({ params }: PageProps<'/[lang]/login/code'>): Promise<Metadata> {
  const { lang } = await params;
  return { title: translate(hasLocale(lang) ? lang : 'en', 'codeTitle') };
}

export default async function CodeSignInPage({ params }: PageProps<'/[lang]/login/code'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="auth-split">
      <div className="auth-art" aria-hidden="true">{SAMPLE_SIGN_IN_ART && <Image src={SAMPLE_SIGN_IN_ART} alt="" fill priority sizes="70vw" />}</div>
      <AuthTop lang={lang} />
      <div className="auth-side">
        <CodeSignIn lang={lang} />
        <Suspense fallback={null}><SignedInGoesHome lang={lang} /></Suspense>
      </div>
    </div>
  );
}

async function SignedInGoesHome({ lang }: { lang: Locale }) {
  await redirectIfSignedIn(lang);
  return null;
}
