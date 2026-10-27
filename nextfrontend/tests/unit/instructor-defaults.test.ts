import { describe, expect, it } from 'vitest'
import { pickDefaultEvaluationStudentId } from '@/lib/dashboard/instructor-defaults'

describe('UX-B4 · alumno por defecto en Evaluaciones', () => {
    it('prefiere al primero de la clase en curso', () => {
        expect(pickDefaultEvaluationStudentId(['roster-1', 'roster-2'], ['fallback-1'])).toBe('roster-1')
    })

    it('si la clase no tiene alumnos, usa el primero de la lista', () => {
        expect(pickDefaultEvaluationStudentId([], ['fallback-1', 'fallback-2'])).toBe('fallback-1')
    })

    it('sin alumnos devuelve null', () => {
        expect(pickDefaultEvaluationStudentId([], [])).toBeNull()
    })
})
