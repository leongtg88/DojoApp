import { Prisma } from '@/lib/generated/prisma'
import { db } from '@/lib/db'
import { uploadPrivateDocument, sanitizeStorageName } from '@/lib/document-storage'
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, mimeForExtension, sniffMimeType } from '@/lib/file-validation'
import { buildEnrollmentExportRecord } from '@/lib/dashboard/student-export'
import { postToN8n } from '@/lib/integrations/n8n'
import { notifyEnrollmentByTelegram } from '@/lib/integrations/telegram'
import { sendPushToSchoolAdmins } from '@/lib/push/web-push'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'

// ==================== Validaciones de negocio ====================

const TALLAS_ROPA = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

const soloDigitos = (value: string) => value.replace(/\D/g, '')

function esCedulaValida(value: string) {
  return /^\d{11}$/.test(soloDigitos(value))
}

function esTelefonoValido(value: string) {
  const digits = soloDigitos(value)
  return digits.length >= 10 && digits.length <= 15
}

// ==================== Esquemas ====================

const profileDataSchema = z
  .record(z.string(), z.unknown())
  .superRefine((profile, ctx) => {
    const sexo = typeof profile.sexo === 'string' ? profile.sexo.trim() : ''
    if (!sexo) {
      ctx.addIssue({ code: 'custom', path: ['sexo'], message: 'Debes seleccionar el sexo.' })
    } else if (sexo !== 'Masculino' && sexo !== 'Femenino') {
      ctx.addIssue({ code: 'custom', path: ['sexo'], message: 'El sexo seleccionado no es válido.' })
    }

    const pantSize = typeof profile.pantSize === 'string' ? profile.pantSize.trim() : ''
    if (!pantSize) {
      ctx.addIssue({ code: 'custom', path: ['pantSize'], message: 'Debes seleccionar la talla de pantalón.' })
    } else if (!TALLAS_ROPA.includes(pantSize as (typeof TALLAS_ROPA)[number])) {
      ctx.addIssue({ code: 'custom', path: ['pantSize'], message: 'La talla de pantalón no es válida.' })
    }

    const shirtSize = typeof profile.shirtSize === 'string' ? profile.shirtSize.trim() : ''
    if (!shirtSize) {
      ctx.addIssue({ code: 'custom', path: ['shirtSize'], message: 'Debes seleccionar la talla de camiseta.' })
    } else if (!TALLAS_ROPA.includes(shirtSize as (typeof TALLAS_ROPA)[number])) {
      ctx.addIssue({ code: 'custom', path: ['shirtSize'], message: 'La talla de camiseta no es válida.' })
    }

    const nationalId = typeof profile.nationalId === 'string' ? profile.nationalId.trim() : ''
    if (nationalId && !esCedulaValida(nationalId)) {
      ctx.addIssue({ code: 'custom', path: ['nationalId'], message: 'La cédula debe tener exactamente 11 dígitos.' })
    }
  })

const applicantSchema = z.object({
  name: z.string().trim().min(2).max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento no es válida.'),
  profileData: profileDataSchema,
})

const payloadSchema = z
  .object({
    email: z.string().trim().email('El email no es válido.').max(320),
    phone: z.string().trim().max(30).nullable(),
    applicants: z.array(applicantSchema).min(1).max(10),
    registrationData: z.record(z.string(), z.unknown()),
  })
  .superRefine((payload, ctx) => {
    if (payload.phone) {
      if (!esTelefonoValido(payload.phone)) {
        ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Ingresa un teléfono válido (ej: 809-123-4567).' })
      }
    }

    const reg = payload.registrationData
    const tipoRegistro = typeof reg.tipoRegistro === 'string' ? reg.tipoRegistro.trim() : ''

    if (tipoRegistro === 'menor') {
      const telMadre = typeof reg.telefonoMadre === 'string' ? reg.telefonoMadre.trim() : ''
      const telPadre = typeof reg.telefonoPadre === 'string' ? reg.telefonoPadre.trim() : ''
      if (telMadre && !esTelefonoValido(telMadre)) {
        ctx.addIssue({ code: 'custom', path: ['registrationData', 'telefonoMadre'], message: 'Ingresa un teléfono válido para la madre (ej: 809-123-4567).' })
      }
      if (telPadre && !esTelefonoValido(telPadre)) {
        ctx.addIssue({ code: 'custom', path: ['registrationData', 'telefonoPadre'], message: 'Ingresa un teléfono válido para el padre (ej: 809-123-4567).' })
      }
    }
  })

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Teléfono de contacto',
  'applicants.name': 'Nombre y Apellido',
  'applicants.dateOfBirth': 'Fecha de Nacimiento',
  'applicants.profileData.nationalId': 'Número de Cédula',
  'applicants.profileData.sexo': 'Sexo',
  'applicants.profileData.pantSize': 'Talla de Pantalón',
  'applicants.profileData.shirtSize': 'Talla de T-shirt',
  'applicants.profileData.bloodType': 'Tipo de Sangre',
  'registrationData.telefonoMadre': 'Teléfono de la Madre',
  'registrationData.telefonoPadre': 'Teléfono del Padre',
}

function fieldLabel(path: string) {
  return FIELD_LABELS[path] ?? FIELD_LABELS[path.replace(/^applicants\.\d+\./, 'applicants.')] ?? path
}

function readableValidationMessage(issues: z.ZodIssue[]) {
  const details = issues.map((issue) => {
    const path = issue.path.join('.')
    const label = fieldLabel(path)
    return `${label}: ${issue.message}`
  })
  return `Revisa la inscripción: ${details.join(' · ')}`
}

// ==================== Archivos ====================

async function validateFile(file: File): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(file.size > 0 && file.size <= MAX_FILE_SIZE)) {
    return { ok: false, message: 'Un archivo supera los 5 MB. Comprime o usa otro archivo.' }
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const detected = sniffMimeType(bytes)
  const declared = file.type && file.type !== 'application/octet-stream' ? file.type : ''
  const effective = detected || declared || mimeForExtension(file.name)
  if (!effective || !ALLOWED_MIME_TYPES.has(effective)) {
    return { ok: false, message: 'El formato del archivo no es válido. Usa JPG, PNG, WEBP o PDF.' }
  }
  return { ok: true }
}

// ==================== Ruta ====================

export async function POST(request: Request) {
  // Rate limiting estricto: este endpoint recibe subidas de archivos anónimos.
  const ip = getClientIp(request.headers)
  const ipAttempt = await consumeRateLimit(`enroll-family:${ip}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return rateLimitResponse(ipAttempt.retryAfterSeconds, 'Demasiadas solicitudes desde esta dirección. Inténtalo de nuevo más tarde.')
  }

  const formData = await request.formData().catch(() => null)
  const payload = formData?.get('payload')
  let parsedPayload: string | null = null
  if (typeof payload === 'string') {
    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      parsedPayload = null
    }
  }
  const parsed = parsedPayload ? payloadSchema.safeParse(parsedPayload) : null

  if (!parsed?.success) {
    const message = parsed && parsed.error
      ? readableValidationMessage(parsed.error.issues)
      : 'Datos de inscripción no válidos.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const email = String(parsed.data.email ?? '').toLowerCase()
  const emailAttempt = await consumeRateLimit(`enroll-family:${email}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (!emailAttempt.allowed) {
    return rateLimitResponse(emailAttempt.retryAfterSeconds, 'Ya existe una solicitud reciente para este correo. Inténtalo de nuevo más tarde.')
  }

  if (!formData) {
    return NextResponse.json({ error: 'Solicitud sin archivos adjuntos' }, { status: 400 })
  }

  const branch = await db.branch.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, schoolId: true } })
  if (!branch) {
    return NextResponse.json({ error: 'No hay una sede disponible para la inscripción' }, { status: 503 })
  }

  let invalidMessage: string | null = null
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('document-') && value instanceof File) {
      const result = await validateFile(value)
      if (!result.ok) {
        invalidMessage = result.message
        break
      }
    }
  }
  if (invalidMessage) {
    return NextResponse.json({ error: invalidMessage }, { status: 400 })
  }

  const input = parsed.data
  const reg = input.registrationData
  const interest = reg.tipoRegistro === 'menor' ? 'Pequeños Guerreros' : 'Jóvenes y Adultos'
  let enrollment: { id: string }
  try {
    enrollment = await db.enrollment.upsert({
      where: { contactEmail_status: { contactEmail: input.email.toLowerCase(), status: 'PENDING' } },
      update: { origin: 'FORM', applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`, contactPhone: input.phone, schoolId: branch.schoolId, branchId: branch.id, interest, registrationData: input.registrationData as Prisma.InputJsonValue, applicants: { deleteMany: { studentId: null } } },
      create: { origin: 'FORM', applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`, contactEmail: input.email.toLowerCase(), contactPhone: input.phone, schoolId: branch.schoolId, branchId: branch.id, interest, registrationData: input.registrationData as Prisma.InputJsonValue },
      select: { id: true },
    })

    // Aspirantes ya convertidos en alumnos: se conservan y se reutilizan en el
    // mismo orden del formulario en lugar de recrearlos (evita duplicados y
    // que pierdan sus documentos al reenviar la solicitud).
    const existingConverted = await db.enrollmentApplicant.findMany({
      where: { enrollmentId: enrollment.id, studentId: { not: null } },
      select: { id: true, name: true, dateOfBirth: true },
    })

    const applicants: { id: string; reused: boolean }[] = await Promise.all(
      input.applicants.map(async (applicant) => {
        const dateOfBirth = new Date(`${applicant.dateOfBirth}T00:00:00.000Z`)
        const match = existingConverted.find(
          (entry) => entry.name.trim().toLowerCase() === applicant.name.trim().toLowerCase() && entry.dateOfBirth.getTime() === dateOfBirth.getTime(),
        )
        if (match) {
          return { id: match.id, reused: true }
        }
        const created = await db.enrollmentApplicant.create({
          data: { enrollmentId: enrollment.id, name: applicant.name, dateOfBirth, profileData: applicant.profileData as Prisma.InputJsonValue },
          select: { id: true },
        })
        return { id: created.id, reused: false }
      }),
    )

    try {
      for (const [key, value] of formData.entries()) {
        if (!key.startsWith('document-') || !(value instanceof File)) continue
        const [, applicantIndex, type] = key.split('-')
        const applicant = applicants[Number(applicantIndex)]
        if (!applicant || applicant.reused) continue
        let storageKey = ''
        try {
          storageKey = `enrollments/${enrollment.id}/${applicant.id}/${crypto.randomUUID()}-${sanitizeStorageName(value.name)}`
          await uploadPrivateDocument(storageKey, value)
          await db.studentDocument.create({ data: { enrollmentId: enrollment.id, applicantId: applicant.id, type: type === 'PROFILE_PHOTO' ? 'PROFILE_PHOTO' : 'IDENTITY', fileName: value.name, storageKey, mimeType: value.type, fileSize: value.size } })
        } catch (fileError) {
          console.error('Error guardando documento de inscripción:', fileError, { storageKey, fileName: value.name, fileType: value.type, fileSize: value.size })
          const cause = (fileError as { cause?: unknown }).cause
          if (cause) console.error('Causa raíz de Supabase:', cause)
          throw fileError
        }
      }
    } catch (uploadError) {
      console.error('Error guardando documentos de inscripción:', uploadError)
      const message = uploadError instanceof Error ? uploadError.message : 'Verifica la configuración de almacenamiento.'
      return NextResponse.json({ error: message }, { status: 503 })
    }
  } catch (dbError) {
    console.error('Error guardando la inscripción:', dbError)
    return NextResponse.json({ error: 'No fue posible guardar la inscripción. Inténtalo nuevamente en unos momentos.' }, { status: 503 })
  }

  await postToN8n(
    'enrollment.created',
    buildEnrollmentExportRecord({
      id: enrollment.id,
      origin: 'FORM',
      applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`,
      contactEmail: input.email.toLowerCase(),
      contactPhone: input.phone,
      interest,
      createdAt: new Date(),
      registrationData: input.registrationData,
      applicants: input.applicants.map((applicant) => ({
        name: applicant.name,
        dateOfBirth: applicant.dateOfBirth,
        profileData: applicant.profileData,
      })),
    }),
  )

  await sendPushToSchoolAdmins(branch.schoolId, {
    title: 'Nueva inscripción',
    body: `${input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`} · ${input.phone}`,
    url: '/dashboard/admin',
  })

  await notifyEnrollmentByTelegram({
    applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`,
    phone: input.phone,
    email: input.email,
    interest,
  })

  return NextResponse.json({ ok: true, id: enrollment.id })
}