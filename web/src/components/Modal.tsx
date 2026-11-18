'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  size?: '' | 'sm';
  children: ReactNode;
};

/** The demo's popup: dark backdrop, Escape or backdrop click closes it, focus returns to where it was. */
export function Modal({ open, onClose, label, closeLabel, size = '', children }: Props) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const returnTo = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab' && dialog.current) {
        // Keeps keyboard focus inside the popup.
        const items = dialog.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (returnTo?.isConnected) returnTo.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialog} className={`modal ${size}`} role="dialog" aria-modal="true" aria-label={label}>
        <button ref={closeBtn} type="button" className="icon-btn modal-x" onClick={onClose} aria-label={closeLabel}>
          <Icon name="x" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
