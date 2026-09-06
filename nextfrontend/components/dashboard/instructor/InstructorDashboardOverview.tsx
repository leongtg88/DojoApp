import Link from 'next/link'
import { CalendarDays, Users } from 'lucide-react'
import { BirthdayWidget } from '@/components/dashboard/shared/BirthdayWidget'
import type { DashboardBirthday, InstructorClassSummary, InstructorStudentSummary } from '@/types/dashboard'

interface InstructorDashboardOverviewProps {
    birthdays: DashboardBirthday[]
    classes: InstructorClassSummary[]
    students: InstructorStudentSummary[]
}

export function InstructorDashboardOverview({ birthdays, classes, students }: InstructorDashboardOverviewProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Resumen de tatami</h1>
            <p className="mt-2 text-sm text-neutral-400">Consulta tus grupos asignados y los alumnos bajo tu seguimiento.</p>

            <section className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 transition-colors hover:border-cyan-500/40 hover:bg-neutral-800" href="/dashboard/instructor/clases">
                    <CalendarDays aria-hidden="true" className="size-5 text-cyan-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Clases asignadas</p>
                    <p className="mt-1 text-3xl font-bold text-white">{classes.length}</p>
                    <p className="mt-2 text-sm text-neutral-400">Ver horario y composición de grupos.</p>
                </Link>
                <Link className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 transition-colors hover:border-emerald-500/40 hover:bg-neutral-800" href="/dashboard/instructor/estudiantes">
                    <Users aria-hidden="true" className="size-5 text-emerald-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Estudiantes activos</p>
                    <p className="mt-1 text-3xl font-bold text-white">{students.length}</p>
                    <p className="mt-2 text-sm text-neutral-400">Ver alumnos inscritos en tus clases.</p>
                </Link>
            </section>
            <BirthdayWidget birthdays={birthdays} />
        </main>
    )
}