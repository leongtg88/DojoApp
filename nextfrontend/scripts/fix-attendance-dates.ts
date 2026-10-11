import { PrismaClient, type AttendanceStatus } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { santoDomingoDayKey, santoDomingoNoon } from '@/lib/dashboard/schedule-utils'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

const APPLY = process.argv.includes('--apply')

interface AttendanceRow {
  id: string
  studentId: string
  classId: string | null
  sessionId: string | null
  date: Date
  present: boolean
  status: AttendanceStatus
  hoursTrained: number
  confirmedAt: Date | null
  createdAt: Date
}

function groupKey(row: AttendanceRow, effectiveDate: Date): string {
  // Día local de Santo Domingo, para agrupar por "mismo día real".
  return `${row.studentId}|${row.classId ?? 'null'}|${santoDomingoDayKey(effectiveDate)}`
}

/** Fecha de calendario real del registro: la de la sesión si es pase de lista. */
function effectiveDate(row: AttendanceRow, sessionDateById: Map<string, Date>): Date {
  if (row.sessionId) {
    const sessionDate = sessionDateById.get(row.sessionId)
    if (sessionDate) return santoDomingoNoon(sessionDate.toISOString().slice(0, 10))
  }
  return row.date
}

async function main() {
  console.log(`Modo: ${APPLY ? 'APLICAR' : 'SIMULACIÓN (dry-run). Usa --apply para ejecutar.'}\n`)

  const rows = (await db.attendance.findMany({
    select: {
      id: true,
      studentId: true,
      classId: true,
      sessionId: true,
      date: true,
      present: true,
      status: true,
      hoursTrained: true,
      confirmedAt: true,
      createdAt: true,
    },
  })) as AttendanceRow[]

  // ---------- 1) Normalizar la fecha de las asistencias de sesión ----------
  const sessionRows = rows.filter((row) => row.sessionId)
  const sessionIds = sessionRows.map((row) => row.sessionId as string)
  const sessions = sessionIds.length
    ? await db.classSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, date: true },
      })
    : []
  const sessionDateById = new Map(sessions.map((session) => [session.id, session.date]))

  let normalized = 0
  for (const row of sessionRows) {
    const sessionDate = sessionDateById.get(row.sessionId as string)
    if (!sessionDate) continue
    const expected = santoDomingoNoon(sessionDate.toISOString().slice(0, 10))
    if (row.date.getTime() !== expected.getTime()) {
      normalized += 1
      if (APPLY) {
        await db.attendance.update({ where: { id: row.id }, data: { date: expected } })
      }
    }
  }
  console.log(`1) Fechas de sesión a normalizar (medianoche UTC → mediodía RD): ${normalized}`)

  // ---------- 2) Fusionar duplicados reales (punch + pase de lista) ----------
  const groups = new Map<string, AttendanceRow[]>()
  for (const row of rows) {
    if (!row.classId) continue
    const key = groupKey(row, effectiveDate(row, sessionDateById))
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }

  const statusRank: Record<AttendanceStatus, number> = { CONFIRMED: 5, JUSTIFIED: 4, ABSENT: 3, PENDING: 2, REJECTED: 1 }
  let mergedGroups = 0
  let deletedRows = 0

  console.log('\n   Grupos con más de un registro para el mismo alumno/clase/día:')
  let multiGroups = 0
  for (const [key, list] of groups.entries()) {
    if (list.length < 2) continue
    multiGroups += 1
    console.log(`   - ${key}`)
    for (const row of list) {
      console.log(`       id=${row.id} session=${row.sessionId ?? '—'} date=${row.date.toISOString()} status=${row.status} present=${row.present} h=${row.hoursTrained}`)
    }
  }
  console.log(`   (total: ${multiGroups})\n`)

  for (const list of groups.values()) {
    if (list.length < 2) continue
    const sessionRecord = list.find((row) => row.sessionId)
    const punches = list.filter((row) => !row.sessionId)
    // Solo fusionamos cuando hay un pase de lista (sesión) y un punch que no se
    // llegó a fusionar. Otros casos (clase + libre) se dejan intactos.
    if (!sessionRecord || punches.length === 0) continue

    const primary = sessionRecord
    const duplicates = list.filter((row) => row.id !== primary.id)

    mergedGroups += 1
    deletedRows += duplicates.length
    console.log(`   • Fusionar ${primary.studentId} (clase ${primary.classId}, ${santoDomingoDayKey(primary.date)}): conservar ${primary.id}, eliminar ${duplicates.map((d) => d.id).join(', ')}`)

    if (!APPLY) continue

    await db.$transaction(async (transaction) => {
      const duplicateIds = duplicates.map((row) => row.id)

      // Conserva las mejores horas (si el pase quedó en 0 y el punch tenía horas).
      const bestHours = Math.max(primary.hoursTrained, ...duplicates.map((row) => row.hoursTrained))
      const bestRank = [primary, ...duplicates].reduce(
        (best, row) => (statusRank[row.status] > statusRank[best.status] ? row : best),
        primary,
      )
      await transaction.attendance.update({
        where: { id: primary.id },
        data: {
          hoursTrained: bestHours,
          status: bestRank.status,
          present: bestRank.present,
        },
      })

      // Repunta repeticiones y reposiciones hacia el registro conservado.
      await transaction.techniquePracticeLog.updateMany({
        where: { attendanceId: { in: duplicateIds } },
        data: { attendanceId: primary.id },
      })
      await transaction.attendance.updateMany({
        where: { recoveredById: { in: duplicateIds } },
        data: { recoveredById: primary.id },
      })

      await transaction.attendance.deleteMany({ where: { id: { in: duplicateIds } } })
    })
  }
  console.log(`\n2) Grupos de duplicados fusionados: ${mergedGroups} (registros a eliminar: ${deletedRows})`)

  console.log(
    APPLY
      ? '\nListo. Cambios aplicados.'
      : '\nSimulación. Vuelve a ejecutar con --apply para aplicar los cambios.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
