import { NextResponse } from 'next/server'
import { uploadPrivateDocument, sanitizeStorageName } from '@/lib/document-storage'
import { detectarMimeArchivo, validarArchivo } from '@/lib/enrollment-validation'
import { DOCUMENT_TYPE_MAP } from '@/lib/enrollment-documents'
import { signUploadRef } from '@/lib/security/upload-token'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'

// ==================== Subida de un documento de inscripción ====================
//
// Cada archivo viaja en su propia petición. Motivo: las funciones de Vercel
// rechazan cualquier cuerpo de más de 4.5 MB y el formulario puede adjuntar
// varios documentos (foto + cédula + partida + pasaporte por aspirante), que
// juntos superan ese tope con facilidad. Subiendo de a uno, el total deja de
// importar y se conserva la validación por contenido (magic bytes) en el
// servidor, porque el archivo sí pasa por aquí.
//
// El servidor guarda el archivo en una ruta temporal y devuelve un token
// firmado (HMAC) que lo referencia. La confirmación de la inscripción valida
// esos tokens antes de asociar los documentos.

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}

const SUBMISSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_APPLICANT_INDEX = 9

export async function POST(request: Request) {
  try {
    // Rate limit estricto: endpoint anónimo que escribe en el almacenamiento.
    const ip = getClientIp(request.headers)
    const ipAttempt = await consumeRateLimit(`enroll-doc:${ip}`, {
      limit: 60,
      windowMs: 60 * 60 * 1000,
    })
    if (!ipAttempt.allowed) {
      return rateLimitResponse(ipAttempt.retryAfterSeconds, 'Demasiadas subidas de archivos desde esta dirección. Inténtalo de nuevo más tarde.', 'RATE_LIMIT')
    }

    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return errorResponse('NO_FILES', 'Solicitud sin archivo adjunto.', 400)
    }

    const submissionId = String(formData.get('submissionId') ?? '')
    const applicantIndex = Number(formData.get('applicantIndex') ?? '')
    const docType = DOCUMENT_TYPE_MAP[String(formData.get('docType') ?? '')]
    const file = formData.get('file')

    if (!SUBMISSION_ID_RE.test(submissionId)) {
      return errorResponse('VALIDATION', 'El identificador de la inscripción no es válido.', 400)
    }
    if (!Number.isInteger(applicantIndex) || applicantIndex < 0 || applicantIndex > MAX_APPLICANT_INDEX) {
      return errorResponse('VALIDATION', 'Documento asociado a un aspirante no válido.', 400)
    }
    if (!docType) {
      return errorResponse('VALIDATION', 'Tipo de documento no válido.', 400)
    }
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse('NO_FILES', 'Solicitud sin archivo adjunto.', 400)
    }

    // Validación completa (tamaño, formato declarado y contenido real).
    const message = await validarArchivo(file, docType !== 'PROFILE_PHOTO')
    if (message) {
      return errorResponse('VALIDATION', message, 400)
    }

    const mimeType = await detectarMimeArchivo(file)
    if (!mimeType) {
      return errorResponse('VALIDATION', 'No se pudo determinar el formato del archivo.', 400)
    }

    const storageKey = `enrollments/pending/${submissionId}-${applicantIndex}-${docType}-${crypto.randomUUID()}-${sanitizeStorageName(file.name)}`
    try {
      await uploadPrivateDocument(storageKey, file)
    } catch (uploadError) {
      console.error('Error subiendo documento de inscripción:', uploadError)
      return errorResponse('STORAGE', 'No fue posible guardar el documento. Inténtalo nuevamente en unos momentos.', 503)
    }

    return NextResponse.json({
      ok: true,
      token: signUploadRef({
        submissionId,
        storageKey,
        applicantIndex,
        docType,
        fileName: file.name,
        mimeType,
        fileSize: file.size,
      }),
    })
  } catch (error) {
    console.error('Error inesperado subiendo documento de inscripción:', error)
    return errorResponse('UNKNOWN', 'Ocurrió un error inesperado al subir el documento. Inténtalo nuevamente.', 500)
  }
}
