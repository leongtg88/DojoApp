import 'server-only'
import { db } from '@/lib/db'
import { movePrivateDocument, sanitizeStorageName } from '@/lib/document-storage'

interface EnrollmentDocumentToPersist {
  id: string
  storageKey: string
  fileName: string
}

interface PersistEnrollmentDocumentInput {
  document: EnrollmentDocumentToPersist
  enrollmentId: string
  applicantId: string
}

// Ruta definitiva de un documento de inscripción. Al confirmar la inscripción,
// el archivo sale de `enrollments/pending/...` para que el barrido de subidas
// abandonadas no pueda tocar documentación ya válida.
export function permanentEnrollmentDocumentKey({
  enrollmentId,
  applicantId,
  documentId,
  fileName,
}: {
  enrollmentId: string
  applicantId: string
  documentId: string
  fileName: string
}) {
  return `enrollments/${enrollmentId}/${applicantId}/${documentId}-${sanitizeStorageName(fileName)}`
}

/**
 * Mueve el archivo a su ruta definitiva y actualiza el registro. Es best-effort:
 * si el storage o la actualización fallan, el registro conserva la ruta original
 * (el barrido de pendientes ya no borra documentos que tengan registro).
 */
export async function persistEnrollmentDocument(input: PersistEnrollmentDocumentInput): Promise<string> {
  const { document, enrollmentId, applicantId } = input
  const permanentKey = permanentEnrollmentDocumentKey({
    enrollmentId,
    applicantId,
    documentId: document.id,
    fileName: document.fileName,
  })

  if (document.storageKey === permanentKey) return permanentKey

  try {
    await movePrivateDocument(document.storageKey, permanentKey)
  } catch (moveError) {
    console.error('No fue posible mover el documento de inscripción a su ruta definitiva:', document.id, moveError)
    return document.storageKey
  }

  try {
    await db.studentDocument.update({
      where: { id: document.id },
      data: { storageKey: permanentKey },
    })
    return permanentKey
  } catch (updateError) {
    // Si la base de datos no acepta la nueva ruta, se intenta devolver el archivo
    // a la ruta original para no dejar el registro apuntando a un archivo ausente.
    try {
      await movePrivateDocument(permanentKey, document.storageKey)
    } catch (rollbackError) {
      console.error('No fue posible devolver el documento a su ruta original:', document.id, rollbackError)
    }

    console.error('No fue posible guardar la ruta definitiva del documento de inscripción:', document.id, updateError)
    return document.storageKey
  }
}
