import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const confirmAllSchema = z.object({
  studentId: z.string().trim().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
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
      student: {
        classEnrollments: {
          some: {
            status: 'ACTIVE',
            class: { instructorId: session.user.id },
          },
        },
      },
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