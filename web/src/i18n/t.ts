import { BRAND } from '@/config/brand';
import type { Locale } from './locales';
import { STRINGS, type StringKey } from './strings';

type Vars = Record<string, string | number>;

/** Looks up interface text in the given language. {brand} is filled in automatically. */
export function translate(lang: Locale, key: StringKey, vars?: Vars): string {
  let out: string = STRINGS[key][lang === 'si' ? 1 : 0];
  const all: Vars = { brand: BRAND.name, ...vars };
  for (const k of Object.keys(all)) out = out.split(`{${k}}`).join(String(all[k]));
  return out;
}

/** Binds a language once: const t = translator('si'); t('home'). */
export const translator = (lang: Locale) => (key: StringKey, vars?: Vars) => translate(lang, key, vars);
export type T = ReturnType<typeof translator>;
