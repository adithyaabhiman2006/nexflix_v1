import Link from 'next/link';
import { lang as rootLang } from 'next/root-params';
import { hasLocale, href } from '@/i18n/locales';
import { translate } from '@/i18n/t';

/* Plain version for now; the full "page not found" screen (canvas 10-40) is built in week 7. */
export default async function NotFound() {
  const value = await rootLang();
  const lang = hasLocale(value) ? value : 'en';
  return (
    <div className="page">
      <div className="empty">
        <h2>{translate(lang, 'notFound')}</h2>
        <p style={{ marginBottom: 18 }} />
        <Link className="btn btn-primary" href={href(lang)}>{translate(lang, 'backHome')}</Link>
      </div>
    </div>
  );
}
