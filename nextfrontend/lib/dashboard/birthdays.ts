import type { DashboardBirthday } from '@/types/dashboard'

export interface BirthdayPerson {
  id: string
  name: string
  role: 'student' | 'instructor'
  birthDate: Date
  detail?: string
}

export function computeBirthdays(people: BirthdayPerson[]): DashboardBirthday[] {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const millisecondsPerDay = 1000 * 60 * 60 * 24

  return people
    .map((person) => {
      const nextBirthday = new Date(today.getFullYear(), person.birthDate.getMonth(), person.birthDate.getDate())
      if (nextBirthday < startOfToday) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
      }

      return {
        id: person.id,
        name: person.name,
        dateOfBirth: person.birthDate.toISOString(),
        daysUntil: Math.round((nextBirthday.getTime() - startOfToday.getTime()) / millisecondsPerDay),
        role: person.role,
        isToday: nextBirthday.getTime() === startOfToday.getTime(),
        detail: person.detail ?? null,
      }
    })
    .filter(({ daysUntil }) => daysUntil <= 60)
    .sort((first, second) => first.daysUntil - second.daysUntil)
}