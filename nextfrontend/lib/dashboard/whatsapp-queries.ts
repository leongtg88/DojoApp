import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { isWithinServiceWindow } from '@/lib/integrations/whatsapp'
import type { AdminWhatsAppConversation, AdminWhatsAppMessage, AdminWhatsAppThread } from '@/types/dashboard'

const CONVERSATION_LIMIT = 100
const THREAD_LIMIT = 200

/**
 * Bandeja de entrada de WhatsApp. Los modelos WhatsAppContact/WhatsAppMessage no
 * están vinculados a una escuela, por lo que el listado es global para cualquier
 * administrador autorizado (SCHOOL_ADMIN o SUPERADMIN).
 */
export async function getAdminWhatsAppConversations(userId: string): Promise<AdminWhatsAppConversation[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const contacts = await db.whatsAppContact.findMany({
    orderBy: [{ lastInboundAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
    take: CONVERSATION_LIMIT,
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  return contacts.map((contact) => {
    const last = contact.messages[0] ?? null

    return {
      id: contact.id,
      phone: contact.phone,
      userId: contact.userId,
      userName: contact.user?.name ?? contact.user?.email ?? null,
      optIn: contact.optIn,
      lastInboundAt: contact.lastInboundAt?.toISOString() ?? null,
      updatedAt: contact.updatedAt.toISOString(),
      lastMessage: last?.body ?? last?.templateName ?? null,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      lastDirection: last?.direction ?? null,
      withinServiceWindow: isWithinServiceWindow(contact.lastInboundAt),
    }
  })
}

export async function getAdminWhatsAppThread(userId: string, contactId: string): Promise<AdminWhatsAppThread | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const contact = await db.whatsAppContact.findUnique({
    where: { id: contactId },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: THREAD_LIMIT },
    },
  })

  if (!contact) {
    return null
  }

  const messages: AdminWhatsAppMessage[] = [...contact.messages].reverse().map((message) => ({
    id: message.id,
    direction: message.direction,
    fromNumber: message.fromNumber,
    toNumber: message.toNumber,
    body: message.body,
    templateName: message.templateName,
    status: message.status,
    errorCode: message.errorCode,
    createdAt: message.createdAt.toISOString(),
    sentAt: message.sentAt?.toISOString() ?? null,
  }))

  const last = contact.messages[0] ?? null

  return {
    id: contact.id,
    phone: contact.phone,
    userId: contact.userId,
    userName: contact.user?.name ?? contact.user?.email ?? null,
    optIn: contact.optIn,
    lastInboundAt: contact.lastInboundAt?.toISOString() ?? null,
    updatedAt: contact.updatedAt.toISOString(),
    lastMessage: last?.body ?? last?.templateName ?? null,
    lastMessageAt: last?.createdAt.toISOString() ?? null,
    lastDirection: last?.direction ?? null,
    withinServiceWindow: isWithinServiceWindow(contact.lastInboundAt),
    messages,
  }
}
