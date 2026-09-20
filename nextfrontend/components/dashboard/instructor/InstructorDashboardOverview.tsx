'use client'

import Link from 'next/link'
import { CalendarDays, CalendarClock, ChevronRight, Hourglass, Users } from 'lucide-react'
import { BirthdayWidget } from '@/components/dashboard/shared/BirthdayWidget'
import type { DashboardBirthday, InstructorClassSummary, InstructorStudentSummary } from '@/types/dashboard'
import { formatNextClass, nextClassFrom } from '@/lib/dashboard/schedule-utils'

interface InstructorDashboardOverviewProps {
    birthdays: DashboardBirthday[]
    classes: InstructorClassSummary[]
    pendingCount: number
    students: InstructorStudentSummary[]
}

export function InstructorDashboardOverview({ birthdays, classes, pendingCount, students }: InstructorDashboardOverviewProps) {
    const nextClass = nextClassFrom(classes)

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Resumen de tatami</h1>
            <p className="mt-2 text-sm text-ink-3">Consulta tus grupos asignados y los alumnos bajo tu seguimiento.</p>

            <section className="mt-7 rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-accent">
                            <CalendarClock aria-hidden="true" className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Próxima clase</p>
                            {nextClass ? (
                                <>
                                    <p className="mt-1 font-display text-lg font-extrabold text-ink">{nextClass.name}</p>
                                    <p className="mt-1 text-sm text-ink-3">
                                        {formatNextClass(nextClass)} · {nextClass.startTime} - {nextClass.endTime} · {nextClass.branchName}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="mt-1 font-display text-lg font-extrabold text-ink">No tienes clases asignadas</p>
                                    <p className="mt-1 text-sm text-ink-3">Contacta a la administración para asignarte un grupo.</p>
                                </>
                            )}
                        </div>
                    </div>
                    <Link
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
                        href="/dashboard/instructor/asistencia"
                    >
                        Validar asistencia
                        <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>
            </section>

            <section className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-5 py-4 ${pendingCount > 0 ? 'border-amber-500/40 bg-amber-500/10' : 'border-edge bg-surface-2'}`}>
                <p className={`flex items-center gap-2 text-sm font-bold ${pendingCount > 0 ? 'text-warn-text' : 'text-ink-2'}`}>
                    <Hourglass aria-hidden="true" className="size-4" />
                    {pendingCount > 0 ? `${pendingCount} punch${pendingCount === 1 ? '' : 'es'} por validar` : 'Sin marcaciones pendientes'}
                </p>
                <Link className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline" href="/dashboard/instructor/asistencia">
                    Revisar marcaciones
                    <ChevronRight aria-hidden="true" className="size-3.5" />
                </Link>
            </section>

            <section className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link className="rounded-lg border border-edge bg-surface-2 p-5 transition-colors hover:border-cyan-500/40 hover:bg-surface-3" href="/dashboard/instructor/clases">
                    <CalendarDays aria-hidden="true" className="size-5 text-accent" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Clases asignadas</p>
                    <p className="mt-1 text-3xl font-bold text-ink">{classes.length}</p>
                    <p className="mt-2 text-sm text-ink-3">Ver horario y composición de grupos.</p>
                </Link>
                <Link className="rounded-lg border border-edge bg-surface-2 p-5 transition-colors hover:border-emerald-500/40 hover:bg-surface-3" href="/dashboard/instructor/estudiantes">
                    <Users aria-hidden="true" className="size-5 text-ok-text" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Estudiantes activos</p>
                    <p className="mt-1 text-3xl font-bold text-ink">{students.length}</p>
                    <p className="mt-2 text-sm text-ink-3">Ver alumnos activos de tu escuela.</p>
                </Link>
            </section>
            <BirthdayWidget birthdays={birthdays} />
        </main>
    )
}