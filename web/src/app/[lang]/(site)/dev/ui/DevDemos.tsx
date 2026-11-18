'use client';

import { useState } from 'react';
import { CookieBanner } from '@/components/CookieBanner';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import type { Locale } from '@/i18n/locales';
import { translate } from '@/i18n/t';

export function DevDemos({ lang }: { lang: Locale }) {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [cookie, setCookie] = useState(false);
  return (
    <div className="dev-flex">
      <button type="button" className="btn btn-ghost" onClick={() => toast(translate(lang, 'cookieSaved'))}>Show a toast</button>
      <button type="button" className="btn btn-ghost" onClick={() => setModal(true)}>Open a popup</button>
      <button type="button" className="btn btn-ghost" onClick={() => setCookie(c => !c)}>{cookie ? 'Hide' : 'Show'} the cookie card</button>
      <Modal open={modal} onClose={() => setModal(false)} label="Sample popup" closeLabel={translate(lang, 'close')} size="sm">
        <div className="modal-pad">
          <h2>Sample popup</h2>
          <p className="muted">Escape, the close button or a click on the backdrop closes it. Focus returns to the button.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>{translate(lang, 'cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={() => setModal(false)}>{translate(lang, 'save')}</button>
          </div>
        </div>
      </Modal>
      {cookie && <CookieBanner lang={lang} forceOpen />}
    </div>
  );
}
