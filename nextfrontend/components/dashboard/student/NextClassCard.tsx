'use client'

import Link from 'next/link'
import { CalendarDays, ChevronRight, Flame, GraduationCap, UserRound } from 'lucide-react'
import type { ClassSchedule } from '@/types/dashboard'
import { formatNextClass, nextClassFrom, WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'
import { studentHref } from '@/lib/dashboard/student-links'
import { useNow } from '@/lib/ui/use-now'

interface NextClassCardProps {
    classes: ClassSchedule[]
    studentId?: string
}

function isToday(scheduledClass: ClassSchedule, now = new Date()): boolean {
    return scheduledClass.dayOfWeek === now.getDay()
}

export function NextClassCard({ classes, studentId }: NextClassCardProps) {
    const now = useNow()
    const next = now ? nextClassFrom(classes, now) : null
    const hasClassToday = now ? classes.some((scheduledClass) => isToday(scheduledClass, now)) : false

    if (!now) {
        return (
            <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-accent">
                        <CalendarDays aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Próxima clase</p>
                        <div className="mt-2 h-5 w-40 animate-pulse rounded bg-surface-3" />
                        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-surface-3" />
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-accent">
                        <CalendarDays aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Próxima clase</p>
                        {next ? (
                            <>
                                <p className="mt-1 font-display text-lg font-extrabold text-ink">{next.name}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                                    <span className="font-semibold text-accent-text">{formatNextClass(next, now)}</span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <UserRound aria-hidden="true" className="size-3.5 text-ink-4" />
                                        {next.instructorName ?? 'Instructor por asignar'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Flame aria-hidden="true" className="size-3.5 text-ink-4" />
                                        {WEEKDAY_LONG[next.dayOfWeek]} · {next.startTime} - {next.endTime}
                                    </span>
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="mt-1 font-display text-lg font-extrabold text-ink">No tienes clases activas</p>
                                <p className="mt-1 text-xs text-ink-3">Contacta a la administración para completar tu inscripción.</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {hasClassToday && (
                        <Link
                            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
                            href={studentHref('/dashboard/estudiante/asistencia', studentId)}
                        >
                            <Flame aria-hidden="true" className="size-4" />
                            Marcar mi práctica
                        </Link>
                    )}
                    <Link
                        className="inline-flex items-center gap-1 rounded-md border border-edge-strong bg-surface-1 px-3.5 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
                        href={studentHref('/dashboard/estudiante/progreso', studentId)}
                    >
                        <GraduationCap aria-hidden="true" className="size-4 text-accent" />
                        Ver técnicas
                        <ChevronRight aria-hidden="true" className="size-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    )
}