import { db } from '@/lib/db'
import { buildLlmsFullTxt, type LlmsPostInput } from '@/lib/seo/llms'

// Versión extendida (contenido completo de los artículos). Ver lib/seo/llms.ts.
// Se cachea 1 hora (ISR) para no consultar la DB en cada request.
export const revalidate = 3600

export async function GET(): Promise<Response> {
  const posts = await db.post
    .findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: { title: true, slug: true, excerpt: true, content: true },
    })
    .catch((error: unknown) => {
      // Un fallo de la DB no debe tumbar el archivo: se devuelven las secciones
      // estáticas sin los artículos.
      console.error('[llms-full.txt] No fue posible cargar los posts:', error)
      return [] as LlmsPostInput[]
    })

  return new Response(buildLlmsFullTxt(posts), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
