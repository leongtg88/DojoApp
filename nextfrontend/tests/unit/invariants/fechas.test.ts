import { describe, expect, it } from 'vitest'
import { formatCalendarDate, formatDate, formatDateTime, toSantoDomingoDateTimeLocal } from '@/lib/format/datetime'

// INV-01 · Las fechas de calendario se guardan a medianoche UTC y se formatean en UTC.
// Regresión: mostrar la fecha de nacimiento en zona RD restaba un día (5 en vez de 6).
describe('INV-01 · fechas de calendario en UTC', () => {
  it('no resta un día al formatear una fecha de nacimiento (medianoche UTC)', () => {
    expect(formatCalendarDate('2017-05-06T00:00:00.000Z')).toBe('6 de mayo de 2017')
  })

  it('acepta tanto la clave "YYYY-MM-DD" como el instante ISO', () => {
    expect(formatCalendarDate('2017-05-06')).toBe(formatCalendarDate('2017-05-06T00:00:00.000Z'))
  })

  it('un instante se formatea en zona RD (no en UTC) y sin espacios no separables', () => {
    // 2026-06-16 00:30 UTC = 2026-06-15 20:30 en Santo Domingo.
    expect(formatDate('2026-06-16T00:30:00Z')).toBe('15 de junio de 2026')
    expect(formatDateTime('2026-06-16T00:30:00Z')).not.toMatch(/[\u00a0\u202f]/)
  })

  it('convierte un instante al valor datetime-local de RD', () => {
    expect(toSantoDomingoDateTimeLocal('2026-10-21T22:00:00.000Z')).toBe('2026-10-21T18:00')
    expect(toSantoDomingoDateTimeLocal('2026-10-22T02:30:00.000Z')).toBe('2026-10-21T22:30')
  })
})
