import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import localFont from 'next/font/local';
import './globals.css';
import { AppChrome } from '@/components/AppChrome';
import { PwaRegister } from '@/components/PwaRegister';
import { ThemeProvider } from '@/components/dashboard/theme/ThemeProvider';
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner';
import { AnalyticsGate } from '@/components/consent/AnalyticsGate';

// Fuentes autoalojadas (subset latin, variable). Evita que el build dependa de
// fonts.googleapis.com y el fallo intermitente de next/font/google con URLs sin
// extensión: https://github.com/vercel/next.js/issues/99114
const montserrat = localFont({
  src: './fonts/montserrat-latin-var.woff2',
  variable: '--font-display',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

const openSans = localFont({
  src: './fonts/open-sans-latin-var.woff2',
  variable: '--font-sans',
  weight: '300 800',
  style: 'normal',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://toseigusoku.com'),
  title: {
    template: '%s | Tosei Gusoku Dojo',
    default: 'Karate Shito Ryu Inoue Ha en Santo Domingo | Tosei Gusoku Dojo',
  },
  description:
    'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños desde 5 años y adultos. Disciplina, defensa personal, condición física. Primera clase de prueba gratis. Plaza Lulie, Av. 27 de Febrero.',
  keywords: [
    'karate santo domingo',
    'karate niños santo domingo',
    'karate adultos santo domingo',
    'shito ryu',
    'inoue ha',
    'artes marciales república dominicana',
    'defensa personal',
    'dojo karate',
    'clases karate',
    'tosei gusoku',
  ],
  authors: [{ name: 'Tosei Gusoku Dojo' }],
  creator: 'Tosei Gusoku Dojo',
  openGraph: {
    type: 'website',
    locale: 'es_DO',
    url: 'https://toseigusoku.com',
    siteName: 'Tosei Gusoku Dojo',
    title: 'Karate Shito Ryu Inoue Ha en Santo Domingo | Tosei Gusoku Dojo',
    description:
      'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños y adultos. Disciplina, defensa personal y confianza. Primera clase gratis.',
    images: [
      {
        url: '/assets/LogoSolo.svg',
        width: 1200,
        height: 630,
        alt: 'Tosei Gusoku Dojo - Karate Shito Ryu Inoue Ha Santo Domingo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tosei Gusoku Dojo - Karate Shito Ryu Santo Domingo',
    description:
      'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños y adultos. Primera clase gratis.',
    images: ['/assets/LogoSolo.svg'],
  },
  alternates: {
    canonical: 'https://toseigusoku.com',
    languages: {
      'es-DO': 'https://toseigusoku.com',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  applicationName: 'Tosei Gusoku Dojo',
  manifest: '/manifest.webmanifest',
  icons: {
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tosei Gusoku',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning className={`${montserrat.variable} ${openSans.variable} min-h-dvh bg-white text-[#dee2f0] flex flex-col font-sans relative antialiased selection:bg-brand-accent selection:text-gray-700`}>
        <ConsentProvider>
          <ThemeProvider>
            <PwaRegister />
            <AppChrome>
              {children}
            </AppChrome>
          </ThemeProvider>
          {/* Analítica y Meta Pixel solo se cargan tras el consentimiento del usuario. */}
          <AnalyticsGate />
          <CookieConsentBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
