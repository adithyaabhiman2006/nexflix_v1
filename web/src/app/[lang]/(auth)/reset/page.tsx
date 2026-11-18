import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasLocale, href } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import { AuthTop } from '../ui';
import { ResetStart } from './ResetStart';

export async function generateMetadata({ params }: PageProps<'/[lang]/reset'>): Promise<Metadata> {
  const { lang } = await params;
  return { title: translate(hasLocale(lang) ? lang : 'en', 'resetTitle') };
}

export default async function ResetPage({ params }: PageProps<'/[lang]/reset'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const right = <>{translate(lang, 'alreadyMember')} <Link className="link-accent" href={href(lang, '/login')}>{translate(lang, 'signIn')}</Link></>;
  return (
    <div className="auth-cards-page">
      <AuthTop lang={lang} right={right} />
      <div className="auth-cards"><ResetStart lang={lang} /></div>
    </div>
  );
}
