'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from './Icon';

export type Theme = 'dark' | 'light';
export const THEME_COOKIE = 'nx_theme';
const THEME_COLOR: Record<Theme, string> = { dark: '#2C3E3B', light: '#E6EFEC' };

/**
 * Runs before the first paint so a light-theme viewer never sees a dark flash.
 * Keeps the page shell static: the server always sends dark, this corrects it.
 */
export const themeBootScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(dark|light)/);var t=m?m[1]:'dark';var d=document.documentElement;d.dataset.theme=t;var c=document.querySelector('meta[name="theme-color"]');if(c)c.content=t==='dark'?'${THEME_COLOR.dark}':'${THEME_COLOR.light}';}catch(e){}})();`;

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLOR[theme];
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach(l => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => 'dark');
}

export function ThemeToggle({ labels }: { labels: { toLight: string; toDark: string } }) {
  const theme = useTheme();
  return (
    <button
      type="button"
      className="nav-icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? labels.toLight : labels.toDark}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
