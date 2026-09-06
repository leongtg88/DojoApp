import 'server-only'
import { createClient } from '@supabase/supabase-js'

const bucketName = process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'dojo-documents'

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

export async function uploadPrivateDocument(storageKey: string, file: File) {
  const { error } = await getStorageClient().storage.from(bucketName).upload(storageKey, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new Error('No fue posible guardar el documento de forma segura.')
  }
}

export async function createPrivateDocumentUrl(storageKey: string) {
  const { data, error } = await getStorageClient().storage.from(bucketName).createSignedUrl(storageKey, 60)

  if (error || !data) {
    throw new Error('No fue posible preparar la vista segura del documento.')
  }

  return data.signedUrl
}

export { bucketName }