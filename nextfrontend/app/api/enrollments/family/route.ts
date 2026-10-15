import { Prisma } from '@/lib/generated/prisma'
import { db } from '@/lib/db'
import { deletePrivateDocuments } from '@/lib/document-storage'
import {
  esCedulaValida,
  esTelefonoValido,
  esAlturaValida,
  esFechaNacimientoValida,
  EDAD_MINIMA_ANIOS,
  TALLAS_ROPA,
  RESPONSABILIDADES_OPCIONES,
  ESTADO_CIVIL_HOGAR,
  INFLUENCIA_INSCRIPCION,
  OBJETIVO_PRINCIPAL,
  HORAS_SUENO,
  TIEMPO_PANTALLAS,
  NIVEL_ESTRES,
  MANEJO_FRUSTRACION,
  REACCION_CRITICA,
  SI_NO_VE_RESULTADOS,
  TIEMPO_ARTE_MARCIAL,
  CUANDO_ARTE_MARCIAL,
} from '@/lib/enrollment-validation'
import {
  DOCUMENT_LABELS,
  MAX_DOCUMENTS_PER_APPLICANT,
  MAX_DOCUMENTS_PER_SUBMISSION,
  applicantRole,
  requiredDocumentsFor,
  type DocumentKey,
} from '@/lib/enrollment-documents'
import { verifyUploadRef, type UploadRef } from '@/lib/security/upload-token'
import { buildEnrollmentNotificationRecord } from '@/lib/dashboard/student-export'
import { postToN8n } from '@/lib/integrations/n8n'
import { notifyEnrollmentByTelegram } from '@/lib/integrations/telegram'
import { notifyEnrollmentByWhatsApp } from '@/lib/integrations/whatsapp'
import { sendPushToSchoolAdmins } from '@/lib/push/web-push'
import { isValidKyuValue } from '@/lib/curriculum/kyu-options'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'

// ==================== Respuestas de error ====================

// Todas las respuestas de error comparten la misma forma { error, code } para
// que el cliente pueda mostrar el motivo y un código de correlación.
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}

function describeDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return 'No se pudo conectar con la base de datos. Inténtalo nuevamente en unos momentos.'
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return 'Ya existe una inscripción en proceso con estos datos.'
  }
  return 'No fue posible guardar la inscripción. Inténtalo nuevamente en unos momentos.'
}

// ==================== Límites y allowlists de entrada ====================

// Topes de longitud de los campos de texto libre. Evitan payloads abusivos
// (DoS / llenado de la base de datos) y definen un contrato claro para el cliente.
const TEXT_DETAIL_MAX = 300
const TEXT_LONG_MAX = 2000
const OPCIONES_SI_NO: readonly string[] = ['Si', 'No']
const OPCIONES_INTERES_NINO: readonly string[] = [
  'Tiene interés propio',
  'Es una decisión compartida',
  'Es una decisión principalmente adulta',
]

// El cuerpo de la confirmación es solo JSON con metadatos: los archivos ya se
// subieron por el endpoint /api/enrollments/family/document. Se acota igualmente
// para rechazar payloads abusivos.
const MAX_JSON_BODY_BYTES = 1024 * 1024

// Allowlists de claves persistibles en los JSON del formulario. Descartar lo
// desconocido evita "over-posting" (claves basura) en la base de datos.
const ALLOWED_PROFILE_KEYS: readonly string[] = [
  // Perfil base
  'sexo', 'bloodType', 'height', 'pantSize', 'shirtSize', 'address', 'nationalId', 'medicalInfo',
  'haPracticadoKarate', 'kyu', 'esTutor', 'relacionConHijos',
  // Bienestar de menores
  'horasSueno', 'tiempoPantallas', 'practicaOtrosDeportes', 'otrosDeportesDetalle',
  'apoyoPsicologico', 'apoyoPsicologicoDetalle', 'responsabilidadesCasa',
  // Bienestar de adultos
  'estadoCivilHogar', 'personasACargo', 'personasACargoDetalle',
  'otrasArtesMarciales', 'otrasArtesMarcialesDetalle', 'tiempoPracticaArteMarcial', 'cuandoPracticoArteMarcial',
  'practicaDeporte', 'practicaDeporteDetalle', 'medicamentos', 'medicamentosDetalle',
  'nivelEstres', 'manejoFrustracion', 'reaccionCritica',
  'motivoPractica', 'expectativas6Meses', 'porQueAhora', 'influenciaInscripcion',
  'siNoVeResultados', 'imagenKarate', 'disposicionEtiqueta', 'objetivoPrincipal', 'queEsperaInstructor',
]

const ALLOWED_REGISTRATION_KEYS: readonly string[] = [
  'tipoRegistro', 'esTutor', 'relacionTutor',
  'nombreMadre', 'telefonoMadre', 'nombrePadre', 'telefonoPadre', 'direccionPadres',
  'condicionMedica', 'motivoInscripcion', 'expectativas6Meses', 'interesNino',
  'horasPractica', 'espacioCasa', 'compromisoDiario', 'asistenciaPadre',
  'metodoMotivacion', 'otroMetodoMotivacion', 'razonesKarate', 'otraRazon',
  'compromisoObstaculos', 'otroCompromiso',
  'aceptoPago', 'aceptoMultas', 'aceptoPagosParciales', 'aceptoPagoIninterrumpido',
  'aceptoDerechoAdmision', 'aceptoPoliticas', 'aceptoTerminos', 'aceptoPrivacidad', 'aceptoTerminosLegales', 'terminosLegalesAceptadosEn',
]

// Filtra por allowlist, recorta espacios y deduplica arrays de strings, de modo
// que lo validado sea exactamente lo que se guarda. Las claves desconocidas se
// descartan (fail-closed) para evitar over-posting.
function normalizeSubmission(value: Record<string, unknown>, allowedKeys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    const raw = value[key]
    if (raw === undefined) continue
    if (typeof raw === 'string') {
      out[key] = raw.trim()
    } else if (Array.isArray(raw) && raw.every((entry) => typeof entry === 'string')) {
      out[key] = Array.from(new Set(raw.map((entry) => (entry as string).trim()).filter(Boolean)))
    } else {
      out[key] = raw
    }
  }
  return out
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

    const haPracticado = profile.haPracticadoKarate
    if (haPracticado !== undefined && typeof haPracticado !== 'boolean') {
      ctx.addIssue({ code: 'custom', path: ['haPracticadoKarate'], message: 'El dato de karate previo no es válido.' })
    }
    const kyu = typeof profile.kyu === 'string' ? profile.kyu.trim() : ''
    if (kyu && !isValidKyuValue(kyu)) {
      ctx.addIssue({ code: 'custom', path: ['kyu'], message: 'El grado de karate seleccionado no es válido.' })
    }
    if (haPracticado === true && !kyu) {
      ctx.addIssue({ code: 'custom', path: ['kyu'], message: 'Debes indicar el grado alcanzado.' })
    }

    if (profile.esTutor !== undefined && typeof profile.esTutor !== 'boolean') {
      ctx.addIssue({ code: 'custom', path: ['esTutor'], message: 'El dato de tutor no es válido.' })
    }
    const relacion = typeof profile.relacionConHijos === 'string' ? profile.relacionConHijos.trim() : ''
    if (relacion && !['Padre', 'Madre', 'Tutor legal'].includes(relacion)) {
      ctx.addIssue({ code: 'custom', path: ['relacionConHijos'], message: 'La relación del tutor no es válida.' })
    }

    // Altura obligatoria: se usa para tallas y control de crecimiento.
    const altura = typeof profile.height === 'string' ? profile.height.trim() : ''
    if (!altura) {
      ctx.addIssue({ code: 'custom', path: ['height'], message: 'Debes indicar la altura.' })
    } else if (!esAlturaValida(altura)) {
      ctx.addIssue({ code: 'custom', path: ['height'], message: 'La altura debe estar entre 50 y 250 cm.' })
    }
  })

const applicantSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento no es válida.'),
    email: z.string().trim().toLowerCase().email('El correo del aspirante no es válido.').max(320).optional().nullable(),
    profileData: profileDataSchema,
  })
  // No se admiten menores de EDAD_MINIMA_ANIOS.
  .refine((applicant) => esFechaNacimientoValida(applicant.dateOfBirth), {
    path: ['dateOfBirth'],
    message: `El aspirante debe tener al menos ${EDAD_MINIMA_ANIOS} años.`,
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

    // Inscripción familiar: el primer aspirante debe ser el tutor que también se inscribe.
    if (tipoRegistro === 'familiar') {
      const first = payload.applicants[0]
      if (!first || (first.profileData as { esTutor?: unknown }).esTutor !== true) {
        ctx.addIssue({ code: 'custom', path: ['applicants'], message: 'En una inscripción familiar el primer aspirante debe ser el tutor.' })
      }
    }

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

    // Preguntas de "Hábitos y bienestar": solo aplican a menores (hijos). En una
    // inscripción familiar el primer aspirante es el tutor, por lo que los
    // menores comienzan en el índice 1.
    const esMenor = tipoRegistro === 'menor'
    const esFamiliar = tipoRegistro === 'familiar'
    const minorOffset = esFamiliar ? 1 : 0
    const minorApplicants = esMenor
      ? payload.applicants
      : esFamiliar
        ? payload.applicants.slice(1)
        : []

    // Comprobaciones reutilizables sobre el `profileData` de cada aspirante:
    // obligatoriedad, allowlist (enums), tope de longitud y arrays sin repetir.
    const probe = (profile: Record<string, unknown>, basePath: (string | number)[]) => {
      const text = (key: string, label: string, max = TEXT_LONG_MAX) => {
        const value = typeof profile[key] === 'string' ? (profile[key] as string).trim() : ''
        if (!value) {
          ctx.addIssue({ code: 'custom', path: [...basePath, key], message: `${label} es obligatorio.` })
        } else if (value.length > max) {
          ctx.addIssue({ code: 'custom', path: [...basePath, key], message: `${label} no debe exceder ${max} caracteres.` })
        }
        return value
      }
      const optionalText = (key: string, label: string, max = TEXT_DETAIL_MAX) => {
        const value = typeof profile[key] === 'string' ? (profile[key] as string).trim() : ''
        if (value.length > max) {
          ctx.addIssue({ code: 'custom', path: [...basePath, key], message: `${label} no debe exceder ${max} caracteres.` })
        }
        return value
      }
      const oneOf = (key: string, label: string, allowed: readonly string[]) => {
        const value = typeof profile[key] === 'string' ? (profile[key] as string).trim() : ''
        if (!value) {
          ctx.addIssue({ code: 'custom', path: [...basePath, key], message: `${label} es obligatorio.` })
        } else if (!allowed.includes(value)) {
          ctx.addIssue({ code: 'custom', path: [...basePath, key], message: `${label} no es válido.` })
        }
        return value
      }
      const arrayOf = (key: string, label: string, allowed: readonly string[]) => {
        const value = profile[key]
        if (
          !Array.isArray(value) ||
          value.length === 0 ||
          value.length > allowed.length ||
          !value.every((entry) => typeof entry === 'string' && allowed.includes(entry))
        ) {
          ctx.addIssue({ code: 'custom', path: [...basePath, key], message: `${label}: selecciona opciones válidas (sin repetir).` })
        }
      }
      return { text, optionalText, oneOf, arrayOf }
    }

    for (const [index, applicant] of minorApplicants.entries()) {
      const c = probe(applicant.profileData, ['applicants', index + minorOffset, 'profileData'])
      c.oneOf('horasSueno', 'Las horas de sueño', HORAS_SUENO)
      c.oneOf('tiempoPantallas', 'El tiempo frente a pantallas', TIEMPO_PANTALLAS)
      c.oneOf('practicaOtrosDeportes', 'Otros deportes o actividades extracurriculares', OPCIONES_SI_NO)
      c.optionalText('otrosDeportesDetalle', 'El detalle de otros deportes')
      c.oneOf('apoyoPsicologico', 'El apoyo psicológico o psicopedagógico', OPCIONES_SI_NO)
      c.optionalText('apoyoPsicologicoDetalle', 'El detalle del apoyo psicológico')
      c.text('medicalInfo', 'El diagnóstico o condición a conocer')
      c.arrayOf('responsabilidadesCasa', 'Las responsabilidades en casa', RESPONSABILIDADES_OPCIONES)
    }

    if (esMenor || esFamiliar) {
      const regText = (key: string, label: string) => {
        const value = typeof reg[key] === 'string' ? (reg[key] as string).trim() : ''
        if (!value) {
          ctx.addIssue({ code: 'custom', path: ['registrationData', key], message: `${label} es obligatorio.` })
        } else if (value.length > TEXT_LONG_MAX) {
          ctx.addIssue({ code: 'custom', path: ['registrationData', key], message: `${label} no debe exceder ${TEXT_LONG_MAX} caracteres.` })
        }
      }
      regText('motivoInscripcion', 'El motivo de inscripción')
      regText('expectativas6Meses', 'Las expectativas a 6 meses')

      const interesNino = typeof reg.interesNino === 'string' ? reg.interesNino.trim() : ''
      if (!interesNino) {
        ctx.addIssue({ code: 'custom', path: ['registrationData', 'interesNino'], message: 'El interés del niño es obligatorio.' })
      } else if (!OPCIONES_INTERES_NINO.includes(interesNino)) {
        ctx.addIssue({ code: 'custom', path: ['registrationData', 'interesNino'], message: 'El interés del niño no es válido.' })
      }
    }

    // Preguntas de "Hábitos y bienestar" para adultos. En una inscripción familiar
    // el tutor es el primer aspirante; en 'adulto' hay un único aspirante.
    const esAdulto = tipoRegistro === 'adulto'
    const adultApplicants = esAdulto
      ? payload.applicants
      : esFamiliar
        ? payload.applicants.slice(0, 1)
        : []

    for (const [index, applicant] of adultApplicants.entries()) {
      const c = probe(applicant.profileData, ['applicants', index, 'profileData'])
      c.arrayOf('estadoCivilHogar', 'La composición del hogar', ESTADO_CIVIL_HOGAR)

      const personasACargo = c.oneOf('personasACargo', 'Tener personas a cargo', OPCIONES_SI_NO)
      if (personasACargo === 'Si') c.text('personasACargoDetalle', 'El detalle de las personas a cargo', TEXT_DETAIL_MAX)

      const otrasArtes = c.oneOf('otrasArtesMarciales', 'La práctica previa de artes marciales', OPCIONES_SI_NO)
      if (otrasArtes === 'Si') {
        c.text('otrasArtesMarcialesDetalle', 'El detalle de las artes marciales', TEXT_DETAIL_MAX)
        c.oneOf('tiempoPracticaArteMarcial', 'El tiempo de práctica de arte marcial', TIEMPO_ARTE_MARCIAL)
        c.oneOf('cuandoPracticoArteMarcial', 'Cuándo practicó arte marcial', CUANDO_ARTE_MARCIAL)
      }

      const practicaDeporte = c.oneOf('practicaDeporte', 'La práctica de deporte', OPCIONES_SI_NO)
      if (practicaDeporte === 'Si') c.text('practicaDeporteDetalle', 'El detalle del deporte', TEXT_DETAIL_MAX)

      c.text('medicalInfo', 'La lesión, condición médica o limitación')

      const medicamentos = c.oneOf('medicamentos', 'El consumo de medicamentos', OPCIONES_SI_NO)
      if (medicamentos === 'Si') c.text('medicamentosDetalle', 'El detalle de los medicamentos', TEXT_DETAIL_MAX)

      c.oneOf('apoyoPsicologico', 'El apoyo psicológico', OPCIONES_SI_NO)
      c.optionalText('apoyoPsicologicoDetalle', 'El detalle del apoyo psicológico')
      c.oneOf('horasSueno', 'Las horas de sueño', HORAS_SUENO)
      c.oneOf('tiempoPantallas', 'El tiempo frente a pantallas', TIEMPO_PANTALLAS)
      c.oneOf('nivelEstres', 'El nivel de estrés', NIVEL_ESTRES)
      c.oneOf('manejoFrustracion', 'El manejo de la frustración', MANEJO_FRUSTRACION)
      c.oneOf('reaccionCritica', 'La reacción ante la crítica', REACCION_CRITICA)
      c.text('motivoPractica', 'El motivo para practicar karate')
      c.text('expectativas6Meses', 'Las expectativas a 6 meses')
      c.text('porQueAhora', 'El por qué ahora')
      c.arrayOf('influenciaInscripcion', 'La influencia para inscribirse', INFLUENCIA_INSCRIPCION)
      c.oneOf('siNoVeResultados', 'Qué haría si no ve resultados', SI_NO_VE_RESULTADOS)
      c.text('imagenKarate', 'La imagen del karate tradicional')
      c.oneOf('disposicionEtiqueta', 'La disposición a la etiqueta del dojo', OPCIONES_SI_NO)
      c.arrayOf('objetivoPrincipal', 'El objetivo principal', OBJETIVO_PRINCIPAL)
      c.text('queEsperaInstructor', 'Qué espera del instructor')
    }
  })

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Teléfono de contacto',
  documents: 'Documentos adjuntos',
  'applicants.name': 'Nombre y Apellido',
  'applicants.dateOfBirth': 'Fecha de Nacimiento',
  'applicants.profileData.height': 'Altura',
  'applicants.profileData.nationalId': 'Número de Cédula',
  'applicants.profileData.sexo': 'Sexo',
  'applicants.profileData.pantSize': 'Talla de Pantalón',
  'applicants.profileData.shirtSize': 'Talla de T-shirt',
  'applicants.profileData.bloodType': 'Tipo de Sangre',
  'applicants.profileData.horasSueno': 'Horas de sueño',
  'applicants.profileData.tiempoPantallas': 'Tiempo frente a pantallas',
  'applicants.profileData.practicaOtrosDeportes': 'Otros deportes o actividades',
  'applicants.profileData.apoyoPsicologico': 'Apoyo psicológico o psicopedagógico',
  'applicants.profileData.medicalInfo': 'Diagnóstico o condición',
  'applicants.profileData.responsabilidadesCasa': 'Responsabilidades en casa',
  'applicants.profileData.estadoCivilHogar': 'Composición del hogar',
  'applicants.profileData.personasACargo': 'Personas a cargo',
  'applicants.profileData.practicaDeporte': 'Práctica de deporte',
  'applicants.profileData.medicamentos': 'Medicamentos',
  'applicants.profileData.otrasArtesMarciales': 'Otras artes marciales',
  'applicants.profileData.nivelEstres': 'Nivel de estrés',
  'applicants.profileData.manejoFrustracion': 'Manejo de la frustración',
  'applicants.profileData.reaccionCritica': 'Reacción ante la crítica',
  'applicants.profileData.motivoPractica': 'Motivo para practicar karate',
  'applicants.profileData.porQueAhora': 'Por qué ahora',
  'applicants.profileData.influenciaInscripcion': 'Influencia para inscribirse',
  'applicants.profileData.siNoVeResultados': 'Si no ve resultados',
  'applicants.profileData.imagenKarate': 'Imagen del karate tradicional',
  'applicants.profileData.disposicionEtiqueta': 'Disposición a la etiqueta',
  'applicants.profileData.objetivoPrincipal': 'Objetivo principal',
  'applicants.profileData.queEsperaInstructor': 'Qué espera del instructor',
  'registrationData.telefonoMadre': 'Teléfono de la Madre',
  'registrationData.telefonoPadre': 'Teléfono del Padre',
  'registrationData.motivoInscripcion': 'Motivo de inscripción',
  'registrationData.expectativas6Meses': 'Expectativas a 6 meses',
  'registrationData.interesNino': 'Interés del niño',
}

function fieldLabel(path: string) {
  // Las rutas llegan con el prefijo `payload.` porque el cuerpo de la
  // confirmación es { payload, documents }.
  const normalized = path.replace(/^payload\./, '')
  return FIELD_LABELS[normalized] ?? FIELD_LABELS[normalized.replace(/^applicants\.\d+\./, 'applicants.')] ?? path
}

function readableValidationMessage(issues: z.ZodIssue[]) {
  const details = issues.map((issue) => {
    const path = issue.path.join('.')
    const label = fieldLabel(path)
    return `${label}: ${issue.message}`
  })
  return `Revisa la inscripción: ${details.join(' · ')}`
}

// Cuerpo de la confirmación: los datos del formulario y la lista de tokens
// firmados que devolvió el endpoint de subida por archivo.
const confirmSchema = z.object({
  payload: payloadSchema,
  documents: z.array(z.string().min(1)).min(1).max(MAX_DOCUMENTS_PER_SUBMISSION),
})

// Agrupa los documentos verificados por aspirante para poder comprobar
// repetidos, tope por aspirante y documentos obligatorios.
function indexDocuments(refs: UploadRef[]) {
  const byApplicant = new Map<number, Map<DocumentKey, UploadRef>>()
  for (const ref of refs) {
    const forApplicant = byApplicant.get(ref.applicantIndex) ?? new Map<DocumentKey, UploadRef>()
    forApplicant.set(ref.docType, ref)
    byApplicant.set(ref.applicantIndex, forApplicant)
  }
  return byApplicant
}

// Devuelve el primer problema encontrado con los documentos (o null si todo
// está correcto). No lanza: el llamador decide qué hacer con el error.
function validarDocumentos(refs: UploadRef[], applicantsCount: number, tipoRegistro: string): string | null {
  for (const ref of refs) {
    if (ref.applicantIndex >= applicantsCount) {
      return 'Documento asociado a un aspirante no válido.'
    }
  }
  if (refs.length !== new Set(refs.map((ref) => `${ref.applicantIndex}:${ref.docType}`)).size) {
    return 'Hay documentos repetidos para el mismo aspirante.'
  }
  const docsByApplicant = indexDocuments(refs)
  for (let applicantIndex = 0; applicantIndex < applicantsCount; applicantIndex++) {
    const forApplicant = docsByApplicant.get(applicantIndex) ?? new Map<DocumentKey, UploadRef>()
    if (forApplicant.size > MAX_DOCUMENTS_PER_APPLICANT) {
      return `No se permiten más de ${MAX_DOCUMENTS_PER_APPLICANT} documentos por aspirante.`
    }
    for (const requiredDocument of requiredDocumentsFor(applicantRole(tipoRegistro, applicantIndex))) {
      if (!forApplicant.has(requiredDocument)) {
        return `Falta ${DOCUMENT_LABELS[requiredDocument]} del aspirante ${applicantIndex + 1}.`
      }
    }
  }
  return null
}

// ==================== Ruta ====================

export async function POST(request: Request) {
  try {
    // Rate limiting estricto: este endpoint recibe subidas de archivos anónimos.
    const ip = getClientIp(request.headers)
    const ipAttempt = await consumeRateLimit(`enroll-family:${ip}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!ipAttempt.allowed) {
      return rateLimitResponse(ipAttempt.retryAfterSeconds, 'Demasiadas solicitudes desde esta dirección. Inténtalo de nuevo más tarde.', 'RATE_LIMIT')
    }

    // Límite global: acota el total de solicitudes por ventana aunque el atacante
    // rote direcciones IP (mitiga el DoS distribuido). Configurable por entorno.
    const globalLimit = Number(process.env.ENROLLMENT_GLOBAL_HOURLY_LIMIT ?? '') || 300
    const globalAttempt = await consumeRateLimit('enroll-family:global', {
      limit: globalLimit,
      windowMs: 60 * 60 * 1000,
    })
    if (!globalAttempt.allowed) {
      return rateLimitResponse(globalAttempt.retryAfterSeconds, 'El servicio de inscripción está recibiendo muchas solicitudes. Inténtalo de nuevo más tarde.', 'RATE_LIMIT_GLOBAL')
    }

    // El cuerpo es JSON con metadatos: los archivos ya se subieron por el
    // endpoint de subida por archivo. Solo se acota el tamaño del JSON.
    const declaredLength = Number(request.headers.get('content-length') ?? '0')
    if (declaredLength > MAX_JSON_BODY_BYTES) {
      return errorResponse('PAYLOAD_TOO_LARGE', 'La solicitud supera el tamaño permitido.', 413)
    }

    const parsed = confirmSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return errorResponse('VALIDATION', readableValidationMessage(parsed.error.issues), 400)
    }

    const email = String(parsed.data.payload.email ?? '').toLowerCase()
    const emailAttempt = await consumeRateLimit(`enroll-family:${email}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })
    if (!emailAttempt.allowed) {
      return rateLimitResponse(emailAttempt.retryAfterSeconds, 'Ya existe una solicitud reciente para este correo. Inténtalo de nuevo más tarde.', 'RATE_LIMIT')
    }

    // Verifica los tokens firmados que devolvió el endpoint de subida: así el
    // cliente no puede inventar rutas ni referenciar documentos de otra
    // inscripción.
    const refs: UploadRef[] = []
    for (const token of parsed.data.documents) {
      const ref = verifyUploadRef(token)
      if (!ref) {
        return errorResponse('VALIDATION', 'Alguno de los documentos adjuntos no es válido o expiró. Vuelve a cargarlos e inténtalo de nuevo.', 400)
      }
      refs.push(ref)
    }
    if (new Set(refs.map((ref) => ref.submissionId)).size !== 1) {
      return errorResponse('VALIDATION', 'Los documentos adjuntos no pertenecen a la misma inscripción.', 400)
    }

    let branch: { id: string; schoolId: string } | null
    try {
      branch = await db.branch.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, schoolId: true } })
    } catch (branchError) {
      console.error('Error consultando la sede para la inscripción:', branchError)
      return errorResponse('DB', 'El servicio de inscripción no está disponible temporalmente. Inténtalo nuevamente en unos momentos.', 503)
    }
    if (!branch) {
      return errorResponse('BRANCH', 'No hay una sede disponible para la inscripción en este momento. Contacta al dojo.', 503)
    }

    const input = parsed.data.payload
    const tipoRegistro = typeof input.registrationData.tipoRegistro === 'string'
      ? input.registrationData.tipoRegistro
      : ''

    // Verifica que cada documento corresponda a un aspirante existente y que
    // cada aspirante tenga los documentos obligatorios según su rol.
    const documentsError = validarDocumentos(refs, input.applicants.length, tipoRegistro)
    if (documentsError) {
      // La inscripción no es válida: se borran los archivos ya subidos para no
      // dejar huérfanos en el almacenamiento (el cliente los reenvía con un
      // envío nuevo al reintentar).
      await deletePrivateDocuments(refs.map((ref) => ref.storageKey)).catch(() => {})
      return errorResponse('VALIDATION', documentsError, 400)
    }

    // Normaliza antes de guardar/enviar: recorta, deduplica arrays y descarta
    // claves fuera de la allowlist (anti over-posting).
    input.registrationData = normalizeSubmission(input.registrationData, ALLOWED_REGISTRATION_KEYS)
    for (const applicant of input.applicants) {
      applicant.profileData = normalizeSubmission(applicant.profileData, ALLOWED_PROFILE_KEYS)
    }
    const reg = input.registrationData
    const interest = reg.tipoRegistro === 'menor' ? 'Pequeños Guerreros' : reg.tipoRegistro === 'familiar' ? 'Familia (adulto + menores)' : 'Jóvenes y Adultos'
    let enrollment: { id: string }
    let applicants: { id: string; reused: boolean }[]
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

      applicants = await Promise.all(
        input.applicants.map(async (applicant) => {
          const dateOfBirth = new Date(`${applicant.dateOfBirth}T00:00:00.000Z`)
          const match = existingConverted.find(
            (entry) => entry.name.trim().toLowerCase() === applicant.name.trim().toLowerCase() && entry.dateOfBirth.getTime() === dateOfBirth.getTime(),
          )
          if (match) {
            return { id: match.id, reused: true }
          }
          const created = await db.enrollmentApplicant.create({
            data: {
              enrollmentId: enrollment.id,
              name: applicant.name,
              dateOfBirth,
              profileData: {
                ...(applicant.profileData as Record<string, unknown>),
                ...(applicant.email ? { email: applicant.email } : {}),
              } as Prisma.InputJsonValue,
            },
            select: { id: true },
          })
          return { id: created.id, reused: false }
        }),
      )

    } catch (dbError) {
      // La inscripción no se guardó: se borran los archivos ya subidos para no
      // dejar huérfanos en el almacenamiento.
      await deletePrivateDocuments(refs.map((ref) => ref.storageKey)).catch(() => {})
      console.error('Error guardando la inscripción:', dbError)
      return errorResponse('DB', describeDbError(dbError), 503)
    }

    // Asocia cada documento verificado al aspirante que le corresponde. Los
    // aspirantes ya convertidos en alumnos conservan sus documentos, por lo que
    // las subidas nuevas para ellos se descartan más abajo.
    const usedKeys = new Set<string>()
    try {
      for (const ref of refs) {
        const applicant = applicants[ref.applicantIndex]
        if (!applicant || applicant.reused) continue
        await db.studentDocument.create({
          data: {
            enrollmentId: enrollment.id,
            applicantId: applicant.id,
            type: ref.docType,
            fileName: ref.fileName,
            storageKey: ref.storageKey,
            mimeType: ref.mimeType,
            fileSize: ref.fileSize,
          },
        })
        usedKeys.add(ref.storageKey)
      }
    } catch (documentError) {
      console.error('Error guardando documentos de inscripción:', documentError)
      return errorResponse('DB', 'No fue posible guardar los documentos de la inscripción. Inténtalo nuevamente en unos momentos.', 503)
    }

    // Subidas que no quedaron asociadas (aspirantes ya convertidos): se borran
    // para no acumular archivos huérfanos.
    const orphanKeys = refs.map((ref) => ref.storageKey).filter((key) => !usedKeys.has(key))
    if (orphanKeys.length > 0) {
      await deletePrivateDocuments(orphanKeys).catch((cleanupError) => {
        console.error('Error limpiando documentos huérfanos de inscripción:', cleanupError)
      })
    }

    // Notificaciones posteriores al guardado: nunca deben convertir un alta
    // exitosa en un error visible para el usuario.
    try {
      await postToN8n(
        'enrollment.created',
        buildEnrollmentNotificationRecord({
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

      await notifyEnrollmentByWhatsApp({
        applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`,
        phone: input.phone,
        email: input.email,
        interest,
      })
    } catch (notificationError) {
      console.error('Error enviando notificaciones de inscripción:', notificationError)
    }

    return NextResponse.json({ ok: true, id: enrollment.id })
  } catch (error) {
    console.error('Error inesperado procesando la inscripción:', error)
    return errorResponse('UNKNOWN', 'Ocurrió un error inesperado al procesar la inscripción. Inténtalo nuevamente o contacta al dojo.', 500)
  }
}
