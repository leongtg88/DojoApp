import type { DashboardBirthday } from '@/types/dashboard'
import { todayCalendarKey, toCalendarKey } from '@/lib/format/datetime'

export interface BirthdayPerson {
  id: string
  name: string
  role: 'student' | 'instructor'
  birthDate: Date
  detail?: string
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

// Etiqueta "día de mes" (sin año). Se formatea en UTC porque la clave del
// próximo cumpleaños también se construye en UTC.
const birthdayLabelFormatter = new Intl.DateTimeFormat('es-DO', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

export interface BirthdayCountdown {
  /** Días que faltan para el próximo cumpleaños (0 = hoy). */
  daysUntil: number
  isToday: boolean
  /** Clave "YYYY-MM-DD" del próximo cumpleaños. */
  nextKey: string
  /** Etiqueta legible del próximo cumpleaños (p. ej. "20 de octubre"). */
  label: string
}

function toKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

/**
 * Calcula el próximo cumpleaños a partir de una fecha de calendario guardada a
 * medianoche UTC. "Hoy" se evalúa en zona de RD, de modo que el resultado es
 * estable tanto en el servidor como en el navegador y no resta un día.
 */
export function birthdayCountdown(value: string | Date, today: Date = new Date()): BirthdayCountdown | null {
  const birthKey = toCalendarKey(value)
  if (!birthKey) return null

  const [todayYear, todayMonth, todayDay] = todayCalendarKey(today).split('-').map(Number)
  const [, birthMonth, birthDay] = birthKey.split('-').map(Number)

  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay)
  let nextUtc = Date.UTC(todayYear, birthMonth - 1, birthDay)
  if (nextUtc < todayUtc) {
    nextUtc = Date.UTC(todayYear + 1, birthMonth - 1, birthDay)
  }

  const next = new Date(nextUtc)

  return {
    daysUntil: Math.round((nextUtc - todayUtc) / MILLISECONDS_PER_DAY),
    isToday: nextUtc === todayUtc,
    nextKey: toKey(next),
    label: birthdayLabelFormatter.format(next),
  }
}

export function computeBirthdays(people: BirthdayPerson[]): DashboardBirthday[] {
  return people
    .map((person) => {
      const countdown = birthdayCountdown(person.birthDate)
      if (!countdown) return null

      return {
        id: person.id,
        name: person.name,
        dateOfBirth: toCalendarKey(person.birthDate) ?? '',
        daysUntil: countdown.daysUntil,
        role: person.role,
        isToday: countdown.isToday,
        detail: person.detail ?? null,
      }
    })
    .filter((entry): entry is DashboardBirthday => entry !== null && entry.daysUntil <= 60)
    .sort((first, second) => first.daysUntil - second.daysUntil)
}
