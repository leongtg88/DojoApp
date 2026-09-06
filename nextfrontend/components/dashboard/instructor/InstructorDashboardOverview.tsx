import Link from 'next/link'
import { CalendarDays, Users } from 'lucide-react'
import type { InstructorClassSummary, InstructorStudentSummary } from '@/types/dashboard'

interface InstructorDashboardOverviewProps {
    classes: InstructorClassSummary[]
    students: InstructorStudentSummary[]
}

export function InstructorDashboardOverview({ classes, students }: InstructorDashboardOverviewProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Resumen de tatami</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Consulta tus grupos asignados y los alumnos bajo tu seguimiento.</p>

            <section className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link className="border border-[#e5e2e1] bg-white p-5 transition-colors hover:bg-[#fffaf0]" href="/dashboard/instructor/clases">
                    <CalendarDays aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Clases asignadas</p>
                    <p className="mt-1 text-3xl font-bold text-[#1c1b1b]">{classes.length}</p>
                    <p className="mt-2 text-sm text-[#5c403c]">Ver horario y composición de grupos.</p>
                </Link>
                <Link className="border border-[#e5e2e1] bg-white p-5 transition-colors hover:bg-[#fffaf0]" href="/dashboard/instructor/estudiantes">
                    <Users aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Estudiantes activos</p>
                    <p className="mt-1 text-3xl font-bold text-[#1c1b1b]">{students.length}</p>
                    <p className="mt-2 text-sm text-[#5c403c]">Ver alumnos inscritos en tus clases.</p>
                </Link>
            </section>
        </main>
    )
}