import { describe, expect, it } from 'vitest'
import { getRoleNavigation } from '@/components/dashboard/shell/RoleNavigation'
import { COPY } from '@/lib/ui/copy'
import { ADMIN_SECTIONS, NAV_LABELS, STUDENT_DESTINATIONS } from '@/lib/ui/nav-labels'
import {
    RECOVERY_UI_STATUSES,
    RECOVERY_UI_STATUS_LABELS,
    getRecoveryStatusLabel,
    isRecoveryUiStatus,
} from '@/lib/ui/recovery-status'

describe('UX-01 · navegación', () => {
    it('define los 5 destinos del alumno en el orden acordado', () => {
        expect(STUDENT_DESTINATIONS).toHaveLength(5)
        expect(STUDENT_DESTINATIONS.map((destination) => destination.label)).toEqual([
            'Inicio',
            'Entrenar',
            'Clases',
            'Progreso',
            'Perfil',
        ])
    })

    it('define las 5 secciones del admin y deja Finanzas reservada', () => {
        const visibleSections = ADMIN_SECTIONS.filter((section) => !('reserved' in section))

        expect(visibleSections.map((section) => section.label)).toEqual([
            'Hoy',
            'Alumnos',
            'Operación',
            'Configuración',
            'Comunicación',
        ])
        expect(ADMIN_SECTIONS[ADMIN_SECTIONS.length - 1]).toMatchObject({ id: 'finanzas', reserved: true })
    })

    it('RoleNavigation toma las etiquetas de NAV_LABELS', () => {
        expect(getRoleNavigation('STUDENT').map((item) => item.label)).toEqual([
            NAV_LABELS.resumen,
            NAV_LABELS.miPerfil,
            NAV_LABELS.miProgreso,
            NAV_LABELS.horario,
            NAV_LABELS.asistencia,
            NAV_LABELS.seguridad,
        ])
        expect(getRoleNavigation('SCHOOL_ADMIN').map((item) => item.label)).toContain(NAV_LABELS.alumnos)
    })
})

describe('UX-01 · estados visibles de reposición', () => {
    it('usa exactamente las etiquetas de la sección 5 de la guía', () => {
        expect(RECOVERY_UI_STATUSES.map((status) => getRecoveryStatusLabel(status))).toEqual([
            'Por reponer',
            'En revisión',
            'Programada',
            'Repuesta',
            'Repuesta por otra vía',
            'Cancelada',
            'No asististe',
        ])
    })

    it('reconoce solo los estados declarados', () => {
        expect(isRecoveryUiStatus('por_reponer')).toBe(true)
        expect(isRecoveryUiStatus('POR_REPONER')).toBe(false)
        expect(isRecoveryUiStatus(null)).toBe(false)
        expect(isRecoveryUiStatus(undefined)).toBe(false)
    })

    it('no deja ningún estado sin etiqueta', () => {
        for (const status of RECOVERY_UI_STATUSES) {
            expect(RECOVERY_UI_STATUS_LABELS[status].trim()).not.toBe('')
        }
    })
})

describe('UX-01 · copy', () => {
    it('no usa vocabulario descartado y no deja textos vacíos', () => {
        const texts = [
            ...Object.values(NAV_LABELS),
            ...STUDENT_DESTINATIONS.flatMap(({ label, description }) => [label, description]),
            ...ADMIN_SECTIONS.flatMap(({ label, description }) => [label, description]),
            ...Object.values(RECOVERY_UI_STATUS_LABELS),
            ...Object.values(COPY.actions),
            ...Object.values(COPY.confirm),
            ...Object.values(COPY.errors),
            ...Object.values(COPY.empty).flatMap(({ title, description, action }) => [title, description, action]),
        ]

        for (const text of texts) {
            expect(text.trim()).not.toBe('')
            expect(text.toLowerCase()).not.toMatch(/recuperaci|recuperar/)
        }
    })

    it('cada estado vacío ofrece una acción', () => {
        for (const empty of Object.values(COPY.empty)) {
            expect(empty.action.trim()).not.toBe('')
        }
    })
})
