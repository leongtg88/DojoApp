import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const enrollmentSchema = z.object({
  nombre: z.string().trim().min(2).max(160),
  tipo: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  whatsapp: z.string().trim().max(30).optional(),
  horario_pref: z.string().trim().max(160).optional(),
  programa: z.string().trim().max(160).optional(),
  nota: z.string().trim().max(1_000).optional(),
  plan_seleccionado: z.string().trim().max(160).optional(),
  plan_precio: z.string().trim().max(80).optional(),
})

export async function POST(request: Request) {
  const result = enrollmentSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ ok: false, error: 'Faltan datos de contacto válidos' }, { status: 400 })
  }

  const branch = await db.branch.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, schoolId: true },
  })

  if (!branch) {
    return NextResponse.json({ ok: false, error: 'No hay una sede disponible para la inscripción' }, { status: 503 })
  }

  const data = result.data
  const email = data.email.toLowerCase()
  const quote = [data.plan_seleccionado, data.plan_precio].filter(Boolean).join(' · ') || null
  const enrollment = await db.enrollment.upsert({
    where: { contactEmail_status: { contactEmail: email, status: 'PENDING' } },
    update: {
      applicantName: data.nombre,
      interest: data.programa || data.tipo,
      schedule: data.horario_pref || null,
      quote,
      contactPhone: data.whatsapp || null,
      notes: data.nota || null,
      schoolId: branch.schoolId,
      branchId: branch.id,
    },
    create: {
      origin: 'ASSISTANT',
      applicantName: data.nombre,
      interest: data.programa || data.tipo,
      schedule: data.horario_pref || null,
      quote,
      contactEmail: email,
      contactPhone: data.whatsapp || null,
      notes: data.nota || null,
      schoolId: branch.schoolId,
      branchId: branch.id,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: enrollment.id })
}
