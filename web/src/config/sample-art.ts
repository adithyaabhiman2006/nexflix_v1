/*
 * Artwork for the welcome wall and the sign-in panel until titles are in the database (week 2)
 * and the home banner is chosen in the admin panel (week 3). Uses the HTML demo's posters, which
 * are only present on a developer's machine; in production these lists are empty and the
 * screens fall back to the brand gradient.
 */
const dev = process.env.NODE_ENV !== 'production';

export const SAMPLE_POSTERS: string[] = dev
  ? ['koombiyo', 'wes', 'sidu', 'ayu', 'neera', 'passport', 'maariya', 'goal'].map(id => `/demo/posters/${id}.jpg`)
  : [];

export const SAMPLE_SIGN_IN_ART: string | null = dev ? '/demo/banners/vijayaba-kollaya.jpg' : null;
