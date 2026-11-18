import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CookieBanner } from '@/components/CookieBanner';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { getSessionUser } from '@/core/auth/session';
import { hasLocale, type Locale } from '@/i18n/locales';

/** Pages with the top nav and footer. The player and the admin panel sit outside this group. */
export default async function SiteLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <header id="nav">
        <Suspense fallback={<Nav lang={lang} user={undefined} />}><NavWithSession lang={lang} /></Suspense>
      </header>
      <main id="app" tabIndex={-1}>{children}</main>
      <footer id="footer"><Footer lang={lang} /></footer>
      <CookieBanner lang={lang} />
    </>
  );
}

/** Only the parts the nav needs: never the whole user record. */
async function NavWithSession({ lang }: { lang: Locale }) {
  const u = await getSessionUser();
  return <Nav lang={lang} user={u ? { name: u.name, email: u.email ?? u.phone ?? '', role: u.role } : null} />;
}
