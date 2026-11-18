/* Line icons copied from the HTML demo (js/core.js), drawn on a 24px grid. */
const PATHS = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  share: '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="m8.4 10.8 7.2-3.6M8.4 13.2l7.2 3.6"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14M3 9.5h5M3 14.5h5M16 9.5h5M16 14.5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3.5 22 20H2z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  home: '<path d="m3 11 9-7 9 7v9h-6v-6H9v6H3z"/>',
  flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2.5-6.5C10 9 11 10 11 11c1-2 1-5 1-8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4.5-7 8-7s7 2 8 7"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  ticket: '<path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 0 0 3V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a1.5 1.5 0 0 0 0-3zM14 7v10" />',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19"/>',
  back10: '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  fwd10: '<path d="M20 12a8 8 0 1 1-2.6-5.9L20 8.5"/><path d="M20 4v4.5h-4.5"/>',
  volume: '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="m16.5 9.5 5 5M21.5 9.5l-5 5"/>',
  subs: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6.5 11h5M13.5 11h4M6.5 15h3M11.5 15h6"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  next: '<path d="M5 4.5v15l10-7.5z" fill="currentColor" stroke="none"/><path d="M18.5 5v14"/>',
  full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
  upload: '<path d="M12 16V5M7 9.5 12 4.5l5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M15 9c-.5-1.2-1.7-1.8-3-1.8-1.8 0-3 .9-3 2.3 0 3.3 6 1.7 6 5 0 1.4-1.2 2.3-3 2.3-1.4 0-2.6-.7-3-1.9M12 5.5v13"/>',
  facebook: '<path d="M14.5 8H17V4.5h-2.5C12 4.5 10.5 6 10.5 8.5V11H8v3.5h2.5V20H14v-5.5h2.5l.5-3.5h-3V8.5c0-.3.2-.5.5-.5z"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><path d="M17 7h.01"/>',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.6 2.2 4.3 5 4.5"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      // The paths are fixed strings in this file, never user input.
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
