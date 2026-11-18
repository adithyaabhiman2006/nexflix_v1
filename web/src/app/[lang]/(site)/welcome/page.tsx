import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { COUNTRY_COOKIE } from '@/config/consent';
import { SAMPLE_POSTERS } from '@/config/sample-art';
import { formatPrice, listCountries } from '@/core/countries';
import { readCookie } from '@/core/request';
import { hasLocale, type Locale } from '@/i18n/locales';
import { translate, translator } from '@/i18n/t';
import { redirectIfSignedIn } from '../../(auth)/redirect-if-signed-in';
import { startTrialAction } from '../../(auth)/actions';

export async function generateMetadata({ params }: PageProps<'/[lang]/welcome'>): Promise<Metadata> {
  const { lang } = await params;
  return { title: { absolute: translate(hasLocale(lang) ? lang : 'en', 'heroTitle') } };
}

/** Canvas 05-18, the signed-out landing page. */
export default async function WelcomePage({ params }: PageProps<'/[lang]/welcome'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = translator(lang);
  const wall = SAMPLE_POSTERS.length ? Array.from({ length: 36 }, (_, i) => SAMPLE_POSTERS[i % SAMPLE_POSTERS.length]) : [];

  return (
    <>
      <Suspense fallback={null}><SignedInGoesHome lang={lang} /></Suspense>
      <section className="landing-hero welcome-hero">
        {wall.length > 0 && (
          <div className="mosaic" aria-hidden="true">
            {wall.map((src, i) => <div key={i} style={{ position: 'relative' }}><Image className="art" src={src} alt="" fill sizes="12vw" priority={i < 9} /></div>)}
          </div>
        )}
        <div className="landing-copy">
          <h1>{t('heroTitle')}</h1>
          <p className="lead other-lang" lang={lang === 'si' ? 'en' : 'si'}>{t('welcomeSi')}</p>
          <p className="price">
            <Suspense fallback={<span className="price-wait">&nbsp;</span>}><PriceLine lang={lang} /></Suspense>
          </p>
          <form className="signup-inline" action={startTrialAction}>
            <input type="hidden" name="lang" value={lang} />
            <label className="sr" htmlFor="welcome-id">{t('emailOrPhone')}</label>
            <input className="input input-tall" id="welcome-id" name="identifier" autoComplete="username" placeholder={t('emailOrPhone')} />
            <button className="btn btn-primary btn-tall">{t('startTrial')}</button>
          </form>
        </div>
      </section>
      <section className="feature-grid welcome-features">
        <div className="feature"><h3>{t('feat1')}</h3><p>{t('feat1b')}</p></div>
        <div className="feature"><h3>{t('feat2')}</h3><p>{t('feat2b')}</p></div>
        <div className="feature"><h3>{t('feat3')}</h3><p>{t('feat3b')}</p></div>
      </section>
      <Faq lang={lang} />
    </>
  );
}

async function SignedInGoesHome({ lang }: { lang: Locale }) {
  await redirectIfSignedIn(lang);
  return null;
}

/** "7 days free, then LKR 299 a month." in the viewer's country price. */
async function PriceLine({ lang }: { lang: Locale }) {
  const code = await readCookie(COUNTRY_COOKIE);
  const countries = await listCountries();
  const c = countries.find(x => x.code === code) ?? countries.find(x => x.code === 'US') ?? countries[0];
  return <>{translate(lang, 'heroPrice', { price: c ? formatPrice(c.monthlyMinor, c.currency) : '[PRICE]' })}</>;
}

/* From the HTML demo's landing page. */
function Faq({ lang }: { lang: Locale }) {
  const si = lang === 'si';
  const faqs: [string, string][] = si
    ? [
        ['මෙය කුමක්ද?', 'ශ්‍රී ලාංකේය චිත්‍රපට, ටෙලි නාට්‍ය සහ සිංහල හඬකැවූ වැඩසටහන් සඳහා දායක සේවාවකි.'],
        ['ගෙවන්නේ කෙසේද?', 'සෑම තැනම කාඩ්පතකින්. ශ්‍රී ලංකාවේ වවුචර් හෝ ඩයලොග් බිල්පතෙන් ද ගෙවිය හැක.'],
        ['අවලංගු කළ හැකිද?', 'ඔව්, ගිණුම් පිටුවෙන් ඕනෑම විටෙක. ගෙවූ කාලය අවසන් වන තුරු නැරඹිය හැක.'],
        ['මගේ රටේ සියල්ල තිබේද?', 'සෑම මාතෘකාවක්ම රට අනුව බලපත්‍ර ලබා ඇති නිසා නාමාවලිය රට අනුව වෙනස් වේ.'],
      ]
    : [
        ['What is this?', 'A subscription service for Sri Lankan films, teledramas and Sinhala-dubbed entertainment, for viewers in Sri Lanka, Sri Lankans abroad and anyone interested in Sri Lanka.'],
        ['How can I pay?', 'By debit or credit card everywhere. In Sri Lanka you can also use voucher codes or Dialog billing.'],
        ['Can I cancel?', 'Yes, any time from your account page. You keep access until the end of the period you paid for.'],
        ['Is everything available in my country?', 'Each title is licensed country by country, so the catalogue changes with where you are watching from.'],
      ];
  return (
    <section className="faq">
      <h2>{translate(lang, 'faqTitle')}</h2>
      {faqs.map(([q, a]) => (
        <details className="q" key={q}><summary>{q}</summary><p>{a}</p></details>
      ))}
    </section>
  );
}
