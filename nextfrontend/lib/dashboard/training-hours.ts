import { classHours } from '@/lib/dashboard/balance'
import { dateKey, startOfDay } from '@/lib/dashboard/holidays'

export type TrainingAudience = 'ADULTS' | 'CHILDREN'

export interface TrainingScheduleClass {
  id: string
  name: string
  audience: 'ADULTS' | 'CHILDREN' | 'MIXED'
  dayOfWeek: number
  startTime: string
  endTime: string
}

export function audienceMatches(classAudience: TrainingScheduleClass['audience'], audience: TrainingAudience): boolean {
  return classAudience === audience || classAudience === 'MIXED'
}

/**
 * Número de ocurrencias del día de la semana en [start, end) que no caen en feriado.
 */
export function countClassOccurrences(
  dayOfWeek: number,
  start: Date,
  end: Date,
  holidays: Set<string>,
): number {
  let count = 0
  const cursor = startOfDay(start)
  cursor.setDate(cursor.getDate() + ((dayOfWeek - cursor.getDay() + 7) % 7))

  while (cursor.getTime() < end.getTime()) {
    if (!holidays.has(dateKey(cursor))) count += 1
    cursor.setDate(cursor.getDate() + 7)
  }

  return count
}

export interface AvailableHoursResult {
  hours: number
  sessions: number
  byClass: { id: string; name: string; sessions: number; hours: number }[]
}

/**
 * Horas y sesiones disponibles para un alumno según los horarios activos de su
 * audiencia en un periodo, descontando los feriados.
 */
export function availableTrainingHours(
  classes: TrainingScheduleClass[],
  options: { audience: TrainingAudience; start: Date; end: Date; holidays: Set<string> },
): AvailableHoursResult {
  const { audience, start, end, holidays } = options
  let hours = 0
  let sessions = 0
  const byClass: AvailableHoursResult['byClass'] = []

  for (const scheduledClass of classes) {
    if (!audienceMatches(scheduledClass.audience, audience)) continue

    const occurrences = countClassOccurrences(scheduledClass.dayOfWeek, start, end, holidays)
    if (occurrences === 0) continue

    const classHoursValue = classHours(scheduledClass)
    const classTotal = Number((classHoursValue * occurrences).toFixed(2))

    sessions += occurrences
    hours += classTotal
    byClass.push({ id: scheduledClass.id, name: scheduledClass.name, sessions: occurrences, hours: classTotal })
  }

  return { hours: Number(hours.toFixed(2)), sessions, byClass }
}
