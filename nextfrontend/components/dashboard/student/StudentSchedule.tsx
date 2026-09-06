import { CalendarDays, Clock, UserRound } from 'lucide-react'
import type { ClassSchedule } from '@/types/dashboard'

interface StudentScheduleProps {
    classes: ClassSchedule[]
}

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function StudentSchedule({ classes }: StudentScheduleProps) {
    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Mi horario</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Clases inscritas</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Horario de las clases activas en tu expediente.</p>

            {classes.length === 0 ? (
                <section className="mt-7 border border-[#e5e2e1] bg-white px-5 py-10 text-center">
                    <CalendarDays aria-hidden="true" className="mx-auto size-7 text-[#a1918e]" />
                    <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No tienes clases activas asignadas.</p>
                    <p className="mt-1 text-sm text-[#5c403c]">Contacta a la administración para completar tu inscripción.</p>
                </section>
            ) : (
                <ul className="mt-7 space-y-3">
                    {classes.map((scheduledClass) => (
                        <li className="border border-[#e5e2e1] bg-white p-5" key={scheduledClass.id}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">{weekdays[scheduledClass.dayOfWeek]}</p>
                            <h2 className="mt-1 font-display text-xl font-bold text-[#1c1b1b]">{scheduledClass.name}</h2>
                            {scheduledClass.description && <p className="mt-2 text-sm text-[#5c403c]">{scheduledClass.description}</p>}
                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5c403c]">
                                <span className="inline-flex items-center gap-2"><Clock aria-hidden="true" className="size-4 text-[#b70011]" />{scheduledClass.startTime} - {scheduledClass.endTime}</span>
                                <span className="inline-flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-[#b70011]" />{scheduledClass.instructorName ?? 'Instructor por asignar'}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}