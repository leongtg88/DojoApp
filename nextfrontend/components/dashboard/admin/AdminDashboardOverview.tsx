import Link from 'next/link'
import { CalendarDays, ChevronRight, ClipboardCheck, FileText, GraduationCap, ListChecks, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BirthdayWidget } from '@/components/dashboard/shared/BirthdayWidget'
import { AdminInstructorRoles } from './AdminInstructorRoles'
import type { AdminDashboardSummary, AdminInstructorCandidate, DashboardBirthday } from '@/types/dashboard'

interface AdminDashboardOverviewProps {
    summary: AdminDashboardSummary
    birthdays: DashboardBirthday[]
    instructorCandidates: AdminInstructorCandidate[]
    pendingEnrollmentCount: number
    pendingDocumentCount: number
}

interface InboxRow {
    href: string
    icon: LucideIcon
    title: string
    count: number
    detail: string
}

/**
 * UX-B5 · Sección "Hoy": una bandeja única con los pendientes del día.
 * Cada fila lleva a la pantalla donde se resuelve. Las métricas del dojo quedan
 * como información secundaria.
 */
export function AdminDashboardOverview({ summary, birthdays, instructorCandidates, pendingEnrollmentCount, pendingDocumentCount }: AdminDashboardOverviewProps) {
    const inbox: InboxRow[] = [
        {
            href: '/dashboard/admin/inscripciones',
            icon: ClipboardCheck,
            title: 'Inscripciones pendientes',
            count: pendingEnrollmentCount,
            detail: pendingEnrollmentCount === 0 ? 'Sin solicitudes por revisar' : `${pendingEnrollmentCount} solicitud${pendingEnrollmentCount === 1 ? '' : 'es'} por revisar`,
        },
        {
            href: '/dashboard/admin/alumnos?docs=pending',
            icon: FileText,
            title: 'Documentos por revisar',
            count: pendingDocumentCount,
            detail: pendingDocumentCount === 0 ? 'Todo al día' : `${pendingDocumentCount} documento${pendingDocumentCount === 1 ? '' : 's'} en espera`,
        },
        {
            href: '/dashboard/admin/alumnos',
            icon: ListChecks,
            title: 'Alumnos sin plan',
            count: summary.pendingCases.noPlan,
            detail: summary.pendingCases.noPlan === 0 ? 'Todos tienen plan asignado' : `${summary.pendingCases.noPlan} alumno${summary.pendingCases.noPlan === 1 ? '' : 's'} sin mensualidad`,
        },
        {
            href: '/dashboard/admin/horarios',
            icon: CalendarDays,
            title: 'Alumnos sin horario',
            count: summary.pendingCases.noSchedule,
            detail: summary.pendingCases.noSchedule === 0 ? 'Todos tienen horario de referencia' : `${summary.pendingCases.noSchedule} alumno${summary.pendingCases.noSchedule === 1 ? '' : 's'} sin horario`,
        },
    ]

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Hoy</h1>
            <p className="mt-2 text-xs text-ink-3">Lo que necesita tu atención, en un solo lugar.</p>

            <section aria-label="Pendientes de hoy" className="mt-7 overflow-hidden rounded-lg border border-edge bg-surface-2">
                <ul className="divide-y divide-edge">
                    {inbox.map(({ href, icon: Icon, title, count, detail }) => (
                        <li key={href}>
                            <Link className="group flex min-h-16 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-3 sm:px-5" href={href}>
                                <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${count > 0 ? 'bg-amber-500/15 text-warn-text' : 'bg-surface-3 text-ink-3'}`}>
                                    <Icon aria-hidden="true" className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-ink">{title}</span>
                                    <span className="mt-0.5 block text-xs text-ink-3">{detail}</span>
                                </span>
                                {count > 0 && (
                                    <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-extrabold text-warn-text">{count}</span>
                                )}
                                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-label="El dojo en números" className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">El dojo en números</p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                    <Link className="rounded-lg border border-edge bg-surface-2 p-3 transition-colors hover:border-cyan-500/40 hover:bg-surface-3 sm:p-5" href="/dashboard/admin/alumnos">
                        <Users aria-hidden="true" className="size-5 text-accent" />
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-3 sm:mt-4 sm:text-xs">Alumnos</p>
                        <p className="mt-1 text-xl font-bold text-ink sm:text-3xl">{summary.studentCount}</p>
                    </Link>
                    <article className="rounded-lg border border-edge bg-surface-2 p-3 sm:p-5">
                        <CalendarDays aria-hidden="true" className="size-5 text-ok-text" />
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-3 sm:mt-4 sm:text-xs">Clases</p>
                        <p className="mt-1 text-xl font-bold text-ink sm:text-3xl">{summary.classCount}</p>
                    </article>
                    <article className="rounded-lg border border-edge bg-surface-2 p-3 sm:p-5">
                        <GraduationCap aria-hidden="true" className="size-5 text-warn-text" />
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-3 sm:mt-4 sm:text-xs">Inscripciones activas</p>
                        <p className="mt-1 text-xl font-bold text-ink sm:text-3xl">{summary.activeEnrollmentCount}</p>
                    </article>
                </div>
            </section>

            <AdminInstructorRoles candidates={instructorCandidates} />
            <BirthdayWidget birthdays={birthdays} roleFilter="student" />
        </main>
    )
}
