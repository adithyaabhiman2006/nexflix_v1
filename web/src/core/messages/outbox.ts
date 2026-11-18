import 'server-only';
import { db } from '../db';
import type { Email } from './templates';

/*
 * Every email and text is written to the outbox table first, then sent by a delivery worker.
 * The worker (and the choice of email and SMS providers) is set up with the host; until then
 * messages stay queued and can be read in development at /en/dev/outbox.
 * Writing first means a provider outage never loses a reset link or a receipt.
 */

export async function queueEmail(to: string, template: string, language: string, email: Email) {
  await db.outboxMessage.create({
    data: { channel: 'email', to, template, language, subject: email.subject, body: email.html, text: email.text },
  });
}

export async function queueSms(to: string, template: string, language: string, text: string) {
  await db.outboxMessage.create({ data: { channel: 'sms', to, template, language, body: text } });
}
