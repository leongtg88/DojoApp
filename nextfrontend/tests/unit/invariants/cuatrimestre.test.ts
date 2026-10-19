import { describe, expect, it } from 'vitest'
import {
  EXAM_DAY_WEEKDAY,
  cuatrimestreForDate,
  cuatrimestresInRange,
  lastDayOf,
  makeCuatrimestre,
  nextCuatrimestre,
  previousCuatrimestre,
  tentativeExamDate,
} from '@/lib/dashboard/cuatrimestre'

// Fase 1 · F1-06 — Bloques de cuatrimestre y fecha tentativa de examen.
const MS_PER_DAY = 24 * 60 * 60 * 1000

describe('cuatrimestreForDate', () => {
  it('mapea los meses a Ene–Abr / May–Ago / Sep–Dic', () => {
    expect(cuatrimestreForDate(new Date(2026, 0, 15)).index).toBe(0) // Ene
    expect(cuatrimestreForDate(new Date(2026, 3, 30)).index).toBe(0) // Abr
    expect(cuatrimestreForDate(new Date(2026, 4, 1)).index).toBe(1) // May
    expect(cuatrimestreForDate(new Date(2026, 7, 31)).index).toBe(1) // Ago
    expect(cuatrimestreForDate(new Date(2026, 8, 1)).index).toBe(2) // Sep
    expect(cuatrimestreForDate(new Date(2026, 11, 31)).index).toBe(2) // Dic
  })
})

describe('makeCuatrimestre', () => {
  it('arranca el día 1 y cierra el día 1 del siguiente bloque (exclusivo)', () => {
    const q = makeCuatrimestre(2026, 1) // May–Ago
    expect(q.start.getFullYear()).toBe(2026)
    expect(q.start.getMonth()).toBe(4)
    expect(q.start.getDate()).toBe(1)
    expect(q.end.getMonth()).toBe(8) // Sep 1, exclusivo
    expect(q.label).toBe('May–Ago 2026')
  })

  it('el último bloque cierra el 1 de enero del año siguiente', () => {
    const q = makeCuatrimestre(2026, 2) // Sep–Dic
    expect(q.end.getFullYear()).toBe(2027)
    expect(q.end.getMonth()).toBe(0)
    expect(q.label).toBe('Sep–Dic 2026')
  })
})

describe('nextCuatrimestre / previousCuatrimestre', () => {
  it('Sep–Dic salta a Ene–Abr del año siguiente', () => {
    const next = nextCuatrimestre(makeCuatrimestre(2026, 2))
    expect(next.year).toBe(2027)
    expect(next.index).toBe(0)
  })

  it('Ene–Abr retrocede a Sep–Dic del año anterior', () => {
    const prev = previousCuatrimestre(makeCuatrimestre(2026, 0))
    expect(prev.year).toBe(2025)
    expect(prev.index).toBe(2)
  })
})

describe('cuatrimestresInRange', () => {
  it('lista los bloques que solapan el rango', () => {
    const result = cuatrimestresInRange(new Date(2026, 2, 1), new Date(2026, 5, 1)) // Mar → Jun
    expect(result.map((q) => `${q.year}-${q.index}`)).toEqual(['2026-0', '2026-1'])
  })
})

describe('tentativeExamDate', () => {
  it('en Sep–Dic cae en la primera semana de diciembre, en el día de examen', () => {
    const date = tentativeExamDate(makeCuatrimestre(2026, 2), 'SATURDAY')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(11) // diciembre
    expect(date.getDate()).toBeLessThanOrEqual(7)
    expect(date.getDay()).toBe(EXAM_DAY_WEEKDAY.SATURDAY)
  })

  it('en el resto de bloques cae en el último día de examen del cuatrimestre', () => {
    const q = makeCuatrimestre(2026, 0)
    const date = tentativeExamDate(q, 'SUNDAY')
    expect(date.getDay()).toBe(EXAM_DAY_WEEKDAY.SUNDAY)
    expect(date.getTime()).toBeGreaterThanOrEqual(q.start.getTime())
    expect(date.getTime()).toBeLessThan(q.end.getTime())
    // dentro de los últimos 7 días del bloque
    expect(lastDayOf(q).getTime() - date.getTime()).toBeLessThan(7 * MS_PER_DAY)
  })

  it('el día de examen cambia el resultado (Sábado vs Domingo)', () => {
    const q = makeCuatrimestre(2026, 1)
    const saturday = tentativeExamDate(q, 'SATURDAY')
    const sunday = tentativeExamDate(q, 'SUNDAY')
    expect(saturday.getDay()).toBe(6)
    expect(sunday.getDay()).toBe(0)
    expect(saturday.getTime()).not.toBe(sunday.getTime())
  })
})
