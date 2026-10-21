import { describe, expect, it } from 'vitest'
import {
  FREE_ABSENCES_PER_MONTH,
  evaluateExamRight,
  forgivenAttendance,
  resolveAbsencePolicyAt,
  summarizeMonthlyAbsences,
  type AbsenceLike,
} from '@/lib/dashboard/absence-policy'

// Mediodía de Santo Domingo: evita que la fecha cruce de mes por zona horaria.
const noonInRd = (date: string) => new Date(`${date}T16:00:00Z`)

function absence(date: string, overrides: Partial<AbsenceLike> = {}): AbsenceLike {
  return {
    date: noonInRd(date),
    status: 'ABSENT',
    recoveredById: null,
    recoveredAt: null,
    ...overrides,
  }
}

describe('summarizeMonthlyAbsences', () => {
  it('no reporta pendientes con 0, 1 o 2 faltas en el mes', () => {
    expect(summarizeMonthlyAbsences([])).toEqual([])

    const one = summarizeMonthlyAbsences([absence('2026-10-05')])
    expect(one).toHaveLength(1)
    expect(one[0]).toMatchObject({ count: 1, recovered: 0, excess: 0, pendingRecovery: 0 })

    const two = summarizeMonthlyAbsences([absence('2026-10-05'), absence('2026-10-12')])
    expect(two[0]).toMatchObject({ count: 2, excess: 0, pendingRecovery: 0 })
  })

  it('marca como pendiente la tercera falta del mes', () => {
    const summary = summarizeMonthlyAbsences([
      absence('2026-10-05'),
      absence('2026-10-12'),
      absence('2026-10-19'),
    ])

    expect(summary[0]).toMatchObject({ count: 3, recovered: 0, excess: 1, pendingRecovery: 1 })
  })

  it('cuenta la falta repuesta en el total pero la saca de las pendientes', () => {
    const summary = summarizeMonthlyAbsences([
      absence('2026-10-05'),
      absence('2026-10-12'),
      absence('2026-10-19', { recoveredById: 'make-up-1' }),
    ])

    expect(summary[0]).toMatchObject({ count: 3, recovered: 1, excess: 1, pendingRecovery: 0 })
  })

  it('exige reponer solo el excedente que sigue sin reponerse', () => {
    const summary = summarizeMonthlyAbsences([
      absence('2026-10-05'),
      absence('2026-10-12'),
      absence('2026-10-19', { recoveredById: 'make-up-1' }),
      absence('2026-10-26'),
    ])

    expect(summary[0]).toMatchObject({ count: 4, recovered: 1, excess: 2, pendingRecovery: 1 })
  })

  it('trata igual las faltas justificadas y las no justificadas', () => {
    const summary = summarizeMonthlyAbsences([
      absence('2026-10-05', { status: 'JUSTIFIED' }),
      absence('2026-10-12', { status: 'JUSTIFIED' }),
      absence('2026-10-19', { status: 'JUSTIFIED' }),
    ])

    expect(summary[0]).toMatchObject({ count: 3, justified: 3, pendingRecovery: 1 })
  })

  it('separa por mes calendario de Santo Domingo, no por la zona del servidor', () => {
    const summary = summarizeMonthlyAbsences([
      // 2026-11-01 02:00 UTC = 2026-10-31 22:00 en RD: sigue siendo octubre.
      absence('2026-10-31', { date: new Date('2026-11-01T02:00:00Z') }),
      absence('2026-11-02'),
    ])

    expect(summary.map((month) => month.key)).toEqual(['2026-10', '2026-11'])
    expect(summary[0].label).toMatch(/octubre de 2026/i)
    expect(summary[1].label).toMatch(/noviembre de 2026/i)
  })

  it('expone el cupo mensual compartido con la UI', () => {
    expect(FREE_ABSENCES_PER_MONTH).toBe(2)
  })
})

describe('evaluateExamRight', () => {
  const today = new Date('2026-10-20T12:00:00Z')

  it('no marca riesgo ni pérdida sin faltas pendientes', () => {
    expect(evaluateExamRight([{ end: new Date('2026-12-31T00:00:00Z'), pendingRecovery: 0 }], today)).toEqual({
      lost: false,
      atRisk: false,
    })
  })

  it('deja el derecho en riesgo mientras el cuatrimestre no cierra', () => {
    expect(evaluateExamRight([{ end: new Date('2026-12-31T00:00:00Z'), pendingRecovery: 1 }], today)).toEqual({
      lost: false,
      atRisk: true,
    })
  })

  it('pierde el derecho cuando el cuatrimestre cierra con pendientes', () => {
    expect(evaluateExamRight([{ end: new Date('2026-09-30T00:00:00Z'), pendingRecovery: 2 }], today)).toEqual({
      lost: true,
      atRisk: false,
    })
  })

  it('prioriza la pérdida sobre el riesgo si hay un cuatrimestre cerrado con pendientes', () => {
    const result = evaluateExamRight(
      [
        { end: new Date('2026-09-30T00:00:00Z'), pendingRecovery: 1 },
        { end: new Date('2026-12-31T00:00:00Z'), pendingRecovery: 1 },
      ],
      today,
    )

    expect(result).toEqual({ lost: true, atRisk: false })
  })
})

describe('forgivenAttendance', () => {
  it('exime como máximo las 2 primeras faltas justificadas del mes', () => {
    expect(forgivenAttendance(0)).toBe(0)
    expect(forgivenAttendance(1)).toBe(1)
    expect(forgivenAttendance(2)).toBe(2)
    expect(forgivenAttendance(3)).toBe(2)
    expect(forgivenAttendance(-1)).toBe(0)
  })
})

describe('política al cierre', () => {
  const closedAt = new Date('2026-10-31T16:00:00Z')
  const onTime = new Date('2026-10-20T16:00:00Z')
  const late = new Date('2026-11-05T16:00:00Z')

  const absences = [
    absence('2026-10-05'),
    absence('2026-10-12'),
    absence('2026-10-19', { recoveredById: 'make-up-1', recoveredAt: late }),
  ]

  it('LOCK: la reposición posterior al cierre no reduce las pendientes', () => {
    const [october] = summarizeMonthlyAbsences(absences, { closedAt, policy: 'LOCK_AT_CLOSE' })

    expect(october).toMatchObject({
      count: 3,
      recovered: 1,
      lateRecovery: 1,
      pendingRecovery: 1,
      creditedSessions: 1,
    })
  })

  it('RESTORE: la reposición posterior al cierre sí reduce las pendientes', () => {
    const [october] = summarizeMonthlyAbsences(absences, { closedAt, policy: 'RESTORE_ON_RECOVERY' })

    expect(october).toMatchObject({
      count: 3,
      recovered: 1,
      lateRecovery: 0,
      pendingRecovery: 0,
    })
  })

  it('LOCK: una reposición hecha antes del cierre sí cuenta', () => {
    const [october] = summarizeMonthlyAbsences(
      [
        absence('2026-10-05'),
        absence('2026-10-12'),
        absence('2026-10-19', { recoveredById: 'make-up-1', recoveredAt: onTime }),
      ],
      { closedAt, policy: 'LOCK_AT_CLOSE' },
    )

    expect(october).toMatchObject({ pendingRecovery: 0, lateRecovery: 0 })
  })
})

describe('reparación del porcentaje mensual', () => {
  const onTime = new Date('2026-10-20T16:00:00Z')

  it('acredita las repuestas y hasta 2 justificadas no repuestas', () => {
    const [october] = summarizeMonthlyAbsences([
      absence('2026-10-01', { status: 'JUSTIFIED', recoveredById: 'm1', recoveredAt: onTime }),
      absence('2026-10-02', { status: 'JUSTIFIED', recoveredById: 'm2', recoveredAt: onTime }),
      absence('2026-10-03', { status: 'JUSTIFIED', recoveredById: 'm3', recoveredAt: onTime }),
      absence('2026-10-04', { status: 'JUSTIFIED' }),
      absence('2026-10-05', { status: 'JUSTIFIED' }),
    ])

    expect(october).toMatchObject({
      count: 5,
      recovered: 3,
      recoveredJustified: 3,
      forgivenSessions: 2,
      creditedSessions: 5,
      pendingRecovery: 0,
    })
  })

  it('no exime del % las faltas no justificadas que no se reponen', () => {
    const [october] = summarizeMonthlyAbsences([
      absence('2026-10-01', { status: 'JUSTIFIED', recoveredById: 'm1', recoveredAt: onTime }),
      absence('2026-10-02', { status: 'JUSTIFIED', recoveredById: 'm2', recoveredAt: onTime }),
      absence('2026-10-03', { status: 'JUSTIFIED', recoveredById: 'm3', recoveredAt: onTime }),
      absence('2026-10-04'),
      absence('2026-10-05'),
    ])

    expect(october).toMatchObject({
      recovered: 3,
      forgivenSessions: 0,
      creditedSessions: 3,
      pendingRecovery: 0,
    })
  })
})

describe('resolveAbsencePolicyAt', () => {
  const history = [
    { policy: 'LOCK_AT_CLOSE' as const, effectiveFrom: new Date('2026-01-01T00:00:00Z') },
    { policy: 'RESTORE_ON_RECOVERY' as const, effectiveFrom: new Date('2026-06-01T00:00:00Z') },
  ]

  it('usa la última política vigente antes de la fecha', () => {
    expect(resolveAbsencePolicyAt(history, new Date('2026-03-01T00:00:00Z'))).toBe('LOCK_AT_CLOSE')
    expect(resolveAbsencePolicyAt(history, new Date('2026-07-01T00:00:00Z'))).toBe('RESTORE_ON_RECOVERY')
  })

  it('sin historial usa LOCK_AT_CLOSE', () => {
    expect(resolveAbsencePolicyAt([], new Date('2026-07-01T00:00:00Z'))).toBe('LOCK_AT_CLOSE')
  })

  it('un cambio posterior no afecta un cierre anterior', () => {
    const later = [
      ...history,
      { policy: 'LOCK_AT_CLOSE' as const, effectiveFrom: new Date('2026-08-01T00:00:00Z') },
    ]

    expect(resolveAbsencePolicyAt(later, new Date('2026-07-01T00:00:00Z'))).toBe('RESTORE_ON_RECOVERY')
  })
})

describe('escenario 5 / 3 / 6 / 0', () => {
  const onTime = new Date('2026-11-20T16:00:00Z')
  const closedAt = new Date('2026-12-01T00:00:00Z')

  const absences = [
    ...Array.from({ length: 5 }, (_, index) => absence(`2026-09-0${index + 1}`)),
    ...Array.from({ length: 3 }, (_, index) => absence(`2026-10-0${index + 1}`)),
    ...Array.from({ length: 6 }, (_, index) => absence(`2026-11-0${index + 1}`)),
  ]

  const recover = (monthAbsences: AbsenceLike[], count: number) =>
    monthAbsences.map((entry, index) => (
      index < count ? { ...entry, recoveredById: `make-up-${index}`, recoveredAt: onTime } : entry
    ))

  it('sin reponer deja 8 pendientes', () => {
    const summary = summarizeMonthlyAbsences(absences, { closedAt, policy: 'LOCK_AT_CLOSE' })

    expect(summary.map((month) => month.pendingRecovery)).toEqual([3, 1, 4])
    expect(summary.reduce((sum, month) => sum + month.pendingRecovery, 0)).toBe(8)
  })

  it('8 reposiciones a tiempo dejan 0 pendientes', () => {
    const [september, october, november] = [absences.slice(0, 5), absences.slice(5, 8), absences.slice(8)]
    const summary = summarizeMonthlyAbsences(
      [...recover(september, 3), ...recover(october, 1), ...recover(november, 4)],
      { closedAt, policy: 'LOCK_AT_CLOSE' },
    )

    expect(summary.reduce((sum, month) => sum + month.pendingRecovery, 0)).toBe(0)
  })

  it('7 reposiciones a tiempo dejan 1 pendiente', () => {
    const [september, october, november] = [absences.slice(0, 5), absences.slice(5, 8), absences.slice(8)]
    const summary = summarizeMonthlyAbsences(
      [...recover(september, 3), ...recover(october, 1), ...recover(november, 3)],
      { closedAt, policy: 'LOCK_AT_CLOSE' },
    )

    expect(summary.reduce((sum, month) => sum + month.pendingRecovery, 0)).toBe(1)
  })
})
