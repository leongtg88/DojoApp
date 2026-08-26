import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/asistente', '/api/'],
      },
    ],
    sitemap: 'https://toseigusoku.com/sitemap.xml',
  };
}