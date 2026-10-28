/**
 * UX-B5.1 · Definición única de "alumno pendiente" para los contadores de Hoy
 * y el filtro de Alumnos. No excluye por rol: un instructor con expediente de
 * alumno cuenta si está activo y no tiene la marca de exclusión.
 */
export const PENDING_STUDENT_STATUS = 'ACTIVE' as const
export const PENDING_STUDENT_EXCLUDED = false as const

export interface PendingStudentLike {
  status: string
  excludeFromPendingCounts: boolean
}

export function isPendingStudent(student: PendingStudentLike): boolean {
  return student.status === PENDING_STUDENT_STATUS && !student.excludeFromPendingCounts
}
