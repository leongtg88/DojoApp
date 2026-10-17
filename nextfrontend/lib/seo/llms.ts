import { SITE, generateLocalBusinessSchema } from '@/lib/seo'

// Genera el contenido de /llms.txt y /llms-full.txt siguiendo la convención de
// llmstxt.org: un mapa curado del sitio (enlaces + descripciones) en Markdown,
// pensado para que los LLM/agentes lo consuman de forma eficiente en tokens.
//
// La información de contacto, dirección, horarios y programas proviene de
// lib/seo.ts para no duplicar la fuente única.

export interface LlmsPostInput {
  title: string
  slug: string
  excerpt: string
  content?: string
}

const BASE_URL = SITE.url

const SUMMARY =
  'Escuela de Karate Shito Ryu Inoue Ha en Santo Domingo, República Dominicana. ' +
  'Clases para niños (desde 5 años), jóvenes y adultos: disciplina, defensa personal, ' +
  'condición física y confianza. Primera clase de prueba gratis.'

const ABOUT = [
  `**${SITE.name}** (Shito Ryu Inoue Ha · Keishin Kai International · ISKIA) es una escuela de Karate Do en Santo Domingo que entrena a niños, jóvenes y adultos con un enfoque en el desarrollo integral humano, la autodisciplina y el respeto.`,
  '',
  `- Sede: ${SITE.address.full}`,
  `- Teléfono / WhatsApp: ${SITE.phone}`,
  `- Correo: ${SITE.email}`,
  `- Horarios: ${SITE.openingHours}`,
].join('\n')

interface LlmsLink {
  title: string
  path: string
  description?: string
}

const MAIN_PAGES: LlmsLink[] = [
  { title: 'Inicio', path: '/', description: 'Presentación de la escuela, programas, horarios y contacto.' },
  { title: 'Sobre Nosotros', path: '/nosotros', description: 'Historia de la escuela, instructores y linaje (Inoue Ha, Keishin Kai, ISKIA).' },
  { title: 'Inscripción', path: '/inscripcion', description: 'Formulario de inscripción y requisitos para nuevos alumnos.' },
  { title: 'Blog', path: '/blog', description: 'Artículos sobre karate, técnica y la vida del dojo.' },
]

const LEGAL_PAGES: LlmsLink[] = [
  { title: 'Términos y Condiciones', path: '/terminos' },
  { title: 'Política de Privacidad', path: '/privacidad' },
  { title: 'Política de Cookies', path: '/cookies' },
]

function linkLine(link: LlmsLink): string {
  const suffix = link.description ? `: ${link.description}` : ''
  return `- [${link.title}](${BASE_URL}${link.path})${suffix}`
}

function contactBlock(): string[] {
  return [
    '## Contacto',
    `- Correo electrónico: ${SITE.email}`,
    `- WhatsApp / Teléfono: ${SITE.phone}`,
    `- Dirección: ${SITE.address.full}`,
    `- Horarios: ${SITE.openingHours}`,
  ]
}

/** Versión curada y compacta para `/llms.txt`. */
export function buildLlmsTxt(posts: LlmsPostInput[]): string {
  const lines: string[] = []
  lines.push(`# ${SITE.name}`, '')
  lines.push(`> ${SUMMARY}`, '')
  lines.push(ABOUT, '')

  lines.push('## Información principal')
  MAIN_PAGES.forEach((page) => lines.push(linkLine(page)))
  lines.push('')

  if (posts.length > 0) {
    lines.push('## Artículos')
    posts.forEach((post) =>
      lines.push(`- [${post.title}](${BASE_URL}/blog/${post.slug}): ${post.excerpt}`),
    )
    lines.push('')
  }

  lines.push('## Información legal')
  LEGAL_PAGES.forEach((page) => lines.push(linkLine(page)))
  lines.push('')

  lines.push(...contactBlock())
  lines.push('')

  // Convención de llmstxt.org: lo que va tras "## Optional" puede omitirse
  // cuando el agente necesita ahorrar contexto.
  lines.push('## Optional')
  lines.push(`- [Sitemap](${BASE_URL}/sitemap.xml): índice completo de URLs del sitio.`)
  lines.push('')

  return lines.join('\n')
}

/** Versión extendida para `/llms-full.txt`: incluye el contenido de los artículos. */
export function buildLlmsFullTxt(posts: LlmsPostInput[]): string {
  const lines: string[] = []
  lines.push(`# ${SITE.name}`, '')
  lines.push(`> ${SUMMARY}`, '')
  lines.push(ABOUT, '')

  lines.push('## Programas y precios')
  generateLocalBusinessSchema().makesOffer.forEach((offer) => {
    lines.push(
      `- **${offer.itemOffered.name}** (${offer.price} ${offer.priceCurrency} / mes): ${offer.itemOffered.description}`,
    )
  })
  lines.push('')

  lines.push('## Enlaces principales')
  MAIN_PAGES.forEach((page) => lines.push(linkLine(page)))
  lines.push('')

  if (posts.length > 0) {
    lines.push('## Artículos completos')
    lines.push('')
    posts.forEach((post) => {
      lines.push(`### ${post.title}`, '')
      lines.push(`Fuente: ${BASE_URL}/blog/${post.slug}`, '')
      lines.push((post.content ?? post.excerpt).trim(), '')
    })
  }

  lines.push('## Enlaces legales')
  LEGAL_PAGES.forEach((page) => lines.push(linkLine(page)))
  lines.push('')

  lines.push(...contactBlock())
  lines.push('')

  return lines.join('\n')
}
