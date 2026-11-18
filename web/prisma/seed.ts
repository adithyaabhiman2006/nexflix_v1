/* Starting data, carried over from the HTML demo (js/data.js). Prices are [PLACEHOLDERS] until management sets them. */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const countries = [
  { code: 'LK', nameEn: 'Sri Lanka', nameSi: 'ශ්‍රී ලංකාව', currency: 'LKR', monthlyMinor: 29900, methods: ['card', 'voucher', 'dialog'] },
  { code: 'GB', nameEn: 'United Kingdom', nameSi: 'එක්සත් රාජධානිය', currency: 'GBP', monthlyMinor: 99, methods: ['card'], needsConsent: true },
  { code: 'AU', nameEn: 'Australia', nameSi: 'ඕස්ට්‍රේලියාව', currency: 'AUD', monthlyMinor: 149, methods: ['card'] },
  { code: 'AE', nameEn: 'United Arab Emirates', nameSi: 'එක්සත් අරාබි එමීර් රාජ්‍යය', currency: 'USD', monthlyMinor: 149, methods: ['card'] },
  { code: 'CA', nameEn: 'Canada', nameSi: 'කැනඩාව', currency: 'USD', monthlyMinor: 100, methods: ['card'] },
  { code: 'US', nameEn: 'United States', nameSi: 'ඇමරිකා එක්සත් ජනපදය', currency: 'USD', monthlyMinor: 100, methods: ['card'] },
];

const categories = [
  { key: 'cinema', nameEn: 'Cinema', nameSi: 'සිනමා', sortOrder: 1 },
  { key: 'teledrama', nameEn: 'Teledramas', nameSi: 'ටෙලි නාට්‍ය', sortOrder: 2 },
  { key: 'dubbed', nameEn: 'Sinhala Dubbed', nameSi: 'සිංහල හඬකැවූ', sortOrder: 3 },
  { key: 'programme', nameEn: 'Programmes', nameSi: 'වැඩසටහන්', sortOrder: 4 },
];

async function main() {
  for (const c of countries) {
    await prisma.country.upsert({ where: { code: c.code }, update: c, create: c });
  }
  for (const c of categories) {
    await prisma.category.upsert({ where: { key: c.key }, update: c, create: c });
  }
  console.log(`Seeded ${countries.length} countries and ${categories.length} categories.`);
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
