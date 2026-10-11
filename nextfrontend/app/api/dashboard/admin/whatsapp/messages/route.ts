import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import {
  isWhatsAppConfigured,
  isWithinServiceWindow,
  sendWhatsAppTextNow,
} from '@/lib/integrations/whatsapp'
import { getAdminWhatsAppConversations, getAdminWhatsAppThread } from '@/lib/dashboard/whatsapp-queries'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const sendMessageSchema = z.object({
  contactId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, 'El mensaje no puede estar vacío.')
    .max(4096, 'El mensaje supera el límite de 4096 caracteres.'),
})

async function requireAdmin(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const scope = await getAdminScope(session.user.id)
  if (!scope) return null

  return session.user.id
}

export async function GET(request: Request) {
  const userId = await requireAdmin()

  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const contactId = new URL(request.url).searchParams.get('contactId')

  if (contactId) {
    const thread = await getAdminWhatsAppThread(userId, contactId)

    if (!thread) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ thread })
  }

  const conversations = await getAdminWhatsAppConversations(userId)

  return NextResponse.json({ conversations: conversations ?? [] })
}

export async function POST(request: Request) {
  const userId = await requireAdmin()

  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = sendMessageSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Datos no válidos'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const contact = await db.whatsAppContact.findUnique({
    where: { id: result.data.contactId },
    select: { id: true, phone: true, userId: true, lastInboundAt: true },
  })

  if (!contact) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp no está configurado en el servidor.', code: 'NOT_CONFIGURED' },
      { status: 503 },
    )
  }

  if (!isWithinServiceWindow(contact.lastInboundAt)) {
    return NextResponse.json(
      {
        error: 'Pasaron más de 24h desde el último mensaje del contacto. Meta exige una plantilla aprobada para reiniciar la conversación.',
        code: 'OUTSIDE_WINDOW',
      },
      { status: 409 },
    )
  }

  const outcome = await sendWhatsAppTextNow({
    to: contact.phone,
    body: result.data.body,
    contactId: contact.id,
    userId: contact.userId,
  })

  if (!outcome.ok) {
    return NextResponse.json(
      { error: 'No fue posible enviar el mensaje por WhatsApp.', code: outcome.errorCode ?? 'SEND_FAILED' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, wamid: outcome.wamid ?? null })
}
