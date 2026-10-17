import { db } from '@/lib/db'
import { buildLlmsTxt, type LlmsPostInput } from '@/lib/seo/llms'

// Mapa curado del sitio para LLM/agentes. Ver lib/seo/llms.ts.
// Se cachea 1 hora (ISR) para no consultar la DB en cada request.
export const revalidate = 3600

// Número máximo de artículos listados en el índice compacto.
const POST_LIMIT = 25

export async function GET(): Promise<Response> {
  const posts = await db.post
    .findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: POST_LIMIT,
      select: { title: true, slug: true, excerpt: true },
    })
    .catch((error: unknown) => {
      // Un fallo de la DB no debe tumbar el archivo: se devuelven las secciones
      // estáticas para que los agentes sigan teniendo el mapa del sitio.
      console.error('[llms.txt] No fue posible cargar los posts:', error)
      return [] as LlmsPostInput[]
    })

  return new Response(buildLlmsTxt(posts), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
