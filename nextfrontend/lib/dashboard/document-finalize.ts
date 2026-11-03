import 'server-only'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import {
  copyPrivateDocument,
  deletePrivateDocuments,
  PENDING_UPLOADS_PREFIX,
  sanitizeStorageName,
  STUDENT_DOCUMENTS_PREFIX,
} from '@/lib/document-storage'

/**
 * Ruta definitiva de un documento del expediente. Se conserva el nombre original
 * (saneado) al final para que la descarga siga siendo reconocible.
 */
export function finalDocumentKey(studentId: string, fileName: string) {
  return `${STUDENT_DOCUMENTS_PREFIX}/${studentId}/${randomUUID()}-${sanitizeStorageName(fileName)}`
}

/**
 * Mueve los documentos de una inscripción desde el prefijo efímero
 * `enrollments/pending/…` a su ubicación definitiva `students/<studentId>/…`.
 *
 * Se ejecuta al convertir la solicitud en alumno. Es idempotente: los documentos
 * que ya están en su ruta definitiva no se tocan.
 *
 * Orden seguro: **copiar → actualizar la BD → borrar el original**. Si la copia
 * falla, el documento conserva su `storageKey` original y no se borra nada: es
 * preferible un key "pendiente" a un documento perdido.
 */
export async function finalizeStudentDocuments(studentId: string, enrollmentId: string): Promise<number> {
  const documents = await db.studentDocument.findMany({
    where: {
      studentId,
      enrollmentId,
      storageKey: { startsWith: `${PENDING_UPLOADS_PREFIX}/` },
    },
    select: { id: true, storageKey: true, fileName: true },
  })

  let moved = 0

  for (const document of documents) {
    const targetKey = finalDocumentKey(studentId, document.fileName)

    try {
      await copyPrivateDocument(document.storageKey, targetKey)
    } catch (reason) {
      console.error('[documentos] no se pudo copiar el documento a su ruta definitiva:', document.id, reason)
      continue
    }

    await db.studentDocument.update({ where: { id: document.id }, data: { storageKey: targetKey } })

    await deletePrivateDocuments([document.storageKey]).catch((reason) => {
      console.error('[documentos] no se pudo borrar el original tras copiarlo:', document.id, reason)
    })

    moved += 1
  }

  return moved
}
