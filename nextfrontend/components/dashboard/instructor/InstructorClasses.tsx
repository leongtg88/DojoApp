import Link from 'next/link'
import { CalendarDays, Clock, Users } from 'lucide-react'
import type { InstructorClassSummary } from '@/types/dashboard'

interface InstructorClassesProps {
    classes: InstructorClassSummary[]
}

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function InstructorClasses({ classes }: InstructorClassesProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Mis clases</h1>
            <p className="mt-2 text-sm text-neutral-400">Grupos que tienes asignados y alumnos activos por clase.</p>

            {classes.length === 0 ? (
                <section className="mt-7 border border-[#e5e2e1] bg-white px-5 py-10 text-center">
                    <CalendarDays aria-hidden="true" className="mx-auto size-7 text-[#a1918e]" />
                    <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No tienes clases asignadas.</p>
                </section>
            ) : (
                <ul className="mt-7 grid gap-3 md:grid-cols-2">
                    {classes.map((scheduledClass) => (
                        <li className="rounded-lg border border-neutral-800 bg-[#161b22] p-5" key={scheduledClass.id}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{weekdays[scheduledClass.dayOfWeek]} · {scheduledClass.branchName}</p>
                            <h2 className="mt-1 font-display text-xl font-bold text-white">{scheduledClass.name}</h2>
                            {scheduledClass.description && <p className="mt-2 text-sm text-neutral-400">{scheduledClass.description}</p>}
                            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-300">
                                <span className="inline-flex items-center gap-2"><Clock aria-hidden="true" className="size-4 text-cyan-400" />{scheduledClass.startTime} - {scheduledClass.endTime}</span>
                                <span className="inline-flex items-center gap-2"><Users aria-hidden="true" className="size-4 text-emerald-400" />{scheduledClass.activeStudentCount} activos</span>
                            </div>
                            <Link className="mt-5 inline-flex text-sm font-semibold text-cyan-300" href="/dashboard/instructor/estudiantes">
                                Ver estudiantes
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}