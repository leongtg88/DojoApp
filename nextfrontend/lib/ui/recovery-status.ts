/**
 * UX-01 · Estados visibles de reposición (guía, sección 5).
 *
 * Son estados de **presentación**, no el estado de la base de datos.
 * `OnlineRecoveryStatus` (`SCHEDULED | COMPLETED | CANCELLED | NO_SHOW`) sigue
 * siendo la fuente del flujo online; la derivación entre ambos mundos se define
 * y se implementa en UX-A6. Aquí solo viven las etiquetas que ve la persona.
 */

export const RECOVERY_UI_STATUSES = [
  'por_reponer',
  'en_revision',
  'programada',
  'repuesta',
  'repuesta_por_otra_via',
  'cancelada',
  'no_asististe',
] as const

export type RecoveryUiStatus = (typeof RECOVERY_UI_STATUSES)[number]

/**
 * Orden de la guía: `Por reponer` → `En revisión` → `Programada` → `Repuesta`,
 * y después los terminales o de retorno.
 */
export const RECOVERY_UI_STATUS_LABELS: Readonly<Record<RecoveryUiStatus, string>> = {
  por_reponer: 'Por reponer',
  en_revision: 'En revisión',
  programada: 'Programada',
  repuesta: 'Repuesta',
  repuesta_por_otra_via: 'Repuesta por otra vía',
  cancelada: 'Cancelada',
  no_asististe: 'No asististe',
}

export function isRecoveryUiStatus(value: unknown): value is RecoveryUiStatus {
  return typeof value === 'string' && (RECOVERY_UI_STATUSES as readonly string[]).includes(value)
}

export function getRecoveryStatusLabel(status: RecoveryUiStatus): string {
  return RECOVERY_UI_STATUS_LABELS[status]
}
