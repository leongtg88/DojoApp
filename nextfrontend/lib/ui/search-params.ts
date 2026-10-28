/**
 * UX-B5.1 · Validación única de los parámetros de URL que usa el panel admin.
 *
 * Los valores desconocidos se ignoran (se comportan como ausentes). Así
 * `?plan=otra-cosa` no deja la pantalla en un estado inventado y
 * `?tab=loquesea` cae en la pestaña por defecto.
 */

/** Valor que activa el filtro "sin plan/sin horario". */
export const PENDING_FILTER_VALUE = 'none' as const

export function parseStudentPendingFilter(value: string | undefined): boolean {
  return value === PENDING_FILTER_VALUE
}

export const ATTENDANCE_TABS = ['pase', 'reposiciones', 'auditoria', 'politica'] as const

export type AttendanceTab = (typeof ATTENDANCE_TABS)[number]

export function parseAttendanceTab(value: string | undefined): AttendanceTab | undefined {
  return ATTENDANCE_TABS.find((tab) => tab === value)
}

/** Valida una fecha `YYYY-MM-DD`; cualquier otro formato se ignora. */
export function parseIsoDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}
