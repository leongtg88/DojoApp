import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import { MetaPixel } from '@adkit/meta-pixel-next';
import { AppChrome } from '@/components/AppChrome';
import { PwaRegister } from '@/components/PwaRegister';
import { ThemeProvider } from '@/components/dashboard/theme/ThemeProvider';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
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
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;if(p!=='/'&&!p.startsWith('/dashboard')){document.documentElement.removeAttribute('data-theme');return}var t=localStorage.getItem('tgd-dashboard-theme');var d=document.documentElement;d.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){document.documentElement.removeAttribute('data-theme')}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${montserrat.variable} ${openSans.variable} min-h-screen bg-white text-[#dee2f0] flex flex-col font-sans relative antialiased selection:bg-brand-accent selection:text-gray-700`}>
        <ThemeProvider>
          <PwaRegister />
          <AppChrome>
            <MetaPixel>{children}</MetaPixel>
          </AppChrome>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID ?? 'G-53QPVLVTCP'} />
      </body>
    </html>
  );
}
