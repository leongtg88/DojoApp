import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizePhone, sendWhatsAppText } from '@/lib/integrations/whatsapp'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
}

const STOP_KEYWORDS = new Set(['STOP', 'BAJA', 'CANCELAR', 'UNSUBSCRIBE', 'ALTO'])

interface InboundMessage {
  from?: string
  id?: string
  timestamp?: string
  type?: string
  text?: { body?: string }
  button?: { text?: string }
  interactive?: { button_reply?: { title?: string } }
}

interface DeliveryStatus {
  id?: string
  status?: string
  recipient_id?: string
  errors?: { code?: number; title?: string }[]
}

interface ChangeValue {
  contacts?: { wa_id?: string; profile?: { name?: string } }[]
  messages?: InboundMessage[]
  statuses?: DeliveryStatus[]
}

interface WhatsAppWebhookPayload {
  object?: string
  entry?: { changes?: { value?: ChangeValue }[] }[]
}

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) {
    console.warn('[whatsapp] WHATSAPP_APP_SECRET no configurado; se omite la validación de firma.')
    return true
  }
  if (!header?.startsWith('sha256=')) return false

  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'), 'hex')
  const received = Buffer.from(header.slice('sha256='.length), 'hex')

  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

function extractBody(message: InboundMessage): string | null {
  return (
    message.text?.body ??
    message.button?.text ??
    message.interactive?.button_reply?.title ??
    null
  )
}

async function handleStatus(status: DeliveryStatus): Promise<void> {
  if (!status.id || !status.status) return

  const mapped = STATUS_MAP[status.status]
  if (!mapped) return

  try {
    await db.whatsAppMessage.update({
      where: { wamid: status.id },
      data: {
        status: mapped,
        errorCode: status.errors?.[0]?.code ? String(status.errors[0].code) : undefined,
      },
    })
  } catch {
    // El wamid puede no existir (mensaje ajeno a la app): se ignora.
  }
}

async function handleInbound(message: InboundMessage): Promise<void> {
  const phone = normalizePhone(message.from)
  if (!phone) return

  const body = extractBody(message)

  const contact = await db.whatsAppContact.upsert({
    where: { phone },
    create: { phone, lastInboundAt: new Date() },
    update: { lastInboundAt: new Date() },
  })

  await db.whatsAppMessage
    .create({
      data: {
        direction: 'INBOUND',
        wamid: message.id ?? null,
        contactId: contact.id,
        userId: contact.userId,
        fromNumber: phone,
        body,
        status: 'RECEIVED',
      },
    })
    .catch((error) => console.error('[whatsapp] No fue posible registrar el entrante', error))

  const keyword = body?.trim().toUpperCase()
  if (keyword && STOP_KEYWORDS.has(keyword)) {
    await db.whatsAppContact
      .update({
        where: { id: contact.id },
        data: { optIn: false, optOutAt: new Date() },
      })
      .catch((error) => console.error('[whatsapp] No fue posible registrar el opt-out', error))

    await sendWhatsAppText({
      to: phone,
      body: 'Listo. No volverás a recibir mensajes automáticos. Si lo necesitas, escríbenos de nuevo.',
      contactId: contact.id,
      userId: contact.userId,
    })
    return
  }

  const autoReply = process.env.WHATSAPP_AUTO_REPLY
  if (autoReply) {
    await sendWhatsAppText({
      to: phone,
      body: autoReply,
      contactId: contact.id,
      userId: contact.userId,
    })
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload
  } catch {
    return NextResponse.json({ received: true })
  }

  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        if (!value) continue

        for (const status of value.statuses ?? []) {
          await handleStatus(status)
        }

        for (const message of value.messages ?? []) {
          await handleInbound(message)
        }
      }
    }
  } catch (error) {
    console.error('[whatsapp] Error procesando webhook', error)
  }

  return NextResponse.json({ received: true })
}
