import Link from 'next/link'
import { CalendarDays, ClipboardCheck, GraduationCap, TriangleAlert, Users } from 'lucide-react'
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

export function AdminDashboardOverview({ summary, birthdays, instructorCandidates, pendingEnrollmentCount, pendingDocumentCount }: AdminDashboardOverviewProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Resumen del dojo</h1>

            <section className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link className={`group rounded-lg border bg-surface-2 p-5 transition-colors hover:bg-surface-3 ${pendingEnrollmentCount > 0 ? 'border-amber-500/40' : 'border-edge'}`} href="/dashboard/admin/inscripciones">
                    <div className="flex items-center justify-between">
                        <ClipboardCheck aria-hidden="true" className={`size-5 ${pendingEnrollmentCount > 0 ? 'text-warn-text' : 'text-ink-3'}`} />
                        {pendingEnrollmentCount > 0 && <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-extrabold text-warn-text">{pendingEnrollmentCount}</span>}
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Inscripciones pendientes</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                        {pendingEnrollmentCount > 0 ? `${pendingEnrollmentCount} solicitud${pendingEnrollmentCount === 1 ? '' : 'es'} por revisar` : 'Sin solicitudes pendientes'}
                    </p>
                </Link>
                <Link className={`group rounded-lg border bg-surface-2 p-5 transition-colors hover:bg-surface-3 ${pendingDocumentCount > 0 ? 'border-amber-500/40' : 'border-edge'}`} href="/dashboard/admin/alumnos">
                    <div className="flex items-center justify-between">
                        <Users aria-hidden="true" className={`size-5 ${pendingDocumentCount > 0 ? 'text-warn-text' : 'text-ink-3'}`} />
                        {pendingDocumentCount > 0 && <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-extrabold text-warn-text">{pendingDocumentCount}</span>}
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Documentos por revisar</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                        {pendingDocumentCount > 0 ? `${pendingDocumentCount} documento${pendingDocumentCount === 1 ? '' : 's'} en espera` : 'Sin documentos pendientes'}
                    </p>
                </Link>
            </section>

            <section className="mt-7 grid gap-3 sm:grid-cols-3">
                <Link className="rounded-lg border border-edge bg-surface-2 p-5 transition-colors hover:border-cyan-500/40 hover:bg-surface-3" href="/dashboard/admin/alumnos">
                    <Users aria-hidden="true" className="size-5 text-accent" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Alumnos</p>
                    <p className="mt-1 text-3xl font-bold text-ink">{summary.studentCount}</p>
                </Link>
                <article className="rounded-lg border border-edge bg-surface-2 p-5">
                    <CalendarDays aria-hidden="true" className="size-5 text-ok-text" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Clases</p>
                    <p className="mt-1 text-3xl font-bold text-ink">{summary.classCount}</p>
                </article>
                <article className="rounded-lg border border-edge bg-surface-2 p-5">
                    <GraduationCap aria-hidden="true" className="size-5 text-warn-text" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Inscripciones activas</p>
                    <p className="mt-1 text-3xl font-bold text-ink">{summary.activeEnrollmentCount}</p>
                </article>
            </section>
            <section className="mt-3 rounded-lg border border-amber-500/20 bg-surface-2 p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warn-text">
                    <TriangleAlert aria-hidden="true" className="size-4" />Casos por atender
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Link className="rounded-md border border-edge bg-surface-1 px-4 py-3 transition-colors hover:border-amber-500/40" href="/dashboard/admin/alumnos">
                        <p className="text-sm font-semibold text-ink">{summary.pendingCases.noPlan} alumnos</p>
                        <p className="text-xs text-ink-3">Sin plan de mensualidad asignado</p>
                    </Link>
                    <Link className="rounded-md border border-edge bg-surface-1 px-4 py-3 transition-colors hover:border-amber-500/40" href="/dashboard/admin/horarios">
                        <p className="text-sm font-semibold text-ink">{summary.pendingCases.noSchedule} alumnos</p>
                        <p className="text-xs text-ink-3">Sin horario de referencia asignado</p>
                    </Link>
                </div>
            </section>
            <AdminInstructorRoles candidates={instructorCandidates} />
            <BirthdayWidget birthdays={birthdays} roleFilter="student" />
        </main>
    )
}