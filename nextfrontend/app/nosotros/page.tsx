import type { Metadata } from 'next';
import NosotrosClient from '@/components/NosotrosClient';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Sobre Nosotros - Historia y Instructores del Dojo',
  description:
    'Conoce la historia de Tosei Gusoku Dojo, escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Nuestros instructores: Sensei León Gustavo, Kyoshi Julio Martínez, Shihan Manuel Balbuena.',
  openGraph: {
    title: 'Sobre Nosotros | Tosei Gusoku Dojo',
    description:
      'Historia, instructores y linaje oficial de Tosei Gusoku Dojo - Karate Shito Ryu Inoue Ha en Santo Domingo.',
    url: `${SITE.url}/nosotros`,
  },
  alternates: {
    canonical: `${SITE.url}/nosotros`,
  },
};

export default function NosotrosPage() {
  return (
    <>
      <JsonLd
        id="breadcrumb-nosotros"
        data={generateBreadcrumbSchema([
          { name: 'Inicio', url: SITE.url },
          { name: 'Sobre Nosotros', url: `${SITE.url}/nosotros` },
        ])}
      />
      <NosotrosClient />
    </>
  );
}