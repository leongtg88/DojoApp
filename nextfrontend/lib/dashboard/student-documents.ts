import 'server-only'
import { db } from '@/lib/db'
import type { AdminScope } from '@/lib/dashboard/scope'

// Acceso a los documentos del expediente para el panel de administración.
// Centraliza el filtro por escuela para que ninguna ruta pueda descargar un
// archivo de otra escuela por error.

const DOCUMENT_SELECT = {
  id: true,
  studentId: true,
  type: true,
  status: true,
  fileName: true,
  storageKey: true,
  mimeType: true,
  fileSize: true,
  uploadedAt: true,
} as const

function studentScopeFilter(scope: AdminScope) {
  return scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } }
}

export async function findStudentDocumentForAdmin(scope: AdminScope, studentId: string, documentId: string) {
  return db.studentDocument.findFirst({
    where: { id: documentId, studentId, ...studentScopeFilter(scope) },
    select: DOCUMENT_SELECT,
  })
}

export async function listStudentDocumentsForAdmin(scope: AdminScope, studentId: string) {
  return db.studentDocument.findMany({
    where: { studentId, ...studentScopeFilter(scope) },
    orderBy: { uploadedAt: 'desc' },
    select: DOCUMENT_SELECT,
  })
}

export async function getStudentHeaderForAdmin(scope: AdminScope, studentId: string) {
  return db.student.findFirst({
    where: { id: studentId, ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }) },
    select: { id: true, firstName: true, lastName: true, schoolId: true },
  })
}
