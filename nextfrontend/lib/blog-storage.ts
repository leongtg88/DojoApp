import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { describeStorageError, sanitizeStorageName } from '@/lib/document-storage'

// Reutiliza la misma cuenta de Supabase Storage que los documentos privados
// (mismas credenciales), pero en un bucket PÚBLICO propio del blog: las portadas
// necesitan una URL estable para el listado y para la og:image del detalle.
const bucketName = process.env.SUPABASE_BLOG_BUCKET ?? 'blog-covers'

export const BLOG_IMAGE_MAX_SIZE = 5 * 1024 * 1024
export const BLOG_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function normalizeStorageUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '')
  const match = trimmed.match(/^(https?:\/\/[^/]+)/)
  return match ? match[1] : trimmed
}

function getStorageClient() {
  const rawUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!rawUrl || !serviceRoleKey) {
    throw new Error('El almacenamiento del blog no está configurado.')
  }

  return createClient(normalizeStorageUrl(rawUrl), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export { sanitizeStorageName, describeStorageError, bucketName }

export async function uploadBlogImage(storageKey: string, file: File) {
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

export function getBlogImagePublicUrl(storageKey: string) {
  const { data } = getStorageClient().storage.from(bucketName).getPublicUrl(storageKey)
  return data.publicUrl
}

export async function deleteBlogImages(storageKeys: string[]) {
  const keys = storageKeys.filter(Boolean)
  if (keys.length === 0) return

  const { error } = await getStorageClient().storage.from(bucketName).remove(keys)

  if (error) {
    const err = new Error(describeStorageError(error))
    ;(err as { cause?: unknown }).cause = error
    throw err
  }
}
