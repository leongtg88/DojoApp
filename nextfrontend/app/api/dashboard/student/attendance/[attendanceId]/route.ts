import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { clearAttendancePracticeLogs, replaceAttendancePracticeLogs } from '@/lib/dashboard/technique-reps'
import type { PracticePlace } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const practiceLineSchema = z.object({
  techniqueId: z.string().trim().min(1).max(100),
  repetitions: z.number().int().min(1).max(100_000),
  place: z.enum(['DOJO', 'FUERA']).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

const punchEditSchema = z.object({
  hoursTrained: z.number().min(0.5).max(12).optional(),
  sessionType: z.string().trim().min(1).max(50).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  practiceLogs: z.array(practiceLineSchema).max(30).optional(),
})

const SESSION_TYPES = ['class', 'private', 'autonomous', 'seminar', 'other'] as const

interface PunchRouteContext {
  params: Promise<{ attendanceId: string }>
}

export async function PATCH(request: Request, { params }: PunchRouteContext) {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = punchEditSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de punch-in no válidos' }, { status: 400 })
  }

  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const { attendanceId } = await params
  const attendance = await db.attendance.findFirst({
    where: { id: attendanceId, studentId: student.id },
  })

  if (!attendance) {
    return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  }

  if (attendance.status !== 'PENDING') {
    return NextResponse.json({ error: 'Tu práctica ya fue confirmada por el instructor y no se puede editar' }, { status: 409 })
  }

  const data: Record<string, unknown> = {}

  if (result.data.hoursTrained !== undefined) data.hoursTrained = result.data.hoursTrained
  if (result.data.sessionType !== undefined) {
    if (!SESSION_TYPES.includes(result.data.sessionType as (typeof SESSION_TYPES)[number])) {
      return NextResponse.json({ error: 'Tipo de sesión no válido' }, { status: 400 })
    }
    data.sessionType = result.data.sessionType
  }
  if (result.data.notes !== undefined) data.notes = result.data.notes

  const updated = await db.attendance.update({
    where: { id: attendance.id },
    data,
  })

  let practiceWarning: string | null = null
  if (result.data.practiceLogs) {
    try {
      const practiceResult = await replaceAttendancePracticeLogs(
        student.id,
        attendance.id,
        result.data.practiceLogs.map((line) => ({
          techniqueId: line.techniqueId,
          repetitions: line.repetitions,
          place: (line.place ?? 'DOJO') as PracticePlace,
          notes: line.notes ?? null,
          date: attendance.date,
        })),
      )
      if (practiceResult.invalid > 0) {
        practiceWarning = 'Algunas repeticiones no se registraron porque la técnica no pertenece al catálogo de la escuela.'
      }
    } catch (error) {
      console.error('Error actualizando repeticiones del punch:', error)
      practiceWarning = 'No se pudieron guardar las repeticiones de técnicas. El resto de la corrección sí quedó guardada.'
    }
  }

  return NextResponse.json({
    record: {
      id: updated.id,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: updated.date.toISOString(),
      hoursTrained: updated.hoursTrained,
      sessionType: updated.sessionType,
      status: updated.status,
      present: updated.present,
      confirmedByName: null,
      notes: updated.notes,
      punchedAt: updated.punchedAt.toISOString(),
    },
    ...(practiceWarning ? { practiceWarning } : {}),
  })
}

export async function DELETE(request: Request, { params }: PunchRouteContext) {
  const session = await auth()

  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const { attendanceId } = await params
  const attendance = await db.attendance.findFirst({
    where: { id: attendanceId, studentId: student.id },
  })

  if (!attendance) {
    return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  }

  if (attendance.status !== 'PENDING') {
    return NextResponse.json({ error: 'Tu práctica ya fue confirmada por el instructor y no se puede eliminar' }, { status: 409 })
  }

  // Revierte las repeticiones registradas (contadores del expediente) y borra
  // sus logs antes de eliminar la asistencia, evitando registros huérfanos.
  await db.$transaction(async (tx) => {
    await clearAttendancePracticeLogs(tx, attendance.id)
    await tx.attendance.delete({ where: { id: attendance.id } })
  })

  return NextResponse.json({ ok: true })
}