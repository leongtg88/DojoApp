import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const confirmAllSchema = z.object({
  studentId: z.string().trim().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  attendanceIds: z.array(z.string().trim().min(1)).max(500).optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = confirmAllSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Filtros no válidos' }, { status: 400 })
  }

  const pending = await db.attendance.findMany({
    where: {
      status: 'PENDING',
      sessionId: null,
      ...(result.data.studentId ? { studentId: result.data.studentId } : {}),
      ...(result.data.attendanceIds ? { id: { in: result.data.attendanceIds } } : {}),
      ...(result.data.date
        ? {
            date: {
              gte: new Date(`${result.data.date}T00:00:00.000Z`),
              lt: (() => {
                const next = new Date(`${result.data.date}T00:00:00.000Z`)
                next.setUTCDate(next.getUTCDate() + 1)
                return next
              })(),
            },
          }
        : {}),
      // Pertenencia al instructor: por matrícula activa, por la clase del registro
      // o por la clase de su sesión (mantiene punch-ins históricos).
      OR: [
        {
          student: {
            classEnrollments: {
              some: {
                status: 'ACTIVE',
                class: { instructorId: session.user.id },
              },
            },
          },
        },
        { class: { instructorId: session.user.id } },
        { session: { class: { instructorId: session.user.id } } },
      ],
    },
    select: { id: true },
  })

  const now = new Date()

  if (pending.length > 0) {
    await db.attendance.updateMany({
      where: { id: { in: pending.map(({ id }) => id) } },
      data: { status: 'CONFIRMED', confirmedById: session.user.id, confirmedAt: now },
    })
  }

  return NextResponse.json({ confirmed: pending.length })
}