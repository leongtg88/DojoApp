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

/** Clave de fecha local "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Fecha de la sesión más reciente (hoy o pasada) de un horario semanal.
 * Si hoy es el día de la clase devuelve hoy; si no, la ocurrencia pasada más cercana.
 */
export function latestSessionDate(dayOfWeek: number, now = new Date()): Date {
  const diff = (now.getDay() - dayOfWeek + 7) % 7
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

/** true si la hora actual cae dentro de la ventana [start, end] (tolerando cruce de medianoche). */
function isWithinWindow(startTime: string, endTime: string, nowMinutes: number): boolean {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)
  if (end <= start) end += 24 * 60
  const adjusted = nowMinutes < start ? nowMinutes + 24 * 60 : nowMinutes
  return adjusted >= start && adjusted <= end
}

/**
 * Elige la clase por defecto a mostrar: la del bloque en curso hoy (o la de hoy),
 * y si hoy no hay clase, la de la última sesión que se dio. Si nunca ha habido
 * sesión, devuelve la próxima más cercana.
 */
export function resolveDefaultSessionClass<T extends { dayOfWeek: number; startTime: string; endTime?: string }>(
  classes: T[],
  now = new Date(),
): T | null {
  if (classes.length === 0) return null

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const todayClasses = classes.filter((scheduledClass) => scheduledClass.dayOfWeek === now.getDay())
  const byStartAsc = (a: T, b: T) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)

  if (todayClasses.length > 0) {
    const sorted = [...todayClasses].sort(byStartAsc)
    const inProgress = sorted.find((scheduledClass) =>
      isWithinWindow(scheduledClass.startTime, scheduledClass.endTime ?? scheduledClass.startTime, nowMinutes),
    )
    if (inProgress) return inProgress

    // La última que ya comenzó hoy; si ninguna, la próxima de hoy.
    const started = sorted.filter((scheduledClass) => timeToMinutes(scheduledClass.startTime) <= nowMinutes)
    return started.length > 0 ? started[started.length - 1] : sorted[0]
  }

  // Ninguna clase hoy: la de la última sesión dada (fecha pasada más reciente).
  const withSession = classes.map((scheduledClass) => ({
    scheduledClass,
    sessionDate: latestSessionDate(scheduledClass.dayOfWeek, now),
  }))
  withSession.sort((a, b) => {
    const dateDelta = b.sessionDate.getTime() - a.sessionDate.getTime()
    return dateDelta !== 0 ? dateDelta : timeToMinutes(b.scheduledClass.startTime) - timeToMinutes(a.scheduledClass.startTime)
  })
  return withSession[0].scheduledClass
}

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