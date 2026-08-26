import type { Metadata } from 'next';
import ToseiGusokuForm from '@/components/ToseiGusokuForm';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Inscripción - Formulario de Registro',
  description:
    'Inscríbete en Tosei Gusoku Dojo. Formulario de inscripción para clases de Karate Shito Ryu Inoue Ha en Santo Domingo. Niños y adultos.',
  openGraph: {
    title: 'Inscripción | Tosei Gusoku Dojo',
    description: 'Formulario de inscripción para clases de Karate Shito Ryu en Santo Domingo.',
    url: `${SITE.url}/inscripcion`,
  },
  alternates: {
    canonical: `${SITE.url}/inscripcion`,
  },
};

export default function InscripcionPage() {
  return (
    <>
      <JsonLd
        id="breadcrumb-inscripcion"
        data={generateBreadcrumbSchema([
          { name: 'Inicio', url: SITE.url },
          { name: 'Inscripción', url: `${SITE.url}/inscripcion` },
        ])}
      />
      <ToseiGusokuForm />
    </>
  );
}