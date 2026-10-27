import type { ClassSchedule } from '@/types/dashboard'
import { santoDomingoWeekdayAndMinutes, timeToMinutes } from './schedule-utils'

/**
 * UX-A5a · Decide la acción principal del Inicio del alumno.
 *
 * Función pura: no toca React, Prisma ni la red. Recibe la hora del cliente y
 * los datos que ya existen en el resumen, y devuelve una decisión que el
 * componente convierte en tarjeta.
 *
 * Prioridad (guía, UX-A5a):
 * 1. Clase hoy que todavía no ha terminado.
 * 2. Falta por reponer.
 * 3. Técnica pendiente de práctica.
 * 4. Sin datos suficientes.
 *
 * "Hoy" se resuelve en la zona horaria del dojo (INV-01): el servidor de Vercel
 * corre en UTC y no debe decidir el día con su hora local.
 */

export type PrimaryAction =
    | { kind: 'class_today'; className: string; startTime: string; endTime: string }
    | { kind: 'recovery'; pendingRecoveries: number }
    | { kind: 'practice'; techniqueName: string }
    | { kind: 'welcome' }

export interface PrimaryActionInput {
    now: Date
    classes: ClassSchedule[]
    pendingRecoveries: number
    focusTechniqueName?: string | null
}

export function getPrimaryAction({
    now,
    classes,
    pendingRecoveries,
    focusTechniqueName,
}: PrimaryActionInput): PrimaryAction {
    const { weekday, minutes } = santoDomingoWeekdayAndMinutes(now)

    // Una clase que aún no ha terminado sigue siendo "la clase de hoy".
    const todaysClasses = classes
        .filter((scheduledClass) => scheduledClass.dayOfWeek === weekday && timeToMinutes(scheduledClass.endTime) > minutes)
        .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime))

    if (todaysClasses.length > 0) {
        const next = todaysClasses[0]
        return {
            kind: 'class_today',
            className: next.name,
            startTime: next.startTime,
            endTime: next.endTime,
        }
    }

    if (pendingRecoveries > 0) {
        return { kind: 'recovery', pendingRecoveries: Math.trunc(pendingRecoveries) }
    }

    const techniqueName = focusTechniqueName?.trim()
    if (techniqueName) {
        return { kind: 'practice', techniqueName }
    }

    return { kind: 'welcome' }
}
