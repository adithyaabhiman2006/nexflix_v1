import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Nav } from '@/components/Nav';
import { Row } from '@/components/Row';
import { hasLocale } from '@/i18n/locales';
import { translator } from '@/i18n/t';
import { DevDemos } from './DevDemos';

export const metadata: Metadata = { title: 'Component gallery', robots: { index: false } };

const P = (id: string) => `/demo/posters/${id}.jpg`;
const ICONS: IconName[] = ['play', 'info', 'search', 'sun', 'moon', 'x', 'left', 'right', 'check', 'plus', 'share', 'film', 'tv', 'home', 'flame', 'user', 'card', 'ticket', 'phone', 'globe', 'subs', 'volume', 'mute', 'full', 'grid', 'link', 'upload'];

/** Every shared part on one page, in the current language and theme, to compare with the canvas. Development only. */
export default async function DevGallery({ params }: PageProps<'/[lang]/dev/ui'>) {
  const { lang } = await params;
  if (process.env.NODE_ENV === 'production' || !hasLocale(lang)) notFound();
  const t = translator(lang);
  const rowLabels = { left: t('scrollLeft'), right: t('scrollRight') };

  return (
    <div style={{ paddingTop: 68 }}>
      <section className="dev-sec">
        <h2>Navigation</h2>
        <p>Signed out (canvas 05-18) and signed in (canvas 01-01). Switch language with the pill and theme with the sun.</p>
        <div className="dev-frame"><Nav lang={lang} user={null} /></div>
        <div className="dev-frame"><Nav lang={lang} user={{ name: 'Kasun Perera', email: 'kasun@example.com', role: 'admin' }} /></div>
      </section>

      <section className="dev-sec">
        <h2>Buttons and labels</h2>
        <p>From the demo stylesheet.</p>
        <div className="dev-flex" style={{ marginBottom: 12 }}>
          <a className="btn btn-primary btn-lg" href="#"><Icon name="play" />{t('play')}</a>
          <a className="btn btn-secondary btn-lg" href="#"><Icon name="info" />{t('moreInfo')}</a>
          <button type="button" className="icon-btn" aria-label="Add"><Icon name="plus" /></button>
          <button type="button" className="btn btn-primary">{t('startTrial')}</button>
          <button type="button" className="btn btn-secondary">{t('cookieEssential')}</button>
          <button type="button" className="btn btn-ghost">{t('cookieChoose')}</button>
          <button type="button" className="btn btn-danger">{t('cancel')}</button>
          <button type="button" className="btn btn-primary" disabled>{t('save')}</button>
        </div>
        <div className="dev-flex">
          <span className="pill">PG</span><span className="pill new">{t('newShort')}</span>
          <span className="pill ok">Active</span><span className="pill warn">Pending</span><span className="pill err">Failed</span>
        </div>
      </section>

      <section className="dev-sec">
        <h2>Form fields</h2>
        <p>Sign-in fields (built properly in week 1).</p>
        <div style={{ maxWidth: 420 }}>
          <label className="field"><span>{t('fEmail')}</span><input className="input" type="email" placeholder={t('emailOrPhonePh')} /></label>
          <label className="field"><span>{t('fPassword')}</span><input className="input" type="password" /><div className="field-hint">At least 8 characters</div></label>
        </div>
      </section>

      <section className="dev-sec" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div style={{ padding: '0 var(--gutter)' }}>
          <h2 style={{ font: '700 20px var(--display)' }}>Rows and cards</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>Landscape with progress (Continue watching), portrait posters with tags, and a title with no artwork.</p>
        </div>
        <Row title={t('rowContinue')} labels={rowLabels}>
          <Card href="#" title="Thaala" art={{ src: P('thaala-wide'), shape: 'wide' }} progress={{ share: .45, label: t('left', { n: 48 }) }} />
          <Card href="#" title="Neera" art={{ src: P('neera-wide'), shape: 'wide' }} progress={{ share: .2, label: t('left', { n: 70 }) }} />
          <Card href="#" title="Gajaman" art={{ src: P('gajaman'), shape: 'wide' }} progress={{ share: .7, label: t('left', { n: 22 }) }} />
          <Card href="#" title="Siri Sirimal" art={{ src: P('siri-sirimal'), shape: 'wide' }} progress={{ share: .3, label: `S1:E4 · ${t('left', { n: 12 })}` }} />
          <Card href="#" title="Kolamba Rathriya" art={null} progress={{ share: .5, label: t('left', { n: 30 }) }} />
        </Row>
        <Row title={t('catCinema')} labels={rowLabels}>
          {['ayu', 'maariya', 'passport', 'goal', 'koombiyo', 'wes', 'sidu'].map((id, i) => (
            <Card key={id} href="#" title={id} art={{ src: P(id), shape: 'tall' }} tag={i < 2 ? t('newShort') : undefined} />
          ))}
          <Card href="#" title="Coming soon" art={{ src: P('neera'), shape: 'tall' }} tag="21 Nov" tagStyle="soon" />
        </Row>
      </section>

      <section className="dev-sec">
        <h2>Icons</h2>
        <p>Same line icons as the demo.</p>
        <div className="dev-flex" style={{ fontSize: 22 }}>
          {ICONS.map(n => <span key={n} title={n}><Icon name={n} /></span>)}
        </div>
      </section>

      <section className="dev-sec">
        <h2>Popup, toast and cookie card</h2>
        <p>The cookie card shows on its own only to UK and EU viewers. Add ?country=GB to any page to test it.</p>
        <DevDemos lang={lang} />
      </section>
    </div>
  );
}
