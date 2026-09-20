import type { ClassSchedule } from '@/types/dashboard'

/**
 * Utilidades puras de horario (sin acceso a base de datos).
 * Separadas de class-schedule.ts para poder usarse desde componentes cliente
 * sin arrastrar el driver de Postgres al bundle.
 */

/** Convierte un Date a la clave "HH:MM" usada en ClassSchedule.startTime/endTime. */
export function dateToTime(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Devuelve la próxima clase de un horario semanal a partir de `now`.
 * Lógica extraída de StudentSchedule para reutilizarla en resúmenes.
 */
export function nextClassFrom<T extends ClassSchedule>(classes: T[], now = new Date()): T | null {
  let nearest: T | null = null
  let nearestDate: Date | null = null

  for (const scheduledClass of classes) {
    const [hours, minutes] = scheduledClass.startTime.split(':').map(Number)
    const candidate = new Date(now)
    candidate.setHours(hours, minutes, 0, 0)

    let daysUntil = (scheduledClass.dayOfWeek - now.getDay() + 7) % 7
    if (daysUntil === 0 && candidate <= now) {
      daysUntil = 7
    }
    candidate.setDate(now.getDate() + daysUntil)

    if (!nearestDate || candidate < nearestDate) {
      nearest = scheduledClass
      nearestDate = candidate
    }
  }

  return nearest
}

/** Nombres cortos de días de la semana (Domingo = 0). */
export const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const WEEKDAY_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** "Jueves 4:00 PM" a partir de una clase y una fecha de referencia. */
export function formatNextClass(scheduledClass: ClassSchedule, now = new Date()): string {
  const [hours, minutes] = scheduledClass.startTime.split(':').map(Number)
  const date = new Date(now)
  date.setHours(hours, minutes, 0, 0)
  const daysUntil = (scheduledClass.dayOfWeek - now.getDay() + 7) % 7
  date.setDate(now.getDate() + daysUntil)

  const dayLabel = daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : WEEKDAY_LONG[scheduledClass.dayOfWeek]
  const time = new Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit' }).format(date)
  return `${dayLabel} · ${time}`
}