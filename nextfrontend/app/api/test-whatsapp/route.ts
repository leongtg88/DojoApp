import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  isWhatsAppConfigured,
  normalizePhone,
  sendWhatsAppTemplate,
  sendWhatsAppTextNow,
} from '@/lib/integrations/whatsapp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_TEMPLATE = 'hello_world'
const DEFAULT_LOCALE = 'en_US'

interface TestBody {
  to?: string
  tipo?: 'text' | 'template'
  mensaje?: string
  template?: string
  locale?: string
}

/**
 * Autoriza la ruta solo en desarrollo o con la cabecera `x-test-secret`
 * igual a CRON_SECRET. Nunca queda abierta en producción.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && request.headers.get('x-test-secret') === secret
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado', code: 'UNAUTHORIZED' }, { status: 403 })
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp no está configurado (faltan WHATSAPP_ACCESS_TOKEN y/o WHATSAPP_PHONE_NUMBER_ID).', code: 'NOT_CONFIGURED' },
      { status: 503 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as TestBody

  const to = normalizePhone(body.to)
  if (!to) {
    return NextResponse.json({ error: 'Debes indicar un número de destino válido en el campo "to".', code: 'BAD_NUMBER' }, { status: 400 })
  }

  const tipo = body.tipo ?? 'template'

  if (tipo === 'text') {
    const mensaje = body.mensaje?.trim()
    if (!mensaje) {
      return NextResponse.json({ error: 'Falta el campo "mensaje" para el envío de texto.', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const outcome = await sendWhatsAppTextNow({ to, body: mensaje })
    return NextResponse.json({ ok: outcome.ok, to, tipo, wamid: outcome.wamid ?? null, errorCode: outcome.errorCode ?? null }, {
      status: outcome.ok ? 200 : 502,
    })
  }

  const name = body.template?.trim() || DEFAULT_TEMPLATE
  const outcome = await sendWhatsAppTemplate({
    to,
    name,
    params: body.mensaje ? [body.mensaje] : undefined,
    locale: body.locale?.trim() || DEFAULT_LOCALE,
  })

  return NextResponse.json({ ok: outcome.ok, to, tipo, template: name, wamid: outcome.wamid ?? null, errorCode: outcome.errorCode ?? null }, {
    status: outcome.ok ? 200 : 502,
  })
}

/**
 * Diagnóstico: confirma si WhatsApp está configurado y muestra los últimos
 * mensajes/contactos registrados por el webhook y la cola. Misma protección
 * que el POST (solo dev o cabecera x-test-secret).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado', code: 'UNAUTHORIZED' }, { status: 403 })
  }

  const [messages, contacts] = await Promise.all([
    db.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        direction: true,
        toNumber: true,
        fromNumber: true,
        status: true,
        templateName: true,
        body: true,
        createdAt: true,
      },
    }),
    db.whatsAppContact.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { phone: true, optIn: true, lastInboundAt: true, updatedAt: true },
    }),
  ])

  return NextResponse.json({ configured: isWhatsAppConfigured(), messages, contacts })
}
