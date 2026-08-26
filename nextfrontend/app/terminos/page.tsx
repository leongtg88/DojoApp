import type { Metadata } from 'next';
import TerminosLegales from '@/components/TerminosLegales';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Términos y Condiciones Generales',
  description:
    'Términos y condiciones generales de TOSEI GUSOKU DOJO CLUB. Condiciones de inscripción, membresía, pago y uso de la escuela de Karate Do.',
  openGraph: {
    title: 'Términos y Condiciones | Tosei Gusoku Dojo',
    description:
      'Términos y condiciones generales de TOSEI GUSOKU DOJO CLUB.',
    url: `${SITE.url}/terminos`,
  },
  alternates: {
    canonical: `${SITE.url}/terminos`,
  },
};

export default function TerminosPage() {
  return <TerminosLegales />;
}
