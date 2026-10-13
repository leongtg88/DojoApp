import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

async function main() {
  const deleted = await db.apiUsage.deleteMany({
    where: { key: { startsWith: 'login-fail:alumno@test.com' } }
  })
  console.log(`Rate limit records eliminados: ${deleted.count}`)

  // También limpiar rate limit por IP (unknown)
  const deletedIp = await db.apiUsage.deleteMany({
    where: { key: { startsWith: 'login:unknown' } }
  })
  console.log(`Rate limit IP records eliminados: ${deletedIp.count}`)
}

main().finally(() => db.$disconnect())
