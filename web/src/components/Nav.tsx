'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { href, type Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { signOutAction } from '@/app/[lang]/(auth)/actions';
import { Icon, type IconName } from './Icon';
import { LangSwitch } from './LangSwitch';
import { Logo } from './Logo';
import { ThemeToggle } from './theme';

export type NavUser = { name: string; email: string; role: 'viewer' | 'admin' };

/* Links as on canvas screen 01-01. */
const LINKS: { path: string; key: StringKey; icon: IconName }[] = [
  { path: '/', key: 'home', icon: 'home' },
  { path: '/browse/cinema', key: 'catCinema', icon: 'film' },
  { path: '/browse/teledrama', key: 'catTeledrama', icon: 'tv' },
  { path: '/new', key: 'newComing', icon: 'flame' },
];

/** Pages whose banner sits under a see-through nav. Everywhere else the nav is solid from the start. */
const CLEAR_TOP = /^\/(en|si)(\/(welcome|browse\/[^/]+))?\/?$/;

/** `user` undefined means the session is still loading: show only the logo and switches, so nothing flickers. */
export function Nav({ lang, user }: { lang: Locale; user: NavUser | null | undefined }) {
  const t = (k: StringKey) => translate(lang, k);
  const pathname = usePathname() || `/${lang}`;
  const [scrolled, setScrolled] = useState(false);
  const solid = scrolled || !CLEAR_TOP.test(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('has-tabs', !!user);
    return () => document.body.classList.remove('has-tabs');
  }, [user]);

  const isOn = (path: string) => pathname === href(lang, path);
  const theme = <ThemeToggle labels={{ toLight: t('themeLight'), toDark: t('themeDark') }} />;

  if (user === undefined) {
    return (
      <nav className={`nav ${solid ? 'solid' : ''}`} aria-label={t('mainNav')}>
        <Link className="brand" href={href(lang)}><Logo /></Link>
        <div className="nav-right"><LangSwitch lang={lang} />{theme}</div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className={`nav ${solid ? 'solid' : ''}`} aria-label={t('mainNav')}>
        <Link className="brand" href={href(lang, '/welcome')}><Logo /></Link>
        <div className="nav-right">
          <LangSwitch lang={lang} />
          {theme}
          <Link className="btn btn-secondary btn-sm" href={href(lang, '/login')}>{t('signIn')}</Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={`nav ${solid ? 'solid' : ''}`} aria-label={t('mainNav')}>
        <Link className="brand" href={href(lang)}><Logo /></Link>
        <div className="nav-links">
          {LINKS.map(l => (
            <Link key={l.path} href={href(lang, l.path)} className={isOn(l.path) ? 'on' : ''} aria-current={isOn(l.path) ? 'page' : undefined}>
              {t(l.key)}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          <SearchBox lang={lang} />
          <LangSwitch lang={lang} />
          {theme}
          <UserMenu lang={lang} user={user} />
        </div>
      </nav>
      <nav className="mobile-tabs" aria-label={t('sections')}>
        {LINKS.map(l => (
          <Link key={l.path} href={href(lang, l.path)} className={isOn(l.path) ? 'on' : ''} aria-current={isOn(l.path) ? 'page' : undefined}>
            <Icon name={l.icon} />{l.key === 'newComing' ? t('newShort') : t(l.key)}
          </Link>
        ))}
        <Link href={href(lang, '/account')} className={isOn('/account') ? 'on' : ''}>
          <Icon name="user" />{t('account')}
        </Link>
      </nav>
    </>
  );
}

function SearchBox({ lang }: { lang: Locale }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className={`search-box ${q ? 'open' : ''}`}
      onSubmit={e => {
        e.preventDefault();
        if (q.trim()) router.push(`${href(lang, '/search')}?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label className="sr" htmlFor="search-input">{translate(lang, 'search')}</label>
      <Icon name="search" />
      <input id="search-input" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={translate(lang, 'searchPh')} />
    </form>
  );
}

function UserMenu({ lang, user }: { lang: Locale; user: NavUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const t = (k: StringKey) => translate(lang, k);
  return (
    <div className="menu" ref={ref}>
      <button type="button" className="avatar" aria-haspopup="true" aria-expanded={open} aria-label={t('account')} onClick={() => setOpen(o => !o)}>
        {user.name.charAt(0).toUpperCase()}
      </button>
      <div className="menu-pop" hidden={!open} onClick={e => { if ((e.target as Element).closest('a')) setOpen(false); }}>
        <div className="menu-who"><b>{user.name}</b>{user.email}</div>
        <Link href={href(lang, '/account')}><Icon name="user" />{t('account')}</Link>
        {user.role === 'admin' && <Link href={href(lang, '/admin')}><Icon name="grid" />{t('adminPanel')}</Link>}
        <form action={signOutAction}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit"><Icon name="back" />{t('signOut')}</button>
        </form>
      </div>
    </div>
  );
}
