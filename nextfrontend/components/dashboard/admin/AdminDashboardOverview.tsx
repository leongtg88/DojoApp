import Link from 'next/link'
import { CalendarDays, GraduationCap, Users } from 'lucide-react'
import { BirthdayWidget } from '@/components/dashboard/shared/BirthdayWidget'
import type { AdminDashboardSummary, DashboardBirthday } from '@/types/dashboard'

interface AdminDashboardOverviewProps {
    summary: AdminDashboardSummary
    birthdays: DashboardBirthday[]
}

export function AdminDashboardOverview({ summary, birthdays }: AdminDashboardOverviewProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Resumen del dojo</h1>
            <section className="mt-7 grid gap-3 sm:grid-cols-3">
                <Link className="border border-[#e5e2e1] bg-white p-5 transition-colors hover:bg-[#fffaf0]" href="/dashboard/admin/alumnos">
                    <Users aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Alumnos</p>
                    <p className="mt-1 text-3xl font-bold text-[#1c1b1b]">{summary.studentCount}</p>
                </Link>
                <article className="border border-[#e5e2e1] bg-white p-5">
                    <CalendarDays aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Clases</p>
                    <p className="mt-1 text-3xl font-bold text-[#1c1b1b]">{summary.classCount}</p>
                </article>
                <article className="border border-[#e5e2e1] bg-white p-5">
                    <GraduationCap aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Inscripciones activas</p>
                    <p className="mt-1 text-3xl font-bold text-[#1c1b1b]">{summary.activeEnrollmentCount}</p>
                </article>
            </section>
            <BirthdayWidget birthdays={birthdays} />
        </main>
    )
}