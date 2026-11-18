import type { Metadata } from 'next';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { db } from '@/core/db';
import { hasLocale } from '@/i18n/locales';

export const metadata: Metadata = { title: 'Outbox', robots: { index: false } };

/**
 * Development only: every email and text the site has queued, newest first, shown like canvas 10-42.
 * Nothing is really sent until delivery providers are chosen.
 */
export default async function OutboxPage({ params }: PageProps<'/[lang]/dev/outbox'>) {
  const { lang } = await params;
  if (process.env.NODE_ENV === 'production' || !hasLocale(lang)) notFound();
  return (
    <div className="page">
      <h1 className="page-title">Emails and SMS</h1>
      <p className="page-sub">Queued messages, newest first. In development nothing leaves this computer.</p>
      <Suspense fallback={<p className="muted">Loading…</p>}><Messages /></Suspense>
    </div>
  );
}

async function Messages() {
  await connection();
  const rows = await db.outboxMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  if (!rows.length) return <p className="muted">Nothing yet. Ask for a reset link or a sign-in code to see one here.</p>;
  const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <div className="outbox">
      {rows.map(m => m.channel === 'sms' ? (
        <div key={m.id} className="ob-sms">
          <div className="ob-meta">SMS to {m.to} · {m.template} · {time(m.createdAt)}</div>
          <div className="ob-bubble">{m.body}</div>
        </div>
      ) : (
        <div key={m.id} className="ob-mail">
          <div className="ob-head">To: {m.to}<br />Subject: {m.subject}<span className="ob-time">{m.template} · {time(m.createdAt)}</span></div>
          {/* Shown in a sandbox with scripts off, exactly as a mail app would get it. */}
          <iframe title={m.subject ?? 'Email'} srcDoc={m.body} sandbox="allow-popups allow-top-navigation-by-user-activation" />
        </div>
      ))}
    </div>
  );
}
