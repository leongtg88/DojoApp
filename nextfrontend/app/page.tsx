import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import JsonLd from '@/components/JsonLd';
import { generateLocalBusinessSchema, generateFAQSchema, SITE } from '@/lib/seo';
import { MOCK_FAQS } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Karate Shito Ryu en Santo Domingo - Clases para Niños y Adultos',
  description:
    'Aprende Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños desde 5 años y adultos. Disciplina, defensa personal, condición física. Primera clase de prueba gratis. Plaza Lulie, Av. 27 de Febrero.',
  openGraph: {
    title: 'Karate Shito Ryu en Santo Domingo | Tosei Gusoku Dojo',
    description:
      'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños y adultos. Primera clase gratis.',
    url: SITE.url,
    images: [{ url: SITE.ogImage, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd id="local-business" data={generateLocalBusinessSchema()} />
      <JsonLd
        id="faq-schema"
        data={generateFAQSchema(MOCK_FAQS.map((f) => ({ question: f.question, answer: f.answer })))}
      />
      <HomeClient />
    </>
  );
}