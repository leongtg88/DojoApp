import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { KIHON_TECHNIQUES } from '@/lib/curriculum/kihon'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

/**
 * Sincroniza el catálogo oficial de Kihon (global, schoolId = null) de forma
 * idempotente y NO destructiva:
 * - Solo crea/actualiza técnicas globales con sus datos de categoría.
 * - No elimina técnicas ni datos de alumnos.
 * - Las técnicas personalizadas por escuela no se tocan.
 * - No vincula técnicas a grados (eso se hace desde «Grados y técnicas»).
 */
async function main() {
  console.log('Sincronizando catálogo de Kihon...')

  for (const kihon of KIHON_TECHNIQUES) {
    const data = {
      name: kihon.name,
      japaneseName: kihon.japaneseName ?? null,
      kanji: kihon.kanji ?? null,
      description: kihon.description ?? null,
      category: 'KIHON' as const,
      kihonCategory: kihon.kihonCategory,
      order: kihon.order,
      repetitionsCount: kihon.repetitionsCount ?? null,
      stance: kihon.stance ?? null,
      level: kihon.level ?? null,
      schoolId: null,
    }

    await db.technique.upsert({
      where: { id: kihon.id },
      update: data,
      create: { id: kihon.id, ...data },
    })
  }

  console.log(`Kihon sincronizados: ${KIHON_TECHNIQUES.length}`)
  console.log('Sincronización de Kihon completada correctamente')
}

main()
  .catch((error) => {
    console.error('Error sincronizando el catálogo de Kihon:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
