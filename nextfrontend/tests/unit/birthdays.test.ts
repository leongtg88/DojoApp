import { afterEach, describe, expect, it, vi } from 'vitest'
import { birthdayCountdown, computeBirthdays } from '@/lib/dashboard/birthdays'
import { ageFromCalendarDate } from '@/lib/format/datetime'

// Instante UTC que corresponde a una hora local de Santo Domingo (UTC-4 fijo).
function atSantoDomingo(year: number, monthIndex: number, day: number, hour = 12) {
  return new Date(Date.UTC(year, monthIndex, day, hour + 4, 0, 0))
}

function withTodayInSantoDomingo(year: number, monthIndex: number, day: number, hour = 12) {
  vi.useFakeTimers()
  vi.setSystemTime(atSantoDomingo(year, monthIndex, day, hour))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('computeBirthdays', () => {
  it('no resta un día a las fechas guardadas a medianoche UTC', () => {
    withTodayInSantoDomingo(2026, 4, 15) // 15 de mayo en RD

    const result = computeBirthdays([
      // Así se guardan en la API: `${fecha}T00:00:00.000Z`.
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date('2010-05-15T00:00:00.000Z') },
      { id: 'b', name: 'Beto', role: 'instructor', birthDate: new Date('1980-05-18T00:00:00.000Z') },
    ])

    expect(result[0]).toMatchObject({ id: 'a', daysUntil: 0, isToday: true })
    expect(result[0].dateOfBirth).toBe('2010-05-15')
    expect(result[1]).toMatchObject({ id: 'b', daysUntil: 3, isToday: false })
  })

  it('usa el día de RD aunque en UTC ya sea el día siguiente', () => {
    // 30 de abril, 22:00 en RD = 1 de mayo, 02:00 UTC.
    withTodayInSantoDomingo(2026, 3, 30, 22)

    const result = computeBirthdays([
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date('2010-05-01T00:00:00.000Z') },
    ])

    expect(result[0]).toMatchObject({ daysUntil: 1, isToday: false })
  })

  it('marca el cumpleaños de hoy cuando en RD ya es ese día', () => {
    withTodayInSantoDomingo(2026, 4, 1, 9)

    const result = computeBirthdays([
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date('2010-05-01T00:00:00.000Z') },
    ])

    expect(result[0]).toMatchObject({ daysUntil: 0, isToday: true })
  })

  it('excluye una fecha ya pasada (salta al próximo año y supera los 60 días)', () => {
    withTodayInSantoDomingo(2026, 4, 15)

    const result = computeBirthdays([
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date('2010-05-10T00:00:00.000Z') },
    ])

    expect(result).toHaveLength(0)
  })

  it('excluye los cumpleaños a más de 60 días', () => {
    withTodayInSantoDomingo(2026, 4, 15)

    const result = computeBirthdays([
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date('2010-08-01T00:00:00.000Z') },
    ])

    expect(result).toHaveLength(0)
  })

  it('expone el detalle del alumno o null', () => {
    withTodayInSantoDomingo(2026, 4, 15)

    const result = computeBirthdays([
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date('2010-05-16T00:00:00.000Z'), detail: 'Amarillo' },
      { id: 'b', name: 'Beto', role: 'instructor', birthDate: new Date('1980-05-17T00:00:00.000Z') },
    ])

    expect(result.find((entry) => entry.id === 'a')?.detail).toBe('Amarillo')
    expect(result.find((entry) => entry.id === 'b')?.detail).toBeNull()
  })
})

describe('birthdayCountdown', () => {
  it('devuelve la fecha correcta sin desplazarse', () => {
    const countdown = birthdayCountdown('1990-10-20T00:00:00.000Z', atSantoDomingo(2026, 9, 1))

    expect(countdown).toMatchObject({ daysUntil: 19, isToday: false, nextKey: '2026-10-20' })
    expect(countdown?.label).toBe('20 de octubre')
  })
})

describe('ageFromCalendarDate', () => {
  it('calcula la edad sin restar un día', () => {
    expect(ageFromCalendarDate('1990-10-20T00:00:00.000Z', atSantoDomingo(2026, 9, 20))).toBe(36)
    expect(ageFromCalendarDate('1990-10-20T00:00:00.000Z', atSantoDomingo(2026, 9, 19))).toBe(35)
  })
})
