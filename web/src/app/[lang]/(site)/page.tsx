import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSessionUser } from '@/core/auth/session';
import { hasLocale, href, type Locale } from '@/i18n/locales';

/* Placeholder until the home screen (canvas 01-01) is built in week 3. */
export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="page">
      <div className="empty">
        <Suspense fallback={<h2>&nbsp;</h2>}><Greeting lang={lang} /></Suspense>
        <p style={{ marginBottom: 18 }}>{lang === 'si' ? 'මුල් පිටුව සති 3 දී එයි.' : 'The home screen arrives in week 3.'}</p>
        {process.env.NODE_ENV !== 'production' && (
          <Link className="btn btn-primary" href={href(lang, '/dev/ui')}>Open the component gallery</Link>
        )}
      </div>
    </div>
  );
}

/** Signed-out visitors see the welcome page instead (canvas 05-18). */
async function Greeting({ lang }: { lang: Locale }) {
  const user = await getSessionUser();
  if (!user) redirect(href(lang, '/welcome'));
  return <h2>{lang === 'si' ? `ආයුබෝවන්, ${user.name}` : `Welcome back, ${user.name}`}</h2>;
}
