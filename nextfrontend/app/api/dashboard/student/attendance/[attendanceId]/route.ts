import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const punchEditSchema = z.object({
  hoursTrained: z.number().min(0.5).max(12).optional(),
  sessionType: z.string().trim().min(1).max(50).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
})

const SESSION_TYPES = ['class', 'private', 'autonomous', 'seminar', 'other'] as const

interface PunchRouteContext {
  params: Promise<{ attendanceId: string }>
}

export async function PATCH(request: Request, { params }: PunchRouteContext) {
  const session = await auth()

  if (session?.user?.role !== 'STUDENT' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = punchEditSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de punch-in no válidos' }, { status: 400 })
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
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
  })
}

export async function DELETE(_request: Request, { params }: PunchRouteContext) {
  const session = await auth()

  if (session?.user?.role !== 'STUDENT' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
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

  await db.attendance.delete({ where: { id: attendance.id } })

  return NextResponse.json({ ok: true })
}