'use client';

import { useEffect, useState } from 'react';
import { CONSENT_COOKIE, CONSENT_COUNTRIES, COUNTRY_COOKIE } from '@/config/consent';
import type { Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import type { StringKey } from '@/i18n/strings';
import { Modal } from './Modal';
import { useToast } from './Toast';

type Choice = 'all' | 'essential';

const readCookie = (name: string) =>
  document.cookie.split('; ').find(c => c.startsWith(`${name}=`))?.split('=')[1] ?? '';

function saveChoice(choice: Choice) {
  document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
}

/**
 * Cookie card from canvas screen 10-39. Shown only to UK and EU/EEA viewers who haven't chosen yet.
 * The country cookie only decides whether to ask; access rules never trust it.
 */
export function CookieBanner({ lang, forceOpen = false }: { lang: Locale; forceOpen?: boolean }) {
  const t = (k: StringKey) => translate(lang, k);
  const toast = useToast();
  const [show, setShow] = useState(forceOpen);
  const [choosing, setChoosing] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (forceOpen) return;
    // Cookies are only readable in the browser, so this check has to run after the first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(CONSENT_COUNTRIES.has(readCookie(COUNTRY_COOKIE)) && !readCookie(CONSENT_COOKIE));
  }, [forceOpen]);

  const decide = (choice: Choice) => {
    saveChoice(choice);
    setChoosing(false);
    setShow(false);
    toast(t('cookieSaved'));
  };

  if (!show) return null;
  return (
    <>
      <div className="cookie-card" role="region" aria-label={t('cookieTitle')}>
        <h2>{t('cookieTitle')}</h2>
        <p>{t('cookieMsg')}</p>
        <div className="acts">
          <button type="button" className="btn btn-primary" onClick={() => decide('all')}>{t('cookieAccept')}</button>
          <button type="button" className="btn btn-secondary" onClick={() => decide('essential')}>{t('cookieEssential')}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setChoosing(true)}>{t('cookieChoose')}</button>
        </div>
      </div>
      <Modal open={choosing} onClose={() => setChoosing(false)} label={t('cookieChooseTitle')} closeLabel={t('close')} size="sm">
        <div className="modal-pad">
          <h2>{t('cookieChooseTitle')}</h2>
          <label className="consent-row">
            <input type="checkbox" checked disabled />
            <span><b>{t('cookieEssentialName')}</b>{t('cookieEssentialBody')}</span>
          </label>
          <label className="consent-row">
            <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} />
            <span><b>{t('cookieAnalyticsName')}</b>{t('cookieAnalyticsBody')}</span>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => decide(analytics ? 'all' : 'essential')}>{t('save')}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
