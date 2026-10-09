import { db } from '@/lib/db'
import type { AttendanceStatus } from '@/lib/generated/prisma'

export interface AttendanceRosterRecord {
  studentId: string
  present: boolean
  justified?: boolean
  notes: string | null
}

export interface SaveClassAttendanceParams {
  classId: string
  date: string
  records: AttendanceRosterRecord[]
  confirmedById: string
  defaultHours: number
  enrolledStudentIds: Set<string>
}

/**
 * Guarda el pase de lista de una clase/fecha (usado por instructor y admin).
 *
 * Por cada alumno crea o actualiza su registro de asistencia, fusionando un
 * punch-in del mismo día (sessionId null) para evitar el doble conteo.
 * Estado: presente → CONFIRMED; ausente justificada → JUSTIFIED;
 * ausente sin justificar → ABSENT.
 */
export async function saveClassAttendance({
  classId,
  date,
  records,
  confirmedById,
  defaultHours,
  enrolledStudentIds,
}: SaveClassAttendanceParams): Promise<void> {
  const sessionDate = new Date(`${date}T00:00:00.000Z`)
  const dayAfter = new Date(sessionDate.getTime() + 86_400_000)

  await db.$transaction(async (transaction) => {
    const classSession = await transaction.classSession.upsert({
      where: { classId_date: { classId, date: sessionDate } },
      update: { takenById: confirmedById, takenAt: new Date() },
      create: { classId, date: sessionDate, takenById: confirmedById, takenAt: new Date() },
      select: { id: true },
    })

    // Motivos de inasistencia aprobados previamente: al guardar el pase de lista
    // se conservan como falta justificada y su texto no se pisa.
    const approvedJustifications = await transaction.absenceJustification.findMany({
      where: { classId, date: sessionDate, status: 'APPROVED' },
      select: { studentId: true, reason: true },
    })
    const approvedByStudent = new Map(approvedJustifications.map((row) => [row.studentId, row.reason]))

    const savedAttendances = await Promise.all(records.map(async (record) => {
      const isConfirmed = record.present
      const approvedReason = approvedByStudent.get(record.studentId) ?? null
      const status: AttendanceStatus = isConfirmed ? 'CONFIRMED' : (record.justified || approvedReason ? 'JUSTIFIED' : 'ABSENT')
      const notes = record.notes ?? approvedReason

      // Si el pase de lista ya existe para este alumno en esta sesión, se actualiza.
      // Se conservan las horas del punch-in fusionado si ya venían de una marcación previa.
      const existing = await transaction.attendance.findFirst({
        where: { sessionId: classSession.id, studentId: record.studentId },
        select: { id: true, hoursTrained: true },
      })

      const updateData = {
        present: record.present,
        notes,
        status,
        hoursTrained: isConfirmed ? (existing && existing.hoursTrained > 0 ? existing.hoursTrained : defaultHours) : 0,
        sessionType: 'class',
        classId,
        isOutOfSchedule: !enrolledStudentIds.has(record.studentId),
        confirmedById,
        confirmedAt: new Date(),
      }

      if (existing) {
        return transaction.attendance.update({ where: { id: existing.id }, data: updateData })
      }

      // Si el alumno hizo punch-in el mismo día (sessionId null), fusiona el registro
      // en el pase de lista para evitar el doble conteo (punch + clase). Si hay varios
      // (clase + entrenamiento libre), se prefiere el que corresponde a esta clase.
      const sameDayPunches = await transaction.attendance.findMany({
        where: {
          studentId: record.studentId,
          sessionId: null,
          date: { gte: sessionDate, lt: dayAfter },
        },
        orderBy: { date: 'asc' },
        select: { id: true, hoursTrained: true, notes: true, classId: true, isOutOfSchedule: true },
      })
      const punch = sameDayPunches.find((entry) => entry.classId === classId) ?? sameDayPunches[0]

      if (punch) {
        await transaction.attendance.deleteMany({ where: { sessionId: classSession.id, studentId: record.studentId } })
        return transaction.attendance.update({
          where: { id: punch.id },
          data: {
            ...updateData,
            sessionId: classSession.id,
            notes: notes ?? punch.notes,
            hoursTrained: isConfirmed ? (punch.hoursTrained ?? defaultHours) : 0,
            classId: punch.classId ?? classId,
            isOutOfSchedule: punch.isOutOfSchedule ?? !enrolledStudentIds.has(record.studentId),
          },
        })
      }

      return transaction.attendance.create({
        data: {
          ...updateData,
          sessionId: classSession.id,
          studentId: record.studentId,
          date: sessionDate,
        },
      })
    }))

    // Reposición automática: una asistencia fuera de horario (presente) repone la
    // falta justificada más antigua sin recuperar del alumno. Solo aplica si existe
    // una justificación aprobada; sin justificación no hay nada que reponer.
    const makeUps = savedAttendances.filter((attendance) => attendance.present && attendance.isOutOfSchedule)
    for (const makeUp of makeUps) {
      const pendingAbsence = await transaction.attendance.findFirst({
        where: {
          studentId: makeUp.studentId,
          status: 'JUSTIFIED',
          present: false,
          recoveredById: null,
          date: { lte: makeUp.date },
          id: { not: makeUp.id },
        },
        orderBy: { date: 'asc' },
        select: { id: true },
      })

      if (pendingAbsence) {
        await transaction.attendance.update({
          where: { id: pendingAbsence.id },
          data: { recoveredById: makeUp.id },
        })
      }
    }
  })
}
