import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const punchInSchema = z.object({
  hoursTrained: z.number().min(0.5).max(12).optional(),
  sessionType: z.string().trim().min(1).max(50).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
})

const SESSION_TYPES = ['class', 'private', 'autonomous', 'seminar', 'other'] as const

export async function POST(request: Request) {
  const session = await auth()

  if (session?.user?.role !== 'STUDENT' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = punchInSchema.safeParse(body)

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

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const existing = await db.attendance.findFirst({
    where: {
      studentId: student.id,
      sessionId: null,
      date: { gte: startOfToday, lt: startOfTomorrow },
    },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: 'Ya registraste tu práctica hoy. Puedes editarla mientras esté pendiente.' }, { status: 409 })
  }

  const sessionType = result.data.sessionType ?? 'class'

  if (!SESSION_TYPES.includes(sessionType as (typeof SESSION_TYPES)[number])) {
    return NextResponse.json({ error: 'Tipo de sesión no válido' }, { status: 400 })
  }

  const attendance = await db.attendance.create({
    data: {
      studentId: student.id,
      date: now,
      present: true,
      hoursTrained: result.data.hoursTrained ?? 1,
      sessionType,
      status: 'PENDING',
      punchedAt: now,
      notes: result.data.notes ?? null,
    },
  })

  return NextResponse.json({
    record: {
      id: attendance.id,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: attendance.date.toISOString(),
      hoursTrained: attendance.hoursTrained,
      sessionType: attendance.sessionType,
      status: attendance.status,
      present: attendance.present,
      confirmedByName: null,
      notes: attendance.notes,
      punchedAt: attendance.punchedAt.toISOString(),
    },
  }, { status: 201 })
}