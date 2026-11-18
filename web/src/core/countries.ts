import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from './db';

export type CountryRow = { code: string; nameEn: string; nameSi: string; currency: string; monthlyMinor: number; methods: string[] };

/** Countries we sell in, cached; the admin price screen (week 5) refreshes the "countries" tag on save. */
export async function listCountries(): Promise<CountryRow[]> {
  'use cache';
  cacheTag('countries');
  cacheLife('hours');
  return db.country.findMany({
    select: { code: true, nameEn: true, nameSi: true, currency: true, monthlyMinor: true, methods: true },
    orderBy: { nameEn: 'asc' },
  });
}

/** "LKR 299", "GBP 0.99". Minor units in, display text out. */
export function formatPrice(minor: number, currency: string): string {
  const amount = minor / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency, currencyDisplay: 'code',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount).replace(/ /, ' ');
}
