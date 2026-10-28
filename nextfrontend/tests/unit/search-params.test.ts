import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_TABS,
  parseAttendanceTab,
  parseIsoDate,
  parseStudentPendingFilter,
} from '@/lib/ui/search-params'

describe('UX-B5.1 · parámetros de URL', () => {
  it('solo "none" activa los filtros de plan/horario', () => {
    expect(parseStudentPendingFilter('none')).toBe(true)
    expect(parseStudentPendingFilter('todos')).toBe(false)
    expect(parseStudentPendingFilter('NONE')).toBe(false)
    expect(parseStudentPendingFilter('')).toBe(false)
    expect(parseStudentPendingFilter(undefined)).toBe(false)
  })

  it('solo acepta las pestañas conocidas de Asistencia', () => {
    for (const tab of ATTENDANCE_TABS) {
      expect(parseAttendanceTab(tab)).toBe(tab)
    }
    expect(parseAttendanceTab('otra')).toBeUndefined()
    expect(parseAttendanceTab('PASE')).toBeUndefined()
    expect(parseAttendanceTab('')).toBeUndefined()
    expect(parseAttendanceTab(undefined)).toBeUndefined()
  })

  it('solo acepta fechas YYYY-MM-DD reales', () => {
    expect(parseIsoDate('2026-10-19')).toBe('2026-10-19')
    expect(parseIsoDate('2024-02-29')).toBe('2024-02-29')
    expect(parseIsoDate('2026-99-99')).toBeUndefined()
    expect(parseIsoDate('2026-02-30')).toBeUndefined()
    expect(parseIsoDate('2026-13-01')).toBeUndefined()
    expect(parseIsoDate('2025-02-29')).toBeUndefined()
    expect(parseIsoDate('19-10-2026')).toBeUndefined()
    expect(parseIsoDate('2026-10-19T00:00:00Z')).toBeUndefined()
    expect(parseIsoDate(undefined)).toBeUndefined()
  })
})
