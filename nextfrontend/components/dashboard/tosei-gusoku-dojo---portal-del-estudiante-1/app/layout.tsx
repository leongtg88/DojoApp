import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tosei Gusoku Dojo - Portal del Estudiante',
  description:
    'Dashboard para alumnos de karate en Tosei Gusoku Dojo: seguimiento de grado, técnicas del syllabus, horarios semanales, datos personales y expediente digital.',
  openGraph: {
    title: 'Tosei Gusoku Dojo - Portal del Estudiante',
    description:
      'Dashboard para alumnos de karate en Tosei Gusoku Dojo: seguimiento de grado, técnicas del syllabus, horarios semanales, datos personales y expediente digital.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tosei Gusoku Dojo - Portal del Estudiante',
    description:
      'Dashboard para alumnos de karate en Tosei Gusoku Dojo: seguimiento de grado, técnicas del syllabus, horarios semanales, datos personales y expediente digital.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${montserrat.variable} ${openSans.variable}`}>
      <body
        className="min-h-screen bg-[#FCF9F8] text-[#1C1B1B] font-sans antialiased selection:bg-[#DC2626] selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
