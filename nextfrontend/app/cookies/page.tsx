import type { Metadata } from 'next';
import PoliticaCookies from '@/components/PoliticaCookies';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description:
    'Política de cookies de TOSEI GUSOKU DOJO CLUB: qué cookies usamos, para qué sirven y cómo gestionar tu consentimiento conforme a la Ley 172-13 de la República Dominicana.',
  openGraph: {
    title: 'Política de Cookies | Tosei Gusoku Dojo',
    description:
      'Conoce qué cookies usamos y cómo gestionar tu consentimiento.',
    url: `${SITE.url}/cookies`,
  },
  alternates: {
    canonical: `${SITE.url}/cookies`,
  },
};

export default function CookiesPage() {
  return <PoliticaCookies />;
}
