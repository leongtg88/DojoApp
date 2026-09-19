interface EnrollmentNotification {
  applicantName: string
  phone: string | null
  email: string
  interest: string | null
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_IDS)
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildEnrollmentMessage(input: EnrollmentNotification): string {
  const date = new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date())

  const lines = [
    '🥋 <b>Nueva inscripción</b>',
    `Aspirantes: ${escapeHtml(input.applicantName)}`,
  ]

  if (input.phone) lines.push(`Teléfono: ${escapeHtml(input.phone)}`)
  lines.push(`Email: ${escapeHtml(input.email)}`)
  if (input.interest) lines.push(`Interés: ${escapeHtml(input.interest)}`)
  lines.push(`Fecha: ${date}`)

  return lines.join('\n')
}

/**
 * Envía la notificación de una nueva inscripción a todos los chats configurados.
 * Es "best-effort": nunca lanza error para no romper el flujo que la invoca.
 */
export async function notifyEnrollmentByTelegram(input: EnrollmentNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatIds = (process.env.TELEGRAM_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (!token || chatIds.length === 0) {
    return
  }

  const text = buildEnrollmentMessage(input)

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
