export const SITE = {
    name: 'Tosei Gusoku Dojo',
    title: 'Karate Shito Ryu Inoue Ha Santo Domingo',
    description: 'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo. Clases para niños, jóvenes y adultos. Disciplina, defensa personal, condición física y confianza. Clase gratis de prueba.',
    url: 'https://toseigusoku.com',
    ogImage: '/assets/LogoSolo.svg',
    phone: '+18296378733',
    email: 'toseigusoku@gmail.com',
    address: {
        street: 'Plaza Lulie 3era Planta, esquina Av. 27 de Febrero con Carmen Mendoza',
        locality: 'Santo Domingo',
        region: 'Distrito Nacional',
        country: 'DO', 
        postalCode: '10101',
        full: 'Plaza Lulie 3era Planta, esquina Av. 27 de Febrero con Carmen Mendoza, Santo Domingo, Distrito Nacional, República Dominicana, 10101',
    },
    geo: { latitude: 18.4574589, longitude: -69.9520022 },
    openingHours: 'Mo 20:20-21:20, Tu 15:15-18:00, We 20:20-21:20, Th 15:15-18:00, Sa 06:00-11:00, Su 06:00-09:00',
    mapsUrl:
    'https://www.google.com/maps/place/Karate+Do+Tosei+Gusoku+Dojo+Shito+Ryu+Inoue+Ha/@18.4574589,-69.9520022,825m/data=!3m2!1e3!4b1!4m6!3m5!1s0x8ea563c15898befd:0x386c75f4f249964f!8m2!3d18.4574538!4d-69.9494273!16s%2Fg%2F11rckyjhp1?entry=ttu',
    social: {
    facebook: 'https://www.facebook.com/people/Tosei-Gusoku/100065134015633/',
    instagram: 'https://www.instagram.com/toseigusokurd/',
    youtube: 'https://www.youtube.com/@ToseiGusokuDojo',
    },
    
} as const;
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    name: SITE.name + ' - Karate Shito Ryu Inoue Ha',
    description: SITE.description,
    url: SITE.url,
    telephone: SITE.phone,
    image: SITE.url + SITE.ogImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
      postalCode: SITE.address.postalCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Wednesday'],
        opens: '20:20',
        closes: '21:20',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Tuesday', 'Thursday'],
        opens: '15:15',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '06:00',
        closes: '11:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: '06:00',
        closes: '09:00',
      },
    ],
    hasMap: SITE.mapsUrl,
    priceRange: '$$',
    areaServed: {
      '@type': 'City',
      name: 'Santo Domingo',
    },
    makesOffer: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Clases de Karate Shito Ryu para Niños Pequeños (5-7 años)',
          description: 'Programa para niños de 5 a 7 años, 90 minutos por semana. Horarios: Martes y Jueves 4:00-4:45 PM, Sábados 9:00-9:45 AM y 10:00-10:45 AM.',
        },
        price: '3500',
        priceCurrency: 'DOP',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '3500',
          priceCurrency: 'DOP',
          billingDuration: {
            '@type': 'QuantitativeValue',
            value: 1,
            unitCode: 'MON',
          },
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Clases de Karate Shito Ryu para Jóvenes y Adultos (8 años en adelante)',
          description: 'Clases de karate para jóvenes y adultos desde 8 años, 2 horas por semana. Horarios: Martes/Jueves 5:00-6:00 PM, Lunes/Miércoles (Adultos) 8:20-9:20 PM, Sábados 9:00-10:00 AM y 10:00-11:00 AM.',
        },
        price: '3300',
        priceCurrency: 'DOP',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '3300',
          priceCurrency: 'DOP',
          billingDuration: {
            '@type': 'QuantitativeValue',
            value: 1,
            unitCode: 'MON',
          },
        },
      },
    ],
    provider: {
      '@type': 'Organization',
      name: 'Inoue Ha Shito Ryu Keishin Kai',
      url: SITE.url,
    },
  };
}

export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}