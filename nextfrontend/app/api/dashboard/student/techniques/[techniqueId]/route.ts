import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const practiceUpdateSchema = z.object({
  inPractice: z.boolean().optional(),
  practiceHours: z.number().min(0).max(1_000).optional(),
  lastPracticeDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Fecha de práctica inválida' })
    .optional()
    .nullable(),
  notes: z.string().trim().max(1_000).optional().nullable(),
})

interface PracticeRouteContext {
  params: Promise<{ techniqueId: string }>
}

export async function PATCH(request: Request, { params }: PracticeRouteContext) {
  const session = await auth()

  if (session?.user?.role !== 'STUDENT' || !session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = practiceUpdateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de práctica no válidos' }, { status: 400 })
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Perfil de estudiante no encontrado' }, { status: 404 })
  }

  const { techniqueId } = await params
  const technique = await db.studentTechnique.findFirst({
    where: { id: techniqueId, studentId: student.id },
    select: { id: true },
  })

  if (!technique) {
    return NextResponse.json({ error: 'Técnica no encontrada' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  if (result.data.inPractice !== undefined) data.inPractice = result.data.inPractice
  if (result.data.practiceHours !== undefined) data.practiceHours = result.data.practiceHours
  if (result.data.lastPracticeDate !== undefined) data.lastPracticeDate = result.data.lastPracticeDate ? new Date(result.data.lastPracticeDate) : null
  if (result.data.notes !== undefined) data.notes = result.data.notes

  const updated = await db.studentTechnique.update({
    where: { id: technique.id },
    data,
    select: {
      id: true,
      approved: true,
      inPractice: true,
      practiceHours: true,
      lastPracticeDate: true,
      notes: true,
    },
  })

  return NextResponse.json({
    technique: {
      ...updated,
      lastPracticeDate: updated.lastPracticeDate?.toISOString() ?? null,
    },
  })
}