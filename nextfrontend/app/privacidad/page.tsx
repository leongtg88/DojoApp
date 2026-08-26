import type { Metadata } from 'next';
import PoliticaPrivacidad from '@/components/PrivacidadDeDatos';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Protección de Datos',
  description:
    'Política de privacidad y protección de datos personales de TOSEI GUSOKU DOJO CLUB conforme a la Ley 172-13 de la República Dominicana.',
  openGraph: {
    title: 'Política de Privacidad | Tosei Gusoku Dojo',
    description:
      'Política de privacidad y protección de datos de TOSEI GUSOKU DOJO CLUB.',
    url: `${SITE.url}/privacidad`,
  },
  alternates: {
    canonical: `${SITE.url}/privacidad`,
  },
};

export default function PrivacidadPage() {
  return <PoliticaPrivacidad />;
}
