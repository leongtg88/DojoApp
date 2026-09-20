import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { registerPracticeLogs, removePracticeLog } from '@/lib/dashboard/technique-reps'
import type { PracticePlace } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const practiceLogSchema = z.object({
  repetitions: z.number().int().min(1).max(100_000),
  place: z.enum(['DOJO', 'FUERA']).optional(),
  notes: z.string().trim().max(1_000).nullable().optional(),
  date: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Fecha de práctica inválida' })
    .optional(),
})

interface PracticeRouteContext {
  params: Promise<{ techniqueId: string }>
}

async function resolveStudentId(userId: string): Promise<string | null> {
  const student = await db.student.findUnique({ where: { userId }, select: { id: true } })
  return student?.id ?? null
}

export async function POST(request: Request, { params }: PracticeRouteContext) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'STUDENT')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = practiceLogSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de práctica no válidos' }, { status: 400 })
  }

  const studentId = await resolveStudentId(session.user.id)

  if (!studentId) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const { techniqueId } = await params
  const created = await registerPracticeLogs(studentId, [
    {
      techniqueId,
      repetitions: result.data.repetitions,
      place: (result.data.place ?? 'DOJO') as PracticePlace,
      notes: result.data.notes ?? null,
      date: result.data.date ? new Date(result.data.date) : undefined,
    },
  ])

  if (created === 0) {
    return NextResponse.json({ error: 'La técnica no está asignada a tu expediente' }, { status: 404 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'STUDENT')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const logId = new URL(request.url).searchParams.get('logId')

  if (!logId) {
    return NextResponse.json({ error: 'Registro no especificado' }, { status: 400 })
  }

  const studentId = await resolveStudentId(session.user.id)

  if (!studentId) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const removed = await removePracticeLog(studentId, logId)

  if (!removed) {
    return NextResponse.json({ error: 'Registro de práctica no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
