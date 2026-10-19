import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeBirthdays } from '@/lib/dashboard/birthdays'

// Se usan constructores locales para que las componentes de fecha no dependan
// de la zona horaria de la máquina.
function withToday(year: number, monthIndex: number, day: number) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(year, monthIndex, day, 12, 0, 0))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('computeBirthdays', () => {
  it('ordena por días restantes y marca el cumpleaños de hoy', () => {
    withToday(2026, 4, 15)

    const result = computeBirthdays([
      { id: 'b', name: 'Beto', role: 'instructor', birthDate: new Date(1980, 4, 18) },
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date(2010, 4, 15) },
    ])

    expect(result[0]).toMatchObject({ id: 'a', daysUntil: 0, isToday: true })
    expect(result[1]).toMatchObject({ id: 'b', daysUntil: 3, isToday: false })
  })

  it('excluye una fecha ya pasada (salta al próximo año y supera los 60 días)', () => {
    withToday(2026, 4, 15)

    const result = computeBirthdays([{ id: 'a', name: 'Ana', role: 'student', birthDate: new Date(2010, 4, 10) }])

    expect(result).toHaveLength(0)
  })

  it('excluye los cumpleaños a más de 60 días', () => {
    withToday(2026, 4, 15)

    const result = computeBirthdays([{ id: 'a', name: 'Ana', role: 'student', birthDate: new Date(2010, 7, 1) }])

    expect(result).toHaveLength(0)
  })

  it('expone el detalle del alumno o null', () => {
    withToday(2026, 4, 15)

    const result = computeBirthdays([
      { id: 'a', name: 'Ana', role: 'student', birthDate: new Date(2010, 4, 16), detail: 'Amarillo' },
      { id: 'b', name: 'Beto', role: 'instructor', birthDate: new Date(1980, 4, 17) },
    ])

    expect(result.find((entry) => entry.id === 'a')?.detail).toBe('Amarillo')
    expect(result.find((entry) => entry.id === 'b')?.detail).toBeNull()
  })
})
