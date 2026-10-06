import { db } from '@/lib/db'
import type { NotificationType, Prisma } from '@/lib/generated/prisma'

// ==================== Configuración ====================

const DEFAULT_API_VERSION = 'v21.0'
const TEMPLATE_LOCALE = process.env.WHATSAPP_TEMPLATE_LOCALE ?? 'es'
const TIME_ZONE = 'America/Santo_Domingo'
const QUIET_START_HOUR = 8
const QUIET_END_HOUR = 20
const REQUEST_TIMEOUT_MS = 8000

interface WhatsAppConfig {
  token: string
  phoneNumberId: string
  apiVersion: string
}

function getConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    return null
  }

  return {
    token,
    phoneNumberId,
    apiVersion: process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION,
  }
}

export function isWhatsAppConfigured(): boolean {
  return getConfig() !== null
}

// ==================== Teléfonos ====================

/**
 * Normaliza un número a formato E.164. Para números locales de 10 dígitos asume
 * República Dominicana/EE. UU. (+1). Devuelve null si no se puede normalizar.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null

  let digits = input.replace(/[^\d]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 10) digits = `1${digits}`

  if (digits.length < 11 || digits.length > 15) return null

  return `+${digits}`
}

// ==================== Ventana de atención y horario silencioso ====================

function getTimeZoneOffsetMs(date: Date): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(date.toLocaleString('en-US', { timeZone: TIME_ZONE }))
  return local.getTime() - utc.getTime()
}

function getLocalParts(date: Date): { hour: number; minute: number; day: number } {
  const shifted = new Date(date.getTime() + getTimeZoneOffsetMs(date))
  return {
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    day: shifted.getUTCDate(),
  }
}

export function isQuietHours(date: Date = new Date()): boolean {
  const { hour } = getLocalParts(date)
  return hour < QUIET_START_HOUR || hour >= QUIET_END_HOUR
}

function nextAllowedTime(date: Date = new Date()): Date {
  const offset = getTimeZoneOffsetMs(date)
  const shifted = new Date(date.getTime() + offset)
  const target = new Date(shifted)

  target.setUTCHours(QUIET_START_HOUR, 0, 0, 0)
  if (shifted.getUTCHours() >= QUIET_START_HOUR) {
    target.setUTCDate(target.getUTCDate() + 1)
  }

  return new Date(target.getTime() - offset)
}

export function isWithinServiceWindow(lastInboundAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!lastInboundAt) return false
  return now.getTime() - lastInboundAt.getTime() < 24 * 60 * 60 * 1000
}

// ==================== Llamada a la API ====================

interface OutboundPayload {
  to: string
  templateName?: string
  params?: string[]
  body?: string
}

interface SendOutcome {
  ok: boolean
  wamid?: string
  errorCode?: string
}

async function callApi(payload: OutboundPayload): Promise<SendOutcome> {
  const config = getConfig()
  if (!config) return { ok: false, errorCode: 'not_configured' }

  const message: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: payload.to,
  }

  if (payload.templateName) {
    message.type = 'template'
    message.template = {
      name: payload.templateName,
      language: { code: TEMPLATE_LOCALE },
      components: payload.params?.length
        ? [{ type: 'body', parameters: payload.params.map((text) => ({ type: 'text', text })) }]
        : undefined,
    }
  } else {
    message.type = 'text'
    message.text = { preview_url: false, body: payload.body ?? '' }
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    )

    const json = (await response.json().catch(() => null)) as
      | {
          messages?: { id?: string }[]
          error?: { code?: number; message?: string }
        }
      | null

    if (!response.ok) {
      console.error('[whatsapp] La API rechazó el mensaje', response.status, json?.error?.message)
      return { ok: false, errorCode: json?.error?.code ? String(json.error.code) : String(response.status) }
    }

    return { ok: true, wamid: json?.messages?.[0]?.id }
  } catch (error) {
    console.error('[whatsapp] No fue posible enviar el mensaje', error)
    return { ok: false, errorCode: 'network_error' }
  }
}

// ==================== Envío directo / encolado ====================

interface DispatchInput extends OutboundPayload {
  contactId?: string | null
  userId?: string | null
  notificationType?: NotificationType | null
  respectQuietHours?: boolean
}

async function sendAndLog(input: DispatchInput): Promise<void> {
  const outcome = await callApi(input)

  try {
    await db.whatsAppMessage.create({
      data: {
        direction: 'OUTBOUND',
        wamid: outcome.wamid ?? null,
        contactId: input.contactId ?? null,
        userId: input.userId ?? null,
        toNumber: input.to,
        templateName: input.templateName ?? null,
        params: input.params ? (input.params as Prisma.InputJsonValue) : undefined,
        body: input.body ?? null,
        status: outcome.ok ? 'SENT' : 'FAILED',
        notificationType: input.notificationType ?? null,
        errorCode: outcome.errorCode ?? null,
        sentAt: outcome.ok ? new Date() : null,
      },
    })
  } catch (error) {
    console.error('[whatsapp] No fue posible registrar el mensaje', error)
  }
}

async function enqueue(input: DispatchInput, scheduledFor: Date): Promise<void> {
  try {
    await db.whatsAppMessage.create({
      data: {
        direction: 'OUTBOUND',
        contactId: input.contactId ?? null,
        userId: input.userId ?? null,
        toNumber: input.to,
        templateName: input.templateName ?? null,
        params: input.params ? (input.params as Prisma.InputJsonValue) : undefined,
        body: input.body ?? null,
        status: 'QUEUED',
        notificationType: input.notificationType ?? null,
        scheduledFor,
      },
    })
  } catch (error) {
    console.error('[whatsapp] No fue posible encolar el mensaje', error)
  }
}

/**
 * Envía un mensaje al momento, o lo encola si estamos fuera del horario
 * permitido. Es "best-effort": nunca lanza error.
 */
async function dispatch(input: DispatchInput): Promise<void> {
  if (!isWhatsAppConfigured()) return
  if (!input.to) return

  if (input.respectQuietHours !== false && isQuietHours()) {
    await enqueue(input, nextAllowedTime())
    return
  }

  await sendAndLog(input)
}

/**
 * Envía una respuesta de texto libre. Solo es válido dentro de la ventana de
 * 24h posterior a un mensaje del usuario. Best-effort y sin horario silencioso
 * (se usa para contestar a un mensaje entrante).
 */
export async function sendWhatsAppText(input: {
  to: string
  body: string
  contactId?: string | null
  userId?: string | null
}): Promise<void> {
  await dispatch({ ...input, respectQuietHours: false })
}

/**
 * Procesa la cola de mensajes pendientes cuya hora programada ya llegó.
 * Devuelve cuántos se enviaron. Lo invoca el cron protegido.
 */
export async function processWhatsAppQueue(limit = 50): Promise<number> {
  if (!isWhatsAppConfigured()) return 0

  const due = await db.whatsAppMessage.findMany({
    where: { status: 'QUEUED', scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: 'asc' },
    take: limit,
  })

  let sent = 0

  for (const message of due) {
    if (!message.toNumber) continue

    const outcome = await callApi({
      to: message.toNumber,
      templateName: message.templateName ?? undefined,
      params: Array.isArray(message.params) ? (message.params as string[]) : undefined,
      body: message.body ?? undefined,
    })

    await db.whatsAppMessage
      .update({
        where: { id: message.id },
        data: {
          status: outcome.ok ? 'SENT' : 'FAILED',
          wamid: outcome.wamid ?? null,
          errorCode: outcome.errorCode ?? null,
          sentAt: outcome.ok ? new Date() : null,
        },
      })
      .catch((error) => console.error('[whatsapp] No fue posible actualizar el mensaje', error))

    if (outcome.ok) sent += 1
  }

  return sent
}

// ==================== Contactos y opt-in ====================

interface SetOptInInput {
  userId: string
  phone: string | null | undefined
  optIn: boolean
  source: string
  locale?: string
}

/**
 * Registra el consentimiento (o su retiro) de un usuario. Best-effort.
 */
export async function setWhatsAppOptIn({
  userId,
  phone,
  optIn,
  source,
  locale,
}: SetOptInInput): Promise<void> {
  const normalized = normalizePhone(phone)
  if (!normalized) return

  try {
    await db.whatsAppContact.upsert({
      where: { userId },
      create: {
        userId,
        phone: normalized,
        optIn,
        optInAt: optIn ? new Date() : null,
        optInSource: source,
        optOutAt: optIn ? null : new Date(),
        locale: locale ?? 'es_DO',
      },
      update: {
        phone: normalized,
        optIn,
        optInAt: optIn ? new Date() : undefined,
        optInSource: source,
        optOutAt: optIn ? null : new Date(),
      },
    })
  } catch (error) {
    console.error('[whatsapp] No fue posible guardar el opt-in', error)
  }
}

async function getOptedInContacts(
  userIds: (string | null | undefined)[],
): Promise<{ userId: string; contactId: string; phone: string }[]> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))]
  if (ids.length === 0) return []

  const contacts = await db.whatsAppContact.findMany({
    where: { userId: { in: ids }, optIn: true, optOutAt: null },
    select: { id: true, userId: true, phone: true },
  })

  return contacts
    .filter((contact): contact is typeof contact & { userId: string } => Boolean(contact.userId))
    .map((contact) => ({ userId: contact.userId, contactId: contact.id, phone: contact.phone }))
}

// ==================== Plantillas de notificaciones al alumno/tutor ====================

interface TemplateContext {
  studentName: string
  count: number
  data: Record<string, unknown>
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

interface NotificationTemplate {
  name: string
  params: (context: TemplateContext) => string[]
}

const STUDENT_TEMPLATES: Partial<Record<NotificationType, NotificationTemplate>> = {
  RANK_PROMOTED: {
    name: 'nuevo_grado',
    params: ({ studentName, data }) => [studentName, readString(data, 'rankName') ?? 'tu nuevo grado'],
  },
  TECHNIQUES_ASSIGNED: {
    name: 'tecnica_asignada',
    params: ({ studentName, count }) => [studentName, String(count)],
  },
  CLASS_ENROLLED: {
    name: 'horario_asignado',
    params: ({ studentName, data }) => [studentName, readString(data, 'className') ?? 'un nuevo horario'],
  },
  ATTENDANCE_CONFIRMED: {
    name: 'asistencia_confirmada',
    params: ({ studentName, count }) => [studentName, String(count)],
  },
  DOCUMENT_APPROVED: {
    name: 'documento_aprobado',
    params: ({ data }) => [readString(data, 'documentName') ?? 'Documento'],
  },
  DOCUMENT_REJECTED: {
    name: 'documento_rechazado',
    params: ({ data }) => [
      readString(data, 'documentName') ?? 'Documento',
      readString(data, 'reviewNotes') ?? 'Revisa el portal',
    ],
  },
}

interface StudentNotificationInput {
  type: NotificationType
  studentId: string
  studentName: string
  count: number
  data?: Record<string, unknown>
}

/**
 * Despacha por WhatsApp una notificación de alumno/tutor si el tipo está
 * habilitado y el destinatario dio su consentimiento. Best-effort.
 */
export async function dispatchStudentNotification({
  type,
  studentId,
  studentName,
  count,
  data = {},
}: StudentNotificationInput): Promise<void> {
  if (!isWhatsAppConfigured()) return

  const template = STUDENT_TEMPLATES[type]
  if (!template) return

  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        userId: true,
        guardianId: true,
        guardians: { select: { guardianId: true } },
      },
    })

    if (!student) return

    const contacts = await getOptedInContacts([
      student.userId,
      student.guardianId,
      ...student.guardians.map((entry) => entry.guardianId),
    ])

    const params = template.params({ studentName, count, data })

    await Promise.all(
      contacts.map((contact) =>
        dispatch({
          to: contact.phone,
          contactId: contact.contactId,
          userId: contact.userId,
          notificationType: type,
          templateName: template.name,
          params,
          respectQuietHours: true,
        }),
      ),
    )
  } catch (error) {
    console.error('[whatsapp] No fue posible despachar la notificación', type, studentId, error)
  }
}

// ==================== Avisos al staff ====================

function getStaffRecipients(): string[] {
  return (process.env.WHATSAPP_STAFF_RECIPIENTS ?? '')
    .split(',')
    .map((raw) => normalizePhone(raw))
    .filter((phone): phone is string => Boolean(phone))
}

async function dispatchToStaff(templateName: string, params: string[]): Promise<void> {
  if (!isWhatsAppConfigured()) return

  const recipients = getStaffRecipients()
  if (recipients.length === 0) return

  await Promise.all(
    recipients.map((phone) =>
      dispatch({
        to: phone,
        templateName,
        params,
        respectQuietHours: true,
      }),
    ),
  )
}

export async function notifyEnrollmentByWhatsApp(input: {
  applicantName: string
  phone: string | null
  email: string
  interest: string | null
}): Promise<void> {
  await dispatchToStaff('nueva_inscripcion', [
    input.applicantName,
    input.phone ?? 'No proporcionado',
    input.email,
    input.interest ?? 'No especificado',
  ])
}

export async function notifyPriceRequestByWhatsApp(input: {
  name: string
  phone: string | null
  email: string | null
  requested: string | null
}): Promise<void> {
  await dispatchToStaff('solicitud_precios', [
    input.name,
    input.phone ?? 'No proporcionado',
    input.email ?? 'No proporcionado',
    input.requested ?? 'No especificado',
  ])
}

export async function notifyReviewByWhatsApp(input: {
  authorName: string
  rating: number
  message: string
}): Promise<void> {
  await dispatchToStaff('nueva_resena', [
    input.authorName,
    `${input.rating}/5`,
    input.message,
  ])
}

export async function notifyAttendancePunchByWhatsApp(input: {
  studentName: string
  hoursTrained: number
  className: string | null
}): Promise<void> {
  await dispatchToStaff('punch_in', [
    input.studentName,
    `${input.hoursTrained}h`,
    input.className ?? 'Entrenamiento',
  ])
}

/**
 * Aviso al staff por una notificación interna dirigida a administradores
 * (documento subido, punch-in pendiente). Best-effort.
 */
export async function dispatchStaffNotification({
  type,
  studentName,
  data = {},
}: {
  type: NotificationType
  studentName: string
  data?: Record<string, unknown>
}): Promise<void> {
  if (type === 'DOCUMENT_UPLOADED') {
    await dispatchToStaff('documento_subido', [
      studentName,
      readString(data, 'documentName') ?? 'un documento',
    ])
    return
  }

  if (type === 'ATTENDANCE_PUNCHED') {
    const hours = readNumber(data, 'hoursTrained')
    await dispatchToStaff('punch_in', [
      studentName,
      hours !== null ? `${hours}h` : 'Entrenamiento',
      readString(data, 'className') ?? 'Entrenamiento',
    ])
  }
}
