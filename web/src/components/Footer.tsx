import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { href, type Locale } from '@/i18n/locales';
import { translator } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { Icon } from './Icon';
import { LangSwitch } from './LangSwitch';
import { Logo } from './Logo';

/* Columns as on canvas screen 10-39. */
const GROUPS: { title: StringKey | 'brand'; links: [string, StringKey][] }[] = [
  { title: 'brand', links: [['/about', 'ftAbout'], ['/help', 'ftHelp'], ['/contact', 'ftContact']] },
  { title: 'ftGroupPolicies', links: [['/legal/terms', 'ftTerms'], ['/legal/privacy', 'ftPrivacy'], ['/legal/cookies', 'ftCookies'], ['/legal/refunds', 'ftRefund']] },
  { title: 'ftGroupContent', links: [['/legal/copyright', 'ftCopyright'], ['/legal/ratings', 'ftRatings']] },
];

const SOCIAL = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
] as const;

/** The copyright year, rebuilt daily so it rolls over on 1 January without a release. */
async function currentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

export async function Footer({ lang }: { lang: Locale }) {
  const t = translator(lang);
  const year = await currentYear();
  const socials = SOCIAL.filter(([k]) => BRAND.social[k]);
  return (
    <div className="site-footer ft">
      <div className="ft-grid">
        <div className="ft-brand">
          <Link className="brand" href={href(lang)}><Logo size="sm" /></Link>
          <p>{t('ftSupport', { email: BRAND.supportEmail, phone: BRAND.whatsapp })}</p>
          <p>{t('ftHours')}</p>
        </div>
        {GROUPS.map(g => (
          <div key={g.title} className="ft-col">
            <h2 className="ft-head">{g.title === 'brand' ? BRAND.name : t(g.title)}</h2>
            <ul>
              {g.links.map(([path, key]) => (
                <li key={path}><Link href={href(lang, path)}>{t(key)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="ft-bottom">
        <p className="ft-legal">© {year} {BRAND.legalName} · {BRAND.registeredAddress}</p>
        <div className="ft-right">
          <span className="ft-pay" aria-label={t('paymentMethods')}>{t('ftPaymentLogos')}</span>
          {socials.length > 0 && (
            <div className="footer-socials" aria-label={t('socialLinks')}>
              {socials.map(([k, label]) => (
                <a key={k} href={BRAND.social[k]} aria-label={label} rel="noopener" target="_blank"><Icon name={k} /></a>
              ))}
            </div>
          )}
          <LangSwitch lang={lang} />
        </div>
      </div>
    </div>
  );
}
