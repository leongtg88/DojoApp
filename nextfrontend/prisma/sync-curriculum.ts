import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { ADULT_RANKS, YOUTH_RANKS, KATAS, type Program } from '@/lib/curriculum/programs'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

function programForDob(dateOfBirth: Date): Program {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1
  }
  return age >= 18 ? 'ADULT' : 'YOUTH'
}

/**
 * Sincroniza el currículo oficial (katas, grados y sus enlaces) con la base de
 * datos de forma idempotente y NO destructiva:
 * - Solo crea/actualiza grados y katas globales (schoolId = null).
 * - Nunca elimina StudentTechnique, StudentRankHistory ni datos de alumnos.
 * - Los grados/katas personalizados por escuela no se tocan.
 */
async function main() {
  console.log('Sincronizando currículo oficial...')

  // 1) Katas (Technique con category KATA), globales.
  for (const kata of KATAS) {
    const data = { name: kata.name, kanji: kata.kanji, category: 'KATA' as const, order: kata.order, schoolId: null }
    await db.technique.upsert({
      where: { id: kata.id },
      update: data,
      create: { id: kata.id, ...data },
    })
  }
  console.log(`Katas sincronizadas: ${KATAS.length}`)

  // 2) Grados globales de ambos programas.
  const programs: [Program, typeof ADULT_RANKS][] = [
    ['ADULT', ADULT_RANKS],
    ['YOUTH', YOUTH_RANKS],
  ]

  for (const [program, ranks] of programs) {
    for (const rank of ranks) {
      const data = {
        program,
        name: rank.name,
        kyuDan: rank.kyuDan,
        japaneseName: rank.japaneseName,
        kanji: rank.kanji,
        order: rank.order,
        beltColor: rank.beltColor,
        beltSecondaryColor: rank.beltSecondaryColor ?? null,
        description: rank.description ?? null,
        isMaximumRank: rank.isMaximumRank,
        minMonths: rank.minMonths,
        maxMonths: rank.maxMonths,
        estimatedDurationMonths: rank.maxMonths ?? rank.minMonths,
        minAttendancePercent: 80,
        schoolId: null,
      }

      await db.beltRank.upsert({
        where: { id: rank.id },
        update: data,
        create: { id: rank.id, ...data },
      })
    }
  }
  console.log(`Grados sincronizados: ${ADULT_RANKS.length + YOUTH_RANKS.length}`)

  // 3) Enlaces grado ↔ kata de los grados canónicos (set exacto al currículo).
  const allRanks = [...ADULT_RANKS, ...YOUTH_RANKS]
  const canonicalRankIds = allRanks.map((rank) => rank.id)
  const kataNameToId = new Map(KATAS.map((kata) => [kata.name, kata.id]))

  await db.beltRankKata.deleteMany({ where: { beltRankId: { in: canonicalRankIds } } })

  let links = 0
  for (const rank of allRanks) {
    const rows = rank.katas.flatMap((kataName, index) => {
      const kataId = kataNameToId.get(kataName)
      return kataId ? [{ beltRankId: rank.id, kataId, order: index + 1 }] : []
    })

    if (rows.length > 0) {
      const result = await db.beltRankKata.createMany({ data: rows, skipDuplicates: true })
      links += result.count
    }
  }
  console.log(`Enlaces grado-kata sincronizados: ${links}`)

  // 4) Migra el nombre denormalizado de los alumnos con grados de cinturón negro.
  let renamedWithId = 0
  for (const rank of allRanks) {
    const result = await db.student.updateMany({
      where: { currentRankId: rank.id, currentRank: { not: rank.name } },
      data: { currentRank: rank.name },
    })
    renamedWithId += result.count
  }

  const legacyBlackBelts = await db.student.findMany({
    where: { currentRank: 'Negro', currentRankId: null },
    select: { id: true, dateOfBirth: true },
  })

  let renamedLegacy = 0
  for (const student of legacyBlackBelts) {
    const name = programForDob(student.dateOfBirth) === 'ADULT' ? 'Shodan' : 'Shodan Ho'
    await db.student.update({ where: { id: student.id }, data: { currentRank: name } })
    renamedLegacy += 1
  }

  console.log(`Alumnos actualizados por currentRankId: ${renamedWithId}`)
  console.log(`Alumnos "Negro" migrados por programa: ${renamedLegacy}`)
  console.log('Sincronización completada correctamente')
}

main()
  .catch((error) => {
    console.error('Error sincronizando el currículo:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
