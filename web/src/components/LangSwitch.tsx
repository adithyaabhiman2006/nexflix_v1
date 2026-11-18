'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { switchLocalePath, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';

/** The "සිං | EN" pill from the canvas. The current language is highlighted; tapping goes to the other one. */
export function LangSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname() || `/${lang}`;
  const other: Locale = lang === 'si' ? 'en' : 'si';
  return (
    <Link
      className="lang-pill"
      href={switchLocalePath(pathname, other)}
      hrefLang={other}
      lang={other}
      aria-label={translate(lang, 'switchLanguage')}
      prefetch={false}
      scroll={false}
    >
      <span className={lang === 'si' ? 'on' : ''} lang="si">සිං</span>
      <span className="sep" aria-hidden="true">|</span>
      <span className={lang === 'en' ? 'on' : ''} lang="en">EN</span>
    </Link>
  );
}
