import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { KUMITE_TECHNIQUES } from '@/lib/curriculum/kumite'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

/**
 * Sincroniza el catálogo oficial de Kumite (global, schoolId = null) de forma
 * idempotente y NO destructiva. No elimina técnicas ni datos de alumnos y no
 * vincula técnicas a grados (eso se hace desde «Grados y técnicas»).
 */
async function main() {
  console.log('Sincronizando catálogo de Kumite...')

  for (const kumite of KUMITE_TECHNIQUES) {
    const data = {
      name: kumite.name,
      description: kumite.description ?? null,
      category: 'KUMITE' as const,
      kumiteCategory: kumite.kumiteCategory,
      order: kumite.order,
      movementsCount: kumite.movementsCount ?? null,
      kumiteType: kumite.kumiteType ?? null,
      role: kumite.role ?? null,
      distance: kumite.distance ?? null,
      schoolId: null,
    }

    await db.technique.upsert({
      where: { id: kumite.id },
      update: data,
      create: { id: kumite.id, ...data },
    })
  }

  console.log(`Kumite sincronizados: ${KUMITE_TECHNIQUES.length}`)
  console.log('Sincronización de Kumite completada correctamente')
}

main()
  .catch((error) => {
    console.error('Error sincronizando el catálogo de Kumite:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
