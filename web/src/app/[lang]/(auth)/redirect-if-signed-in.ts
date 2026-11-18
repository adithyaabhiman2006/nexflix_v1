import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/core/auth/session';
import { href, type Locale } from '@/i18n/locales';

/** Members who are already signed in skip the sign-in and sign-up screens. */
export async function redirectIfSignedIn(lang: Locale) {
  if (await getSessionUser()) redirect(href(lang));
}

