# Nexflix web (Phase 1)

The website, built screen by screen from the approved UI canvas (`../UI images/`), using the HTML demo (`../index.html`) as the visual reference. The name and logo are placeholders: change them in `src/config/brand.ts` and `src/components/Logo.tsx`.

## Run it

```bash
cp .env.example .env        # then set DATABASE_URL
npm install
npm run db:migrate          # creates the tables
npm run db:seed             # countries and categories
npm run dev                 # http://localhost:3000
```

During development:

- `/en/dev/ui` shows every shared part. Add `?country=GB` to any address to act as a UK viewer (shows the cookie card).
- `/en/dev/outbox` shows every email and text the site has queued. Nothing is really sent until email and SMS providers are chosen.

Don't run `npm run build` while `npm run dev` is running: they share the `.next` folder and the dev server starts reloading pages in a loop. If that happens, stop it, delete `.next` and start again.

## Tests

```bash
npm test             # unit tests (phone numbers, passwords, codes)
npm run test:e2e     # every account flow in headless Chrome; needs `npm run dev` running
```

## Layout

| Path | What lives there |
|---|---|
| `src/app/[lang]/` | Pages. The language is in the address: `/en/...` and `/si/...`. |
| `src/app/[lang]/(site)/` | Pages with the nav and footer. The player and admin will sit outside this group. |
| `src/app/api/v1/` | The versioned API. New behaviour goes in a new version. |
| `src/core/` | Money and access rules (payments, subscriptions, territory, stream limits). Only code here may change them. |
| `src/components/` | Shared parts: nav, footer, card, row, popup, toast, cookie card. |
| `src/i18n/strings.ts` | All interface text, English and Sinhala side by side. The Sinhala needs a native-speaker check. |
| `src/styles/demo.css` | The demo's stylesheet, unchanged apart from fonts. |
| `src/styles/canvas.css` | Parts the canvas added on top of the demo. |
| `prisma/` | Database schema, migrations and seed data. |

## Rules

- Change the database only through migrations (`npm run db:migrate -- --name what-changed`). Add fields; never rename or remove one an older app still reads.
- Store money as whole minor units (cents), never as decimals.
- The country cookie set by `src/proxy.ts` is for display only. Licence and payment checks run on the server.
- Settings come from environment variables, never from code.
- Only read cookies in pages with `readCookie()` from `src/core/request.ts`, not `cookies()`. Next.js 16.4 can crash when `cookies()` is read while a page re-renders after a form submission. Form handlers may still use `cookies()` to set and delete cookies.
- Account rules live only in `src/core/auth/service.ts`. Passwords use scrypt; codes and links are stored only as hashes and work once.
