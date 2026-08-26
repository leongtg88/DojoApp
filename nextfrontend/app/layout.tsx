import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ConditionalFooter from '@/components/conditionalFooter';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${montserrat.variable} ${openSans.variable} min-h-screen bg-white text-[#dee2f0] flex flex-col font-sans relative antialiased selection:bg-brand-accent selection:text-gray-700`}>
        <Navbar />
        <main className="flex-grow pt-20 md:pb-20">{children}</main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
