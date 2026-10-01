import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

// El sitemap consulta la base de datos (posts publicados). Se mantiene dinámico
// para no depender de la DB en build y reflejar publicaciones al revalidar.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://toseigusoku.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/inscripcion`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const posts = await db.post
    .findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, updatedAt: true, coverImageUrl: true },
    })
    .catch((error: unknown) => {
      // Un fallo de la DB no debe tumbar el sitemap: se devuelven las rutas
      // estáticas y los crawlers reintentan después.
      console.error('[sitemap] No fue posible cargar los posts:', error);
      return [];
    });

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
    ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
  }));

  return [...staticRoutes, ...postRoutes];
}
