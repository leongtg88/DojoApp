import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tosei Gusoku Dojo - Sistema de Seguimiento Marcial',
  description: 'Plataforma de seguimiento técnico, evaluación de katas y progresión de grados kyu y dan para Shito-Ryu Inoue Ha Karate-Do.',
  openGraph: {
    title: 'Tosei Gusoku Dojo - Sistema de Seguimiento Marcial',
    description: 'Plataforma de seguimiento técnico, evaluación de katas y progresión de grados kyu y dan para Shito-Ryu Inoue Ha Karate-Do.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tosei Gusoku Dojo - Sistema de Seguimiento Marcial',
    description: 'Plataforma de seguimiento técnico, evaluación de katas y progresión de grados kyu y dan para Shito-Ryu Inoue Ha Karate-Do.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

