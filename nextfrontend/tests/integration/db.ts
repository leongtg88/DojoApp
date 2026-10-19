import { db } from '@/lib/db'

export { db }

/**
 * Borra el contenido de todas las tablas públicas (excepto las de migraciones de
 * Prisma) para aislar cada test. `CASCADE` limpia las dependencias por FK.
 */
export async function resetDb(): Promise<void> {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '\\_prisma%'
  `

  if (tables.length === 0) return

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ')
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
}
