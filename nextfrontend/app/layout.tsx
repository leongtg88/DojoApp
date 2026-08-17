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
  title: 'Tosei Gusoku Dojo - Karate Shito Ryu Santo Domingo',
  description: 'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños y adultos.',
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
