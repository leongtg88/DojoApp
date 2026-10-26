import Link from 'next/link'
import { CalendarDays, Clock, Users } from 'lucide-react'
import type { InstructorClassSummary } from '@/types/dashboard'
import { EmptyState } from '@/components/common/EmptyState'

interface InstructorClassesProps {
    classes: InstructorClassSummary[]
}

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function InstructorClasses({ classes }: InstructorClassesProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Mis clases</h1>
            <p className="mt-2 text-xs text-ink-3">Grupos que tienes asignados y alumnos activos por clase.</p>

            {classes.length === 0 ? (
                <EmptyState
                    className="mt-7"
                    description="La administración asigna los horarios y sus instructores. Cuando te asignen una clase, aparecerá aquí."
                    icon={CalendarDays}
                    title="Aún no tienes clases asignadas"
                />
            ) : (
                <ul className="mt-7 grid gap-3 md:grid-cols-2">
                    {classes.map((scheduledClass) => (
                        <li className="rounded-lg border border-edge bg-surface-2 p-5" key={scheduledClass.id}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{weekdays[scheduledClass.dayOfWeek]} · {scheduledClass.branchName}</p>
                            <h2 className="mt-1 font-display text-xl font-bold text-ink">{scheduledClass.name}</h2>
                            {scheduledClass.description && <p className="mt-2 text-xs text-ink-3">{scheduledClass.description}</p>}
                            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-2">
                                <span className="inline-flex items-center gap-2"><Clock aria-hidden="true" className="size-4 text-accent" />{scheduledClass.startTime} - {scheduledClass.endTime}</span>
                                <span className="inline-flex items-center gap-2"><Users aria-hidden="true" className="size-4 text-ok-text" />{scheduledClass.activeStudentCount} activos</span>
                            </div>
                            <Link className="mt-5 inline-flex text-sm font-semibold text-accent" href="/dashboard/instructor/estudiantes">
                                Ver estudiantes
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}