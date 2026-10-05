import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, mimeForExtension, sniffMimeType } from '@/lib/file-validation'

export const TALLAS_ROPA: readonly string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const TIPOS_SANGRE: readonly string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const soloDigitos = (value: string) => value.replace(/\D/g, '')

export const esCedulaValida = (value: string) => /^\d{11}$/.test(soloDigitos(value))

export const esTelefonoValido = (value: string) => {
  const digits = soloDigitos(value)
  return digits.length >= 10 && digits.length <= 15
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const esEmailValido = (value: string) => EMAIL_REGEX.test(value.trim())

const MENSAJE_TAMANO = 'El archivo supera los 5 MB. Comprime la imagen o usa otro archivo.'

function mensajeFormato(permitirPdf: boolean) {
  return `Formato no permitido. Usa ${permitirPdf ? 'JPG, PNG, WEBP o PDF' : 'JPG, PNG o WEBP'}.`
}

// Validación básica (sin leer el contenido): tamaño y formato declarado o por
// extensión. Sirve para la comprobación síncrona al avanzar de paso.
export function validarArchivoBasico(file: File, permitirPdf: boolean): string | null {
  if (!(file.size > 0 && file.size <= MAX_FILE_SIZE)) {
    return MENSAJE_TAMANO
  }

  const declared = file.type && file.type !== 'application/octet-stream' ? file.type : ''
  const effective = declared || mimeForExtension(file.name)

  if (!effective || !ALLOWED_MIME_TYPES.has(effective)) {
    return mensajeFormato(permitirPdf)
  }
  if (!permitirPdf && effective === 'application/pdf') {
    return mensajeFormato(false)
  }
  return null
}

// Validación completa: añade la detección por contenido (magic bytes) para
// rechazar archivos con extensión válida pero contenido inválido. Idéntica en
// cliente y servidor.
export async function validarArchivo(file: File, permitirPdf: boolean): Promise<string | null> {
  const basic = validarArchivoBasico(file, permitirPdf)
  if (basic) return basic

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const detected = sniffMimeType(header)

  if (!detected || !ALLOWED_MIME_TYPES.has(detected)) {
    return mensajeFormato(permitirPdf)
  }
  if (!permitirPdf && detected === 'application/pdf') {
    return mensajeFormato(false)
  }
  return null
}
