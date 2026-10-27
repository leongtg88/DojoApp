import { describe, expect, it } from 'vitest'
import { getPrimaryAction } from '@/lib/dashboard/primary-action'
import type { ClassSchedule } from '@/types/dashboard'

/** 2026-10-26 es lunes. 20:00 UTC = 16:00 en Santo Domingo (UTC-4). */
const MONDAY_16_RD = new Date('2026-10-26T20:00:00.000Z')

function classOn(dayOfWeek: number, startTime: string, endTime: string, name = 'Karate Niños'): ClassSchedule {
    return {
        id: `${dayOfWeek}-${startTime}`,
        name,
        description: null,
        dayOfWeek,
        startTime,
        endTime,
        instructorName: 'Sensei',
    }
}

describe('UX-A5a · getPrimaryAction', () => {
    it('prioriza la clase de hoy que todavía no ha terminado', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(1, '18:00', '19:00')],
            pendingRecoveries: 0,
        })

        expect(action).toEqual({
            kind: 'class_today',
            className: 'Karate Niños',
            startTime: '18:00',
            endTime: '19:00',
        })
    })

    it('también cuenta la clase que está en curso', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(1, '15:30', '17:00')],
            pendingRecoveries: 0,
        })

        expect(action.kind).toBe('class_today')
    })

    it('gana la clase de hoy aunque haya faltas por reponer', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(1, '18:00', '19:00')],
            pendingRecoveries: 2,
        })

        expect(action.kind).toBe('class_today')
    })

    it('si la clase de hoy ya terminó, prioriza la reposición', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(1, '08:00', '09:00')],
            pendingRecoveries: 2,
        })

        expect(action).toEqual({ kind: 'recovery', pendingRecoveries: 2 })
    })

    it('elige la clase más próxima cuando hay varias hoy', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(1, '18:00', '19:00', 'Adultos'), classOn(1, '16:30', '17:30', 'Niños')],
            pendingRecoveries: 0,
        })

        expect(action).toMatchObject({ kind: 'class_today', className: 'Niños', startTime: '16:30' })
    })

    it('sin clase ni reposiciones, propone practicar la técnica en foco', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(3, '18:00', '19:00')],
            pendingRecoveries: 0,
            focusTechniqueName: 'Kihon Kata Ichi',
        })

        expect(action).toEqual({ kind: 'practice', techniqueName: 'Kihon Kata Ichi' })
    })

    it('sin datos suficientes devuelve bienvenida', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [],
            pendingRecoveries: 0,
            focusTechniqueName: '   ',
        })

        expect(action).toEqual({ kind: 'welcome' })
    })

    it('no cuenta como hoy una clase de otro día', () => {
        const action = getPrimaryAction({
            now: MONDAY_16_RD,
            classes: [classOn(0, '18:00', '19:00'), classOn(2, '18:00', '19:00')],
            pendingRecoveries: 0,
        })

        expect(action).toEqual({ kind: 'welcome' })
    })

    it('usa el día de Santo Domingo, no el día UTC del servidor', () => {
        // 2026-10-27 01:00 UTC = lunes 26 a las 21:00 en Santo Domingo.
        const mondayNinePmRd = new Date('2026-10-27T01:00:00.000Z')
        const action = getPrimaryAction({
            now: mondayNinePmRd,
            classes: [classOn(1, '21:30', '22:30')],
            pendingRecoveries: 0,
        })

        expect(action.kind).toBe('class_today')
        expect(action).toMatchObject({ startTime: '21:30' })
    })

    it('ignora reposiciones negativas o no numéricas', () => {
        const negative = getPrimaryAction({ now: MONDAY_16_RD, classes: [], pendingRecoveries: -1 })
        expect(negative).toEqual({ kind: 'welcome' })
    })
})
