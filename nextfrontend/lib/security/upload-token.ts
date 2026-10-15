import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { DOCUMENT_TYPE_MAP, type DocumentKey } from '@/lib/enrollment-documents'

// Referencia firmada a un documento ya subido al almacenamiento.
//
// Flujo: el cliente sube cada archivo por separado (para no superar el límite
// de 4.5 MB por petición de las funciones de Vercel) y el servidor devuelve un
// token firmado que describe lo que se guardó. En la confirmación, el cliente
// manda esos tokens y el servidor los verifica con HMAC, de modo que no puede
// inventarse rutas ni reutilizar referencias de otra inscripción.
export interface UploadRef {
  submissionId: string
  storageKey: string
  applicantIndex: number
  docType: DocumentKey
  fileName: string
  mimeType: string
  fileSize: number
}

// Vigencia del token: suficiente para completar el formulario, corta frente a
// reutilizaciones.
const TOKEN_TTL_MS = 60 * 60 * 1000

function getSecret(): string {
  const secret = process.env.UPLOAD_TOKEN_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('Falta AUTH_SECRET (o UPLOAD_TOKEN_SECRET) para firmar las subidas de documentos.')
  }
  return secret
}

function sign(body: string): string {
  return createHmac('sha256', getSecret()).update(body).digest('base64url')
}

export function signUploadRef(ref: UploadRef): string {
  const payload = JSON.stringify({ ...ref, exp: Date.now() + TOKEN_TTL_MS })
  const body = Buffer.from(payload, 'utf8').toString('base64url')
  return `${body}.${sign(body)}`
}

function isUploadRef(value: unknown): value is UploadRef {
  if (typeof value !== 'object' || value === null) return false
  const ref = value as Record<string, unknown>
  return (
    typeof ref.submissionId === 'string' &&
    typeof ref.storageKey === 'string' &&
    typeof ref.applicantIndex === 'number' &&
    Number.isInteger(ref.applicantIndex) &&
    typeof ref.docType === 'string' &&
    ref.docType in DOCUMENT_TYPE_MAP &&
    typeof ref.fileName === 'string' &&
    typeof ref.mimeType === 'string' &&
    typeof ref.fileSize === 'number'
  )
}

// Verifica firma y vigencia. Devuelve null ante cualquier anomalía (fail-closed).
export function verifyUploadRef(token: unknown): UploadRef | null {
  if (typeof token !== 'string') return null
  const separator = token.indexOf('.')
  if (separator <= 0 || separator === token.length - 1) return null
  const body = token.slice(0, separator)
  const signature = token.slice(separator + 1)

  const expected = sign(body)
  const received = Buffer.from(signature, 'utf8')
  const wanted = Buffer.from(expected, 'utf8')
  if (received.length !== wanted.length || !timingSafeEqual(received, wanted)) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>
    const exp = parsed.exp
    if (typeof exp !== 'number' || exp < Date.now()) return null
    if (!isUploadRef(parsed)) return null
    return {
      submissionId: parsed.submissionId,
      storageKey: parsed.storageKey,
      applicantIndex: parsed.applicantIndex,
      docType: parsed.docType as DocumentKey,
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      fileSize: parsed.fileSize,
    }
  } catch {
    return null
  }
}
