import { describe, expect, it } from 'vitest'
import { computeBalance, formatHoursHM, hoursFromTimes, monthRange, sumConfirmedHours } from '@/lib/dashboard/balance'

// Fase 1 · F1-04 — Balance mensual (plan, beca, competidor) y utilidades de horas.
describe('computeBalance', () => {
  it('plan ilimitado: sin diferencia ni alerta', () => {
    const result = computeBalance({ confirmedHours: 42, planMonthlyHours: 8, isUnlimited: true })
    expect(result.level).toBe('OK')
    expect(result.alert).toBe(false)
    expect(result.planHours).toBeNull()
    expect(result.diff).toBeNull()
    expect(result.message).toMatch(/ilimitado/i)
  })

  it('plan sin horas definidas: informa sin alerta', () => {
    const result = computeBalance({ confirmedHours: 5, planMonthlyHours: null, isUnlimited: false })
    expect(result.alert).toBe(false)
    expect(result.message).toMatch(/sin horas/i)
  })

  it('dentro del rango (-2..+2) → OK', () => {
    expect(computeBalance({ confirmedHours: 10, planMonthlyHours: 8, isUnlimited: false }).level).toBe('OK')
    expect(computeBalance({ confirmedHours: 6, planMonthlyHours: 8, isUnlimited: false }).level).toBe('OK') // -2
    expect(computeBalance({ confirmedHours: 10, planMonthlyHours: 8, isUnlimited: false }).alert).toBe(false)
  })

  it('por debajo de -3 → LOW con alerta', () => {
    const result = computeBalance({ confirmedHours: 4, planMonthlyHours: 8, isUnlimited: false })
    expect(result.level).toBe('LOW')
    expect(result.alert).toBe(true)
    expect(result.diff).toBe(-4)
  })

  it('+3..+6 → HIGH y > +6 → VERY_HIGH', () => {
    expect(computeBalance({ confirmedHours: 11, planMonthlyHours: 8, isUnlimited: false }).level).toBe('HIGH')
    expect(computeBalance({ confirmedHours: 14, planMonthlyHours: 8, isUnlimited: false }).level).toBe('HIGH')
    expect(computeBalance({ confirmedHours: 15, planMonthlyHours: 8, isUnlimited: false }).level).toBe('VERY_HIGH')
  })

  it('la beca silencia la alerta (pero reporta nivel)', () => {
    const result = computeBalance({ confirmedHours: 2, planMonthlyHours: 8, isUnlimited: false, scholarshipType: 'ECONOMIC' })
    expect(result.level).toBe('LOW')
    expect(result.alert).toBe(false)
    expect(result.message).toMatch(/apoyo registrado/i)
  })

  it('el competidor silencia la alerta', () => {
    const result = computeBalance({ confirmedHours: 20, planMonthlyHours: 8, isUnlimited: false, isCompetitor: true })
    expect(result.alert).toBe(false)
    expect(result.message).toMatch(/competidor/i)
  })
})

describe('formatHoursHM', () => {
  it('formatea horas decimales redondeando al minuto', () => {
    expect(formatHoursHM(0)).toBe('0m')
    expect(formatHoursHM(2)).toBe('2h')
    expect(formatHoursHM(1.5)).toBe('1h 30m')
    expect(formatHoursHM(43.76)).toBe('43h 46m')
  })
})

describe('hoursFromTimes', () => {
  it('calcula la duración normal', () => {
    expect(hoursFromTimes('19:00', '21:00')).toBe(2)
    expect(hoursFromTimes('09:00', '10:30')).toBe(1.5)
  })

  it('tolera el cruce de medianoche', () => {
    expect(hoursFromTimes('23:00', '01:00')).toBe(2)
  })
})

describe('monthRange', () => {
  it('cubre el mes calendario completo (inicio inclusivo, fin exclusivo)', () => {
    const { start, end } = monthRange(new Date(2026, 5, 16))
    expect(start.getMonth()).toBe(5)
    expect(start.getDate()).toBe(1)
    expect(end.getMonth()).toBe(6)
    expect(end.getDate()).toBe(1)
  })
})

describe('sumConfirmedHours', () => {
  it('solo suma asistencias presentes y confirmadas', () => {
    const total = sumConfirmedHours([
      { present: true, status: 'CONFIRMED', hoursTrained: 1.5 },
      { present: true, status: 'PENDING', hoursTrained: 2 },
      { present: false, status: 'CONFIRMED', hoursTrained: 3 },
      { present: true, status: 'CONFIRMED', hoursTrained: 0.5 },
    ])
    expect(total).toBe(2)
  })
})
