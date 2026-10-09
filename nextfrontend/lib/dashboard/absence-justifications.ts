import { db } from '@/lib/db'
import { ClassEnrollmentStatus, StudentStatus, type AbsenceJustificationStatus, type AttendanceStatus } from '@/lib/generated/prisma'

/** Días hacia atrás que un alumno puede reportar una inasistencia. */
const REPORT_WINDOW_DAYS = 30

export interface AbsenceJustificationView {
  id: string
  classId: string
  className: string
  date: string
  reason: string
  status: AbsenceJustificationStatus
  reviewedByName: string | null
  reviewedAt: string | null
  createdAt: string
  recovered: boolean
  recoveryDate: string | null
}

export interface CreateAbsenceJustificationParams {
  studentId: string
  classId: string
  date: string
  reason: string
}

export type AbsenceJustificationReview = 'approve' | 'reject'

function toSessionDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

/**
 * Registra (o actualiza) el motivo de inasistencia que envía el alumno para una
 * clase/fecha de su horario. Queda en estado PENDING hasta que instructor o
 * administrador lo revisen.
 */
export async function createAbsenceJustification({
  studentId,
  classId,
  date,
  reason,
}: CreateAbsenceJustificationParams): Promise<AbsenceJustificationView> {
  const sessionDate = toSessionDate(date)

  if (Number.isNaN(sessionDate.getTime())) {
    throw new Error('INVALID_DATE')
  }

  const now = new Date()
  const minAllowed = new Date(now.getFullYear(), now.getMonth(), now.getDate() - REPORT_WINDOW_DAYS)

  if (sessionDate.getTime() > now.getTime()) {
    throw new Error('FUTURE_DATE')
  }
  if (sessionDate.getTime() < minAllowed.getTime()) {
    throw new Error('OUT_OF_WINDOW')
  }

  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId,
      classId,
      status: ClassEnrollmentStatus.ACTIVE,
      class: { active: true },
    },
    select: { id: true, class: { select: { id: true, name: true } } },
  })

  if (!enrollment) {
    throw new Error('CLASS_NOT_ENROLLED')
  }

  const justification = await db.absenceJustification.upsert({
    where: { studentId_classId_date: { studentId, classId, date: sessionDate } },
    update: { reason, status: 'PENDING', reviewedById: null, reviewedAt: null },
    create: { studentId, classId, date: sessionDate, reason },
    include: {
      class: { select: { id: true, name: true } },
      reviewedBy: { select: { name: true } },
    },
  })

  return {
    id: justification.id,
    classId: justification.classId,
    className: justification.class.name,
    date: justification.date.toISOString().slice(0, 10),
    reason: justification.reason,
    status: justification.status,
    reviewedByName: justification.reviewedBy?.name ?? null,
    reviewedAt: justification.reviewedAt?.toISOString() ?? null,
    createdAt: justification.createdAt.toISOString(),
    recovered: false,
    recoveryDate: null,
  }
}

/** Elimina un reporte de inasistencia mientras siga pendiente de revisión. */
export async function deleteAbsenceJustification(studentId: string, justificationId: string): Promise<boolean> {
  const deleted = await db.absenceJustification.deleteMany({
    where: { id: justificationId, studentId, status: 'PENDING' },
  })

  return deleted.count > 0
}

export async function listStudentAbsenceJustifications(studentId: string): Promise<AbsenceJustificationView[]> {
  const [rows, justifiedAttendances] = await Promise.all([
    db.absenceJustification.findMany({
      where: { studentId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 60,
      include: {
        class: { select: { id: true, name: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
    db.attendance.findMany({
      where: { studentId, status: 'JUSTIFIED' },
      select: { classId: true, date: true, recoveredBy: { select: { date: true } } },
    }),
  ])

  // La reposición vive en la asistencia JUSTIFIED (recoveredById → asistencia de
  // reposición). Se indexa por clase+fecha para cruzarla con cada justificación.
  const recoveryByKey = new Map<string, Date | null>()
  for (const attendance of justifiedAttendances) {
    if (!attendance.classId) continue
    recoveryByKey.set(
      `${attendance.classId}|${attendance.date.toISOString().slice(0, 10)}`,
      attendance.recoveredBy?.date ?? null,
    )
  }

  return rows.map((row) => {
    const key = `${row.classId}|${row.date.toISOString().slice(0, 10)}`
    const recoveryDate = recoveryByKey.get(key) ?? null
    return {
      id: row.id,
      classId: row.classId,
      className: row.class.name,
      date: row.date.toISOString().slice(0, 10),
      reason: row.reason,
      status: row.status,
      reviewedByName: row.reviewedBy?.name ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      recovered: recoveryDate != null,
      recoveryDate: recoveryDate?.toISOString().slice(0, 10) ?? null,
    }
  })
}

/**
 * Aprueba o rechaza un reporte de inasistencia. Al aprobar, la asistencia de la
 * sesión queda JUSTIFIED (present=false); al rechazar, ABSENT. En ambos casos se
 * asegura la sesión de clase y el registro de asistencia correspondiente.
 */
export async function reviewAbsenceJustification(params: {
  justificationId: string
  reviewerId: string
  action: AbsenceJustificationReview
  scopedClassIds?: Set<string>
}): Promise<{ attendanceStatus: AbsenceJustificationStatus }> {
  const { justificationId, reviewerId, action, scopedClassIds } = params

  const justification = await db.absenceJustification.findUnique({
    where: { id: justificationId },
    select: {
      id: true,
      studentId: true,
      classId: true,
      date: true,
      reason: true,
      student: { select: { id: true, schoolId: true, status: true } },
    },
  })

  if (!justification) {
    throw new Error('NOT_FOUND')
  }

  if (scopedClassIds && !scopedClassIds.has(justification.classId)) {
    throw new Error('FORBIDDEN')
  }

  const status: AbsenceJustificationStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
  const now = new Date()

  await db.$transaction(async (transaction) => {
    await transaction.absenceJustification.update({
      where: { id: justification.id },
      data: { status, reviewedById: reviewerId, reviewedAt: now },
    })

    const classSession = await transaction.classSession.upsert({
      where: { classId_date: { classId: justification.classId, date: justification.date } },
      update: {},
      create: { classId: justification.classId, date: justification.date },
      select: { id: true },
    })

    const attendanceStatus: AttendanceStatus = action === 'approve' ? 'JUSTIFIED' : 'ABSENT'

    const existing = await transaction.attendance.findFirst({
      where: { sessionId: classSession.id, studentId: justification.studentId },
      select: { id: true },
    })

    const data = {
      present: false,
      status: attendanceStatus,
      hoursTrained: 0,
      sessionType: 'class',
      classId: justification.classId,
      notes: justification.reason,
      isOutOfSchedule: false,
      confirmedById: reviewerId,
      confirmedAt: now,
    }

    if (existing) {
      await transaction.attendance.update({ where: { id: existing.id }, data })
      return
    }

    await transaction.attendance.create({
      data: {
        ...data,
        sessionId: classSession.id,
        studentId: justification.studentId,
        date: justification.date,
      },
    })
  })

  return { attendanceStatus: status }
}

export interface PendingJustificationRow {
  id: string
  studentId: string
  studentName: string
  classId: string
  className: string
  date: string
  reason: string
  createdAt: string
}

/** Justificaciones pendientes de las clases que imparte un instructor. */
export async function getInstructorPendingJustifications(userId: string): Promise<PendingJustificationRow[]> {
  const rows = await db.absenceJustification.findMany({
    where: {
      status: 'PENDING',
      class: { instructorId: userId },
      student: { status: StudentStatus.ACTIVE },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    include: {
      class: { select: { id: true, name: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    studentName: `${row.student.firstName} ${row.student.lastName}`,
    classId: row.classId,
    className: row.class.name,
    date: row.date.toISOString().slice(0, 10),
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  }))
}
