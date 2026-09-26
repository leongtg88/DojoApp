interface EnrollmentNotification {
  applicantName: string
  phone: string | null
  email: string
  interest: string | null
}

interface PriceRequestNotification {
  name: string
  phone: string | null
  email: string | null
  requested: string | null
  summary: string
}

interface ReviewNotification {
  authorName: string
  relationship: string | null
  rating: number
  message: string
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_IDS)
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getChatIds(): string[] {
  return (process.env.TELEGRAM_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

function formatDate(): string {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date())
}

/**
 * Envía un mensaje de texto a todos los chats configurados. Es "best-effort":
 * nunca lanza error para no romper el flujo que la invoca.
 */
async function sendMessageToTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatIds = getChatIds()

  if (!token || chatIds.length === 0) {
    return
  }

  await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(5000),
        })
      } catch (error) {
        console.error('[telegram] No fue posible enviar la notificación al chat', chatId, error)
      }
    }),
  )
}

function buildEnrollmentMessage(input: EnrollmentNotification): string {
  const lines = [
    '🥋 <b>Nueva inscripción</b>',
    `Aspirantes: ${escapeHtml(input.applicantName)}`,
  ]

  if (input.phone) lines.push(`Teléfono: ${escapeHtml(input.phone)}`)
  lines.push(`Email: ${escapeHtml(input.email)}`)
  if (input.interest) lines.push(`Interés: ${escapeHtml(input.interest)}`)
  lines.push(`Fecha: ${formatDate()}`)

  return lines.join('\n')
}

function buildPriceRequestMessage(input: PriceRequestNotification): string {
  const lines = [
    '💰 <b>Solicitud de precios (Asistente)</b>',
    `Nombre: ${escapeHtml(input.name)}`,
  ]

  lines.push(`Teléfono: ${input.phone ? escapeHtml(input.phone) : 'No proporcionado'}`)
  lines.push(`Email: ${input.email ? escapeHtml(input.email) : 'No proporcionado'}`)
  if (input.requested) lines.push(`Solicitó: ${escapeHtml(input.requested)}`)

  lines.push('', '<b>Resumen de precios generado:</b>', escapeHtml(input.summary))
  lines.push('', `Fecha: ${formatDate()}`)

  return lines.join('\n')
}

function buildReviewMessage(input: ReviewNotification): string {
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, input.rating)))
  const lines = [
    '📝 <b>Nueva reseña de padre/tutor</b>',
    `Autor: ${escapeHtml(input.authorName)}`,
  ]

  if (input.relationship) lines.push(`Relación: ${escapeHtml(input.relationship)}`)
  lines.push(`Valoración: ${stars} (${input.rating}/5)`)
  lines.push('', escapeHtml(input.message))
  lines.push('', `Fecha: ${formatDate()}`)
  lines.push('Pendiente de aprobación en el panel.')

  return lines.join('\n')
}

/**
 * Envía la notificación de una nueva inscripción a todos los chats configurados.
 * Es "best-effort": nunca lanza error para no romper el flujo que la invoca.
 */
export async function notifyEnrollmentByTelegram(input: EnrollmentNotification): Promise<void> {
  await sendMessageToTelegram(buildEnrollmentMessage(input))
}

/**
 * Notifica una solicitud de precios del asistente con los datos de contacto y
 * el resumen de precios generado. Es "best-effort".
 */
export async function notifyPriceRequestByTelegram(input: PriceRequestNotification): Promise<void> {
  await sendMessageToTelegram(buildPriceRequestMessage(input))
}

/**
 * Notifica una reseña recién enviada por un padre/tutor. Es "best-effort".
 */
export async function notifyReviewByTelegram(input: ReviewNotification): Promise<void> {
  await sendMessageToTelegram(buildReviewMessage(input))
}

/**
 * Envía un documento (p. ej. el carnet de la federación rellenado) a todos los
 * chats configurados, mediante multipart. Es "best-effort".
 */
export async function sendDocumentToTelegram(input: {
  fileName: string
  bytes: Uint8Array
  mime: string
  caption?: string
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatIds = (process.env.TELEGRAM_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (!token || chatIds.length === 0) {
    return
  }

  await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const form = new FormData()
        form.append('chat_id', chatId)
        form.append(
          'document',
          new Blob([Buffer.from(input.bytes)], { type: input.mime }),
          input.fileName,
        )
        if (input.caption) form.append('caption', input.caption)

        await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(15_000),
        })
      } catch (error) {
        console.error('[telegram] No fue posible enviar el documento al chat', chatId, error)
      }
    }),
  )
}
