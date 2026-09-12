import type { ClassAudience, ScholarshipType } from '@/lib/generated/prisma'

export type ScheduleClass = {
  id: string
  name: string
  audience: ClassAudience
  active: boolean
  dayOfWeek: number
  startTime: string
  endTime: string
}

/** Rango del mes calendario natural de `date` (LocalDateTime, primer día 00:00 → primer día del mes siguiente). */
export function monthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start, end }
}

/** Parsea "HH:MM" a minutos desde las 00:00. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

/** Normaliza un valor TIME de Prisma (Date con hora UTC = hora guardada) a "HH:MM". */
export function formatTime(time: Date | string): string {
  return typeof time === 'string' ? time : time.toISOString().slice(11, 16)
}

/** Duración en horas de un rango de clase, tolerando cruce de medianoche. */
export function hoursFromTimes(startTime: string, endTime: string): number {
  let duration = timeToMinutes(endTime) - timeToMinutes(startTime)
  if (duration <= 0) duration += 24 * 60
  return Number((duration / 60).toFixed(2))
}

export function classHours(cls: { startTime: string; endTime: string }): number {
  return hoursFromTimes(cls.startTime, cls.endTime)
}

export function isTimeWithin(startTime: string, endTime: string, minutes: number, toleranceMinutes = 60): boolean {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)
  if (end < start) end += 24 * 60
  const adjusted = minutes < start ? minutes + 24 * 60 : minutes
  return adjusted >= start - toleranceMinutes && adjusted <= end
}

/**
 * Resuelve qué horario (Class) corresponde a una fecha/hora dada. Busca entre los
 * horarios activos el que coincide con el día de la semana y cuya ventana de tiempo
 * (con tolerancia de 1h) contiene el momento. Devuelve `null` si no hay coincidencia.
 */
export function resolveClassByTime(
  classes: ScheduleClass[],
  date: Date,
  toleranceMinutes = 60,
): ScheduleClass | null {
  const minutes = date.getHours() * 60 + date.getMinutes()
  const weekday = date.getDay()
  return (
    classes.find(
      (scheduledClass) =>
        scheduledClass.active &&
        scheduledClass.dayOfWeek === weekday &&
        isTimeWithin(scheduledClass.startTime, scheduledClass.endTime, minutes, toleranceMinutes),
    ) ?? null
  )
}

/** Detecta si el alumno asiste a un horario distinto al de sus horarios de referencia. */
export function isOutOfSchedule(referenceClassIds: Set<string>, actualClassId: string | null | undefined): boolean {
  return actualClassId != null && !referenceClassIds.has(actualClassId)
}

export type BalanceLevel = 'OK' | 'LOW' | 'HIGH' | 'VERY_HIGH'

export type BalanceResult = {
  confirmedHours: number
  planHours: number | null
  diff: number | null
  level: BalanceLevel
  alert: boolean
  message: string
}

/**
 * Regla de balance mensual (B.3):
 *  - Plan ilimitado → solo se muestra total, sin alerta.
 *  - beca/competidor → la alerta va desactivada pero el reporte es visible.
 *  - -2..+2   → OK
 *  - +3..+6  → "entrena como plan superior" (HIGH)
 *  - > +6    → "revisar" (VERY_HIGH)
 *  - < -3    → "baja asistencia, contactar" (LOW)
 * No sugiere cambios de plan (se resuelve fuera de la app).
 */
export function computeBalance(params: {
  confirmedHours: number
  planMonthlyHours: number | null
  isUnlimited: boolean
  scholarshipType?: ScholarshipType
  isCompetitor?: boolean
}): BalanceResult {
  const { confirmedHours, planMonthlyHours, isUnlimited } = params
  const hasGrace = params.scholarshipType !== undefined && params.scholarshipType !== 'NONE'
  const silent = hasGrace || params.isCompetitor === true

  if (isUnlimited || planMonthlyHours == null || planMonthlyHours <= 0) {
    return {
      confirmedHours,
      planHours: isUnlimited ? null : planMonthlyHours,
      diff: null,
      level: 'OK',
      alert: false,
      message: isUnlimited
        ? 'Plan ilimitado — se registran horas sin tope mensual.'
        : 'Plan sin horas mensuales definidas.',
    }
  }

  const diff = Number((confirmedHours - planMonthlyHours).toFixed(2))
  const rounded = Math.round(diff)
  let level: BalanceLevel = 'OK'
  let message = 'Dentro del rango esperado del plan.'

  if (rounded < -3) {
    level = 'LOW'
    message = 'Baja asistencia, contactar al alumno.'
  } else if (rounded > 6) {
    level = 'VERY_HIGH'
    message = 'Entrena muy por encima del plan, revisar.'
  } else if (rounded > 2) {
    level = 'HIGH'
    message = 'Entrena como un plan superior.'
  }

  if (silent) {
    message = hasGrace
      ? `Apoyo registrado (${params.scholarshipType}) — horas contadas sin alerta.`
      : 'Competidor — horas contadas sin alerta.'
  }

  return { confirmedHours, planHours: planMonthlyHours, diff, level, alert: !silent && level !== 'OK' && (planMonthlyHours ?? 0) > 0, message }
}

export type RecoverySource = {
  id: string
  date: Date
}

/** Faltas justificadas aún no recuperadas, en orden FIFO (por fecha de la falta). */
export function pendingRecoveries<T extends { recovery: unknown | null }>(
  justifiedAbsences: Array<RecoverySource & T>,
) {
  return justifiedAbsences
    .filter((absence) => absence.recovery == null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Suma de horas confirmadas de una lista de asistencias. */
export function sumConfirmedHours(
  attendances: Array<{ hoursTrained: number | null; status: string; present: boolean }>,
): number {
  return attendances
    .filter((record) => record.present && record.status === 'CONFIRMED')
    .reduce((total, record) => total + (record.hoursTrained ?? 0), 0)
}

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']