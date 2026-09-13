import Link from 'next/link'
import { CalendarDays, GraduationCap, TriangleAlert, Users } from 'lucide-react'
import { BirthdayWidget } from '@/components/dashboard/shared/BirthdayWidget'
import type { AdminDashboardSummary, DashboardBirthday } from '@/types/dashboard'

interface AdminDashboardOverviewProps {
    summary: AdminDashboardSummary
    birthdays: DashboardBirthday[]
}

export function AdminDashboardOverview({ summary, birthdays }: AdminDashboardOverviewProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Resumen del dojo</h1>
            <section className="mt-7 grid gap-3 sm:grid-cols-3">
                <Link className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 transition-colors hover:border-cyan-500/40 hover:bg-neutral-800" href="/dashboard/admin/alumnos">
                    <Users aria-hidden="true" className="size-5 text-cyan-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Alumnos</p>
                    <p className="mt-1 text-3xl font-bold text-white">{summary.studentCount}</p>
                </Link>
                <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5">
                    <CalendarDays aria-hidden="true" className="size-5 text-emerald-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Clases</p>
                    <p className="mt-1 text-3xl font-bold text-white">{summary.classCount}</p>
                </article>
                <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5">
                    <GraduationCap aria-hidden="true" className="size-5 text-amber-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Inscripciones activas</p>
                    <p className="mt-1 text-3xl font-bold text-white">{summary.activeEnrollmentCount}</p>
                </article>
            </section>
            <section className="mt-3 rounded-lg border border-amber-500/20 bg-[#161b22] p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
                    <TriangleAlert aria-hidden="true" className="size-4" />Casos por atender
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Link className="rounded-md border border-neutral-800 bg-[#0d1117] px-4 py-3 transition-colors hover:border-amber-500/40" href="/dashboard/admin/alumnos">
                        <p className="text-sm font-semibold text-white">{summary.pendingCases.noPlan} alumnos</p>
                        <p className="text-xs text-neutral-400">Sin plan de mensualidad asignado</p>
                    </Link>
                    <Link className="rounded-md border border-neutral-800 bg-[#0d1117] px-4 py-3 transition-colors hover:border-amber-500/40" href="/dashboard/admin/horarios">
                        <p className="text-sm font-semibold text-white">{summary.pendingCases.noSchedule} alumnos</p>
                        <p className="text-xs text-neutral-400">Sin horario de referencia asignado</p>
                    </Link>
                </div>
            </section>
            <BirthdayWidget birthdays={birthdays} roleFilter="student" />
        </main>
    )
}