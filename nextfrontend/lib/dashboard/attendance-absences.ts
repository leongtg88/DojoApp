import { db } from '@/lib/db'
import { ClassEnrollmentStatus, StudentStatus } from '@/lib/generated/prisma'
import { getAdminScope } from '@/lib/dashboard/scope'

/** Días que un alumno tiene para punchar una clase antes de que cuente como inasistencia. */
const PUNCH_WINDOW_DAYS = 7

/**
 * Genera (de forma perezosa) las inasistencias de una clase/fecha cuando la
 * ventana de punch ya cerró: los alumnos activos inscritos que no tienen
 * registro ni punch ese día quedan como ausentes (status ABSENT).
 *
 * Es idempotente: no duplica registros existentes de la sesión.
 */
export async function ensureClassAbsences(userId: string, classId: string, date: string): Promise<void> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return
  }

  const sessionDate = new Date(`${date}T00:00:00.000Z`)
  const now = new Date()
  const windowEnd = new Date(sessionDate.getTime() + PUNCH_WINDOW_DAYS * 86_400_000)

  if (windowEnd.getTime() > now.getTime()) {
    return
  }

  const scheduledClass = await db.class.findFirst({
    where: {
      id: classId,
      active: true,
      ...(scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }),
    },
    select: {
      id: true,
      dayOfWeek: true,
      enrollments: {
        where: { status: ClassEnrollmentStatus.ACTIVE, student: { status: StudentStatus.ACTIVE } },
        select: { studentId: true },
      },
    },
  })

  if (!scheduledClass || scheduledClass.enrollments.length === 0) {
    return
  }

  const enrolledStudentIds = scheduledClass.enrollments.map((enrollment) => enrollment.studentId)
  const dayAfter = new Date(sessionDate.getTime() + 86_400_000)

  const [classSession, punches] = await Promise.all([
    db.classSession.findUnique({
      where: { classId_date: { classId, date: sessionDate } },
      select: { id: true, attendances: { select: { studentId: true } } },
    }),
    db.attendance.findMany({
      where: {
        studentId: { in: enrolledStudentIds },
        sessionId: null,
        date: { gte: sessionDate, lt: dayAfter },
      },
      select: { studentId: true },
    }),
  ])

  // Si no hay sesión registrada y la clase no sesiona ese día, no corresponde falta.
  if (!classSession && scheduledClass.dayOfWeek !== sessionDate.getUTCDay()) {
    return
  }

  const covered = new Set<string>([
    ...(classSession?.attendances.map((attendance) => attendance.studentId) ?? []),
    ...punches.map((punch) => punch.studentId),
  ])

  const missing = enrolledStudentIds.filter((studentId) => !covered.has(studentId))

  if (missing.length === 0) {
    return
  }

  const session = classSession ?? await db.classSession.upsert({
    where: { classId_date: { classId, date: sessionDate } },
    update: {},
    create: { classId, date: sessionDate },
    select: { id: true },
  })

  await db.attendance.createMany({
    data: missing.map((studentId) => ({
      sessionId: session.id,
      studentId,
      date: sessionDate,
      present: false,
      status: 'ABSENT',
      sessionType: 'class',
      hoursTrained: 0,
      classId,
      isOutOfSchedule: false,
      confirmedAt: now,
    })),
    skipDuplicates: true,
  })
}
