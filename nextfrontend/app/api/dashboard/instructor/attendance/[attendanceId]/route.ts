import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const rectifySchema = z.object({
  action: z.enum(['confirm', 'reject']).optional(),
  hoursTrained: z.number().min(0.5).max(12).optional(),
  sessionType: z.string().trim().min(1).max(50).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
})

const SESSION_TYPES = ['class', 'private', 'autonomous', 'seminar', 'other'] as const

interface AttendanceRouteContext {
  params: Promise<{ attendanceId: string }>
}

export async function PATCH(request: Request, { params }: AttendanceRouteContext) {
  const session = await auth()

  if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = rectifySchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  }

  const { attendanceId } = await params
  const attendance = await db.attendance.findFirst({
    where: { id: attendanceId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classEnrollments: {
            where: { status: 'ACTIVE' },
            select: { class: { select: { instructorId: true } } },
          },
        },
      },
    },
  })

  if (!attendance) {
    return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  }

  const isOwned = attendance.student.classEnrollments.some(
    ({ class: enrolledClass }) => enrolledClass.instructorId === session.user.id,
  )

  if (!isOwned) {
    return NextResponse.json({ error: 'No tienes acceso a este registro' }, { status: 403 })
  }

  if (attendance.sessionId) {
    return NextResponse.json({ error: 'Este registro pertenece a un pase de lista de clase. Edítalo desde la clase.' }, { status: 409 })
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

  const now = new Date()
  if (result.data.action === 'confirm') {
    data.status = 'CONFIRMED'
    data.confirmedAt = now
    data.confirmedById = session.user.id
  } else if (result.data.action === 'reject') {
    data.status = 'REJECTED'
    data.confirmedAt = now
    data.confirmedById = session.user.id
  }

  const updated = await db.attendance.update({
    where: { id: attendance.id },
    data,
    include: { confirmedBy: { select: { name: true } } },
  })

  return NextResponse.json({
    record: {
      id: updated.id,
      studentId: attendance.student.id,
      studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
      date: updated.date.toISOString(),
      hoursTrained: updated.hoursTrained,
      sessionType: updated.sessionType,
      status: updated.status,
      present: updated.present,
      confirmedByName: updated.confirmedBy?.name ?? null,
      notes: updated.notes,
      punchedAt: updated.punchedAt.toISOString(),
    },
  })
}