import 'server-only'
import { createClient } from '@supabase/supabase-js'

const bucketName = process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'dojo-documents'

export function sanitizeStorageName(name: string) {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .trim()
      .replace(/[._-]$/, '') || 'archivo'
  )
}

function getStorageClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('El almacenamiento privado de documentos no está configurado.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function errorFields(error: unknown): { name: string; code: string; message: string } {
  return {
    name: typeof error === 'object' && error !== null && 'name' in error && typeof (error as { name?: unknown }).name === 'string'
      ? (error as { name: string }).name
      : '',
    code: typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '',
    message: typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : '',
  }
}

export function storageErrorDetails(error: unknown): { name: string; code: string; message: string } {
  const { name, code, message } = errorFields(error)
  return { name, code, message: message.slice(0, 300) }
}

export function describeStorageError(error: unknown): string {
  const { name, code, message } = errorFields(error)
  const haystack = `${name} ${code} ${message}`.toLowerCase()

  if (haystack.includes('entitytoolarge') || haystack.includes('maxsizeexceeded') || haystack.includes('too large') || haystack.includes('exceeds the maximum') || haystack.includes('supera el tama')) {
    return 'El archivo supera el tamaño máximo permitido de 5 MB. Comprime la imagen o usa otro archivo.'
  }

  if (haystack.includes('invalidkey') || haystack.includes('invalid key') || haystack.includes('invalid path')) {
    return 'El nombre o formato del archivo no es válido. Usa JPG, PNG, WEBP o PDF con nombres simples (sin caracteres especiales).'
  }

  if (haystack.includes('nosuchbucket') || haystack.includes('bucket not found')) {
    return 'El almacenamiento de documentos no está configurado correctamente. Contacta al administrador.'
  }

  if (haystack.includes('duplicate') || haystack.includes('already exists') || haystack.includes('keyalreadyexists')) {
    return 'Ese archivo ya existe. Intenta con otro nombre o archivo.'
  }

  if (haystack.includes('nosuchkey') || haystack.includes('object not found') || haystack.includes('not found')) {
    return 'El documento no se encontró en el sistema. Inténtalo nuevamente.'
  }

  if (haystack.includes('forbidden') || haystack.includes('unauthorized') || haystack.includes('permission')) {
    return 'No hay permiso para guardar el documento. Contacta al administrador.'
  }

  if (haystack.includes('timeout') || haystack.includes('econnrefused') || haystack.includes('fetch failed') || haystack.includes('network')) {
    return 'No se pudo conectar con el almacenamiento. Verifica tu conexión e inténtalo nuevamente.'
  }

  return 'No fue posible guardar el documento de forma segura. Inténtalo nuevamente.'
}

export async function uploadPrivateDocument(storageKey: string, file: File) {
  const { error } = await getStorageClient().storage.from(bucketName).upload(storageKey, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    const err = new Error(describeStorageError(error))
    ;(err as { cause?: unknown }).cause = error
    throw err
  }
}

export async function createPrivateDocumentUrl(storageKey: string) {
  const { data, error } = await getStorageClient().storage.from(bucketName).createSignedUrl(storageKey, 60)

  if (error || !data) {
    throw new Error(describeStorageError(error ?? { message: 'respuesta vacía' }))
  }

  return data.signedUrl
}

export { bucketName }