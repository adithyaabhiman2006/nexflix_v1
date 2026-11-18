import { Fraunces, Manrope, Noto_Sans_Sinhala, Noto_Serif_Sinhala, Space_Grotesk } from 'next/font/google';

/* Same families as the HTML demo, now self-hosted by Next.js (no request to Google from the viewer). */
export const manrope = Manrope({ subsets: ['latin'], variable: '--ff-manrope', display: 'swap' });
export const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--ff-grotesk', display: 'swap' });
export const fraunces = Fraunces({ subsets: ['latin'], axes: ['opsz'], variable: '--ff-fraunces', display: 'swap', preload: false });
export const sinhala = Noto_Sans_Sinhala({ subsets: ['sinhala'], variable: '--ff-sinhala', display: 'swap' });
export const sinhalaSerif = Noto_Serif_Sinhala({ subsets: ['sinhala'], weight: ['600', '700'], variable: '--ff-sinhala-serif', display: 'swap', preload: false });

export const fontVars = [manrope, grotesk, fraunces, sinhala, sinhalaSerif].map(f => f.variable).join(' ');
