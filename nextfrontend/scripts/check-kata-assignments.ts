import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Script de SOLO LECTURA: lista las técnicas/katas asignadas al expediente de
// los senseis (usuarios con rol INSTRUCTOR que también tienen ficha de alumno),
// para confirmar qué asignaciones existen hoy. No modifica nada.
//
// Uso:  pnpm tsx scripts/check-kata-assignments.ts [email-del-sensei]
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

const emailFilter = process.argv[2]?.trim().toLowerCase()

async function main() {
  const users = await db.user.findMany({
    where: {
      roles: { has: 'INSTRUCTOR' },
      ...(emailFilter ? { email: emailFilter } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      studentProfile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          currentRank: true,
          currentRankId: true,
          schoolId: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  if (users.length === 0) {
    console.log(emailFilter ? `No se encontró un sensei con email ${emailFilter}.` : 'No hay usuarios con rol INSTRUCTOR.')
    return
  }

  for (const user of users) {
    console.log(`\n=== Sensei: ${user.name ?? '(sin nombre)'} <${user.email ?? 'sin email'}> ===`)

    const student = user.studentProfile

    if (!student) {
      console.log('  (no tiene ficha de alumno vinculada a su cuenta)')
      continue
    }

    {
      const techniques = await db.studentTechnique.findMany({
        where: { studentId: student.id },
        select: {
          approved: true,
          inPractice: true,
          createdAt: true,
          technique: { select: { name: true, japaneseName: true, category: true, schoolId: true } },
        },
        orderBy: { technique: { name: 'asc' } },
      })

      const byCategory = new Map<string, number>()
      for (const entry of techniques) {
        byCategory.set(entry.technique.category, (byCategory.get(entry.technique.category) ?? 0) + 1)
      }

      console.log(`  Alumno: ${student.firstName} ${student.lastName} · grado ${student.currentRank ?? '—'} · id ${student.id}`)
      console.log(`  Total técnicas asignadas: ${techniques.length}`)
      console.log(`  Por categoría: ${[...byCategory.entries()].map(([category, count]) => `${category}=${count}`).join(', ') || '(ninguna)'}`)

      const katas = techniques.filter((entry) => entry.technique.category === 'KATA')
      if (katas.length === 0) {
        console.log('  Katas asignadas: (ninguna)')
      } else {
        console.log(`  Katas asignadas (${katas.length}):`)
        for (const entry of katas) {
          const flags = [entry.approved ? 'aprobada' : 'pendiente', entry.inPractice ? 'en práctica' : null].filter(Boolean).join(', ')
          console.log(`    - ${entry.technique.name}${entry.technique.japaneseName ? ` (${entry.technique.japaneseName})` : ''} [${flags}]`)
        }
      }

      // Diagnóstico: ¿hubo actividad previa? Los registros de práctica "libres"
      // sobreviven al borrado del expediente; los "asignados" se borran en cascada.
      const freeLogs = await db.techniquePracticeLog.count({ where: { studentId: student.id } })
      const assignedLogs = await db.techniquePracticeLog.count({ where: { studentTechnique: { studentId: student.id } } })
      console.log(`  Registros de práctica: libres=${freeLogs}, asignados=${assignedLogs}`)

      const rank = student.currentRankId
        ? await db.beltRank.findUnique({ where: { id: student.currentRankId }, select: { name: true, program: true, _count: { select: { katas: true } } } })
        : null
      if (rank) {
        console.log(`  Grado (${rank.name}, ${rank.program}): ${rank._count.katas} katas enlazadas al grado`)
      } else {
        console.log('  Grado: sin BeltRank enlazado por id (no se pueden resolver las katas del grado)')
      }

      const audits = await db.auditLog.findMany({
        where: { targetType: 'Student', targetId: student.id, action: { startsWith: 'techniques.' } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, createdAt: true, detail: true },
      })
      if (audits.length === 0) {
        console.log('  Auditoría de técnicas: sin registros (no se auditaba antes de este cambio)')
      } else {
        console.log('  Auditoría de técnicas:')
        for (const audit of audits) {
          console.log(`    - ${audit.createdAt.toISOString()} ${audit.action} ${JSON.stringify(audit.detail)}`)
        }
      }
    }
  }

  console.log('\nPara limitar a un sensei concreto: pnpm tsx scripts/check-kata-assignments.ts correo@ejemplo.com')
}

main()
  .catch((error) => {
    console.error('Error consultando las asignaciones:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
