import { db } from '@/lib/db'
import { notifyPriceRequestByTelegram } from '@/lib/integrations/telegram'
import { notifyPriceRequestByWhatsApp } from '@/lib/integrations/whatsapp'
import { buildCotizacionText } from '@/lib/whatsapp'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'

const quoteSchema = z.object({
  nombre: z.string().trim().min(2).max(160),
  whatsapp: z.string().trim().max(30).optional().default(''),
  email: z.string().trim().max(320).optional().default(''),
  plan_seleccionado: z.string().trim().min(1).max(160),
  plan_precio: z.string().trim().min(1).max(80),
  protecciones: z.string().trim().max(160).optional().default(''),
  protecciones_precio: z.string().trim().max(80).optional().default(''),
  descuento_seleccionado: z.string().trim().max(160).optional().default(''),
  acuerdo_pago: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  const result = quoteSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ ok: false, error: 'Faltan datos de la cotización' }, { status: 400 })
  }

  const ip = getClientIp(request.headers)
  const ipAttempt = await consumeRateLimit(`quote:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return rateLimitResponse(
      ipAttempt.retryAfterSeconds,
      'Demasiadas solicitudes de precios desde esta dirección. Inténtalo de nuevo más tarde.',
    )
  }

  const data = result.data
  const email = data.email ? data.email.toLowerCase() : null
  const requested =
    [
      data.plan_seleccionado,
      data.descuento_seleccionado && data.descuento_seleccionado !== 'Ninguno'
        ? `Descuento: ${data.descuento_seleccionado}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || data.plan_precio

  const summary = buildCotizacionText({
    nombre: data.nombre,
    whatsapp: data.whatsapp,
    email: data.email,
    plan_seleccionado: data.plan_seleccionado,
    plan_precio: data.plan_precio,
    protecciones: data.protecciones,
    protecciones_precio: data.protecciones_precio,
    descuento_seleccionado: data.descuento_seleccionado,
    acuerdo_pago: data.acuerdo_pago,
  })

  if (email) {
    const branch = await db.branch.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, schoolId: true },
    })

    if (branch) {
      await db.enrollment.upsert({
        where: { contactEmail_status: { contactEmail: email, status: 'PENDING' } },
        update: {
          applicantName: data.nombre,
          interest: 'Precios / Cotización',
          quote: requested,
          contactPhone: data.whatsapp || null,
          notes: summary,
          schoolId: branch.schoolId,
          branchId: branch.id,
        },
        create: {
          origin: 'ASSISTANT',
          applicantName: data.nombre,
          interest: 'Precios / Cotización',
          quote: requested,
          contactEmail: email,
          contactPhone: data.whatsapp || null,
          notes: summary,
          schoolId: branch.schoolId,
          branchId: branch.id,
        },
        select: { id: true },
      })
    }
  }

  await notifyPriceRequestByTelegram({
    name: data.nombre,
    phone: data.whatsapp || null,
    email,
    requested,
    summary,
  })

  await notifyPriceRequestByWhatsApp({
    name: data.nombre,
    phone: data.whatsapp || null,
    email,
    requested,
  })

  return NextResponse.json({ ok: true })
}
