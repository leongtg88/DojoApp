// Límites anti-abuso del auto-registro de asistencia (punch-in del alumno).
// El control final sigue siendo la confirmación del instructor/admin; estos
// topes evitan ráfagas, inflado de horas y spam de notificaciones desde el
// cliente (por ejemplo, reenviando la petición con el inspector del navegador).

const TIME_ZONE = 'America/Santo_Domingo'

export const ATTENDANCE_LIMITS = {
  /** Peticiones de punch-in por hora y por alumno. */
  maxPunchesPerHourStudent: 10,
  /** Peticiones de punch-in por hora y por IP (cubre ráfagas entre cuentas). */
  maxPunchesPerHourIp: 30,
  /** Ediciones/borrados por hora y por alumno. */
  maxEditsPerHourStudent: 20,
  /** Registros auto-reportados permitidos por día (excluye pases de lista). */
  maxSelfReportedPerDay: 4,
  /** Horas auto-reportadas permitidas por día. */
  maxHoursPerDay: 8,
  /** Separación mínima entre punches auto-reportados del mismo alumno. */
  minMinutesBetweenPunches: 2,
  /** Repeticiones auto-reportadas permitidas por día. */
  maxDailySelfReportedReps: 5000,
} as const

function getTimeZoneOffsetMs(date: Date): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(date.toLocaleString('en-US', { timeZone: TIME_ZONE }))
  return local.getTime() - utc.getTime()
}

export interface LocalDayBounds {
  start: Date
  end: Date
}

/**
 * Devuelve el inicio y el fin (exclusivo) del día local de República Dominicana
 * que contiene la fecha indicada.
 */
export function getLocalDayBounds(date: Date): LocalDayBounds {
  const offset = getTimeZoneOffsetMs(date)
  const shifted = new Date(date.getTime() + offset)

  const startShifted = new Date(shifted)
  startShifted.setUTCHours(0, 0, 0, 0)

  const endShifted = new Date(startShifted)
  endShifted.setUTCDate(endShifted.getUTCDate() + 1)

  return {
    start: new Date(startShifted.getTime() - offset),
    end: new Date(endShifted.getTime() - offset),
  }
}
