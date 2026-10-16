import { describe, expect, it } from 'vitest'
import { latestSessionDate, resolveDefaultSessionClass, santoDomingoDayKey } from '@/lib/dashboard/schedule-utils'

// Instante fijo: 2026-06-16 00:30 UTC = 2026-06-15 20:30 en Santo Domingo (UTC-4).
// En un servidor UTC el "hoy/hora" del sistema sería martes 00:30, distinto del día
// real del dojo (lunes 20:30). Sirve para verificar que se resuelve en zona RD.
const NOCHE_EN_RD = new Date('2026-06-16T00:30:00Z')

describe('resolveDefaultSessionClass', () => {
  it('elige la clase en curso según la hora de Santo Domingo, no la del servidor', () => {
    const lunes = { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' }
    const martes = { dayOfWeek: 2, startTime: '09:00', endTime: '10:00' }

    expect(resolveDefaultSessionClass([martes, lunes], NOCHE_EN_RD)).toBe(lunes)
  })

  it('cuando las clases de hoy ya terminaron, devuelve la última que ya comenzó', () => {
    // 20:30 RD del lunes: la clase matutina del lunes ya terminó.
    const lunes = { dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }
    const martes = { dayOfWeek: 2, startTime: '09:00', endTime: '10:00' }

    expect(resolveDefaultSessionClass([martes, lunes], NOCHE_EN_RD)).toBe(lunes)
  })
})

describe('latestSessionDate', () => {
  it('usa el día local del dojo para la ocurrencia de hoy', () => {
    expect(santoDomingoDayKey(latestSessionDate(1, NOCHE_EN_RD))).toBe('2026-06-15')
  })

  it('devuelve la ocurrencia pasada más cercana cuando hoy no toca', () => {
    expect(santoDomingoDayKey(latestSessionDate(2, NOCHE_EN_RD))).toBe('2026-06-09')
  })
})
