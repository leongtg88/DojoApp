import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { syncKihonCatalog } from '@/lib/curriculum/kihon-sync'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

/**
 * Sincroniza el catálogo oficial de Kihon. La lógica vive en
 * `lib/curriculum/kihon-sync.ts` para reutilizarla desde el seed.
 */
async function main() {
  console.log('Sincronizando catálogo de Kihon...')

  const count = await syncKihonCatalog(db)

  console.log(`Kihon sincronizados: ${count}`)
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
