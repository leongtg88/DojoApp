'use client'

import Link from 'next/link'
import { CalendarDays, Repeat, RotateCcw, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ClassSchedule } from '@/types/dashboard'
import { getPrimaryAction, type PrimaryAction } from '@/lib/dashboard/primary-action'
import { studentHref } from '@/lib/dashboard/student-links'
import { useNow } from '@/lib/ui/use-now'

interface PrimaryActionCardProps {
    classes: ClassSchedule[]
    pendingRecoveries: number
    focusTechniqueName: string | null
    studentId?: string
}

interface ActionContent {
    eyebrow: string
    title: string
    description: string
    primary: { label: string; href: string }
    secondary?: { label: string; href: string }
    icon: LucideIcon
}

function describeAction(action: PrimaryAction, studentId?: string): ActionContent {
    switch (action.kind) {
        case 'class_today':
            return {
                eyebrow: 'Tu clase de hoy',
                title: action.className,
                description: `Hoy de ${action.startTime} a ${action.endTime}.`,
                primary: { label: 'Ver mi clase', href: studentHref('/dashboard/estudiante/clases', studentId) },
                secondary: { label: 'No podré ir', href: studentHref('/dashboard/estudiante/clases', studentId) },
                icon: CalendarDays,
            }
        case 'recovery':
            return {
                eyebrow: 'Reposición pendiente',
                title: action.pendingRecoveries === 1 ? 'Te queda 1 reposición' : `Te quedan ${action.pendingRecoveries} reposiciones`,
                description: 'Puedes reponer la falta en otra clase. Coordina los detalles con administración.',
                primary: { label: 'Resolver', href: studentHref('/dashboard/estudiante/clases', studentId) },
                icon: RotateCcw,
            }
        case 'practice':
            return {
                eyebrow: 'Práctica de hoy',
                title: `Practica ${action.techniqueName}`,
                description: 'Registra tus repeticiones para avanzar hacia tu próximo grado.',
                primary: { label: 'Registrar repeticiones', href: studentHref('/dashboard/estudiante/entrenar', studentId) },
                icon: Repeat,
            }
        case 'welcome':
            return {
                eyebrow: 'Bienvenido',
                title: 'Aún no tenemos datos de tu próxima clase',
                description: 'Consulta tu horario o contacta con la administración del dojo.',
                primary: { label: 'Ver mis clases', href: studentHref('/dashboard/estudiante/clases', studentId) },
                icon: Sparkles,
            }
    }
}

/**
 * UX-A5b · Tarjeta de acción principal del Inicio.
 *
 * La decisión vive en `getPrimaryAction` (función pura, UX-A5a). Esta capa solo
 * espera la hora del cliente y convierte la decisión en una tarjeta.
 */
export function PrimaryActionCard({ classes, pendingRecoveries, focusTechniqueName, studentId }: PrimaryActionCardProps) {
    const now = useNow()

    if (!now) {
        return (
            <section className="mt-5 rounded-xl border border-cyan-900/50 bg-surface-2 p-5 shadow-sm sm:p-6" data-testid="primary-action-card">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-3" />
                <div className="mt-3 h-6 w-56 animate-pulse rounded bg-surface-3" />
                <div className="mt-3 h-4 w-72 animate-pulse rounded bg-surface-3" />
                <div className="mt-5 h-11 w-44 animate-pulse rounded-md bg-surface-3" />
            </section>
        )
    }

    const action = getPrimaryAction({ now, classes, pendingRecoveries, focusTechniqueName })

    return <PrimaryActionView action={action} pendingRecoveries={pendingRecoveries} studentId={studentId} />
}

interface PrimaryActionViewProps {
    action: PrimaryAction
    pendingRecoveries: number
    studentId?: string
}

/** Presentación pura de la tarjeta. Exportada para pruebas deterministas. */
export function PrimaryActionView({ action, pendingRecoveries, studentId }: PrimaryActionViewProps) {
    const content = describeAction(action, studentId)
    const Icon = content.icon

    return (
        <section className="mt-5 rounded-xl border border-cyan-900/50 bg-surface-2 p-5 shadow-sm sm:p-6" data-testid="primary-action-card">
            <div className="flex items-start gap-4">
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-accent">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{content.eyebrow}</p>
                    <h2 className="mt-1 font-display text-xl font-extrabold text-ink sm:text-2xl">{content.title}</h2>
                    <p className="mt-1 text-sm text-ink-2">{content.description}</p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
                    href={content.primary.href}
                >
                    {content.primary.label}
                </Link>
                {content.secondary && (
                    <Link
                        className="inline-flex min-h-11 items-center justify-center rounded-md border border-edge-strong bg-surface-1 px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
                        href={content.secondary.href}
                    >
                        {content.secondary.label}
                    </Link>
                )}
            </div>

            {pendingRecoveries > 0 && action.kind !== 'recovery' && (
                <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-warn-text">
                    {pendingRecoveries === 1 ? 'Tienes 1 falta por reponer.' : `Tienes ${pendingRecoveries} faltas por reponer.`}{' '}
                    <Link className="font-bold underline underline-offset-4" href={studentHref('/dashboard/estudiante/clases', studentId)}>
                        Resolver
                    </Link>
                </p>
            )}
        </section>
    )
}
