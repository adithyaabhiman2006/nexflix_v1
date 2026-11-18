import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import { themeBootScript } from '@/components/theme';
import { BRAND } from '@/config/brand';
import { hasLocale, LOCALES } from '@/i18n/locales';
import { translate } from '@/i18n/t';
import { fontVars } from '../fonts';
import '@/styles/demo.css';
import '@/styles/canvas.css';

export function generateStaticParams() {
  return LOCALES.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  const si = lang === 'si';
  return {
    title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
    description: si
      ? 'ශ්‍රී ලාංකීය චිත්‍රපට, ටෙලි නාට්‍ය සහ සිංහල හඬකැවූ වැඩසටහන්.'
      : 'Sri Lankan films, teledramas and Sinhala-dubbed entertainment, wherever you are.',
    alternates: { languages: { en: '/en', si: '/si' } },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2C3E3B',
};

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    // The theme script may switch data-theme to light before React loads, so a mismatch here is expected.
    <html lang={lang} data-theme="dark" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a className="skip-link" href="#app">{translate(lang, 'skipToContent')}</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
