'use client'

import { useState } from 'react'
import { CalendarDays, ChevronRight, Clock, UserRound } from 'lucide-react'
import type { ClassSchedule } from '@/types/dashboard'

interface StudentScheduleProps {
    classes: ClassSchedule[]
}

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function StudentSchedule({ classes }: StudentScheduleProps) {
    const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL')
    const filteredClasses = selectedDay === 'ALL'
        ? classes
        : classes.filter(({ dayOfWeek }) => dayOfWeek === selectedDay)
    const nextClass = classes.reduce<ClassSchedule | null>((nearest, scheduledClass) => {
        const now = new Date()
        const [hours, minutes] = scheduledClass.startTime.split(':').map(Number)
        const candidate = new Date(now)
        candidate.setHours(hours, minutes, 0, 0)
        const daysUntil = (scheduledClass.dayOfWeek - now.getDay() + 7) % 7
        candidate.setDate(now.getDate() + daysUntil)

        if (daysUntil === 0 && candidate <= now) {
            candidate.setDate(candidate.getDate() + 7)
        }

        if (!nearest) {
            return scheduledClass
        }

        const [nearestHours, nearestMinutes] = nearest.startTime.split(':').map(Number)
        const nearestCandidate = new Date(now)
        nearestCandidate.setHours(nearestHours, nearestMinutes, 0, 0)
        const nearestDaysUntil = (nearest.dayOfWeek - now.getDay() + 7) % 7
        nearestCandidate.setDate(now.getDate() + nearestDaysUntil + (nearestDaysUntil === 0 && nearestCandidate <= now ? 7 : 0))

        return candidate < nearestCandidate ? scheduledClass : nearest
    }, null)

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Mi horario</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Clases inscritas</h1>
            <p className="mt-2 text-sm text-neutral-400">Horario de las clases activas en tu expediente.</p>

            {classes.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
                    <CalendarDays aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
                    <p className="mt-3 text-sm font-semibold text-white">No tienes clases activas asignadas.</p>
                    <p className="mt-1 text-sm text-neutral-400">Contacta a la administración para completar tu inscripción.</p>
                </section>
            ) : (
                <>
                    {nextClass && <section className="mt-7 rounded-lg border border-cyan-900/50 bg-[#161b22] p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Próxima sesión</p><h2 className="mt-1 font-display text-xl font-bold text-white">{nextClass.name}</h2><p className="mt-1 text-sm text-neutral-400">{weekdays[nextClass.dayOfWeek]} · {nextClass.startTime} - {nextClass.endTime}</p></div><span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300">Ver agenda <ChevronRight aria-hidden="true" className="size-3.5" /></span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-800 pt-4 text-sm text-neutral-300"><span className="inline-flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-cyan-400" />{nextClass.instructorName ?? 'Instructor por asignar'}</span>{nextClass.description && <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 text-cyan-400" />{nextClass.description}</span>}</div></section>}

                    <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Agenda semanal</p>
                        <div aria-label="Filtrar clases por día" className="mt-3 flex gap-2 overflow-x-auto pb-1"><button aria-pressed={selectedDay === 'ALL'} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-bold ${selectedDay === 'ALL' ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : 'border-neutral-700 bg-[#0d1117] text-neutral-400 hover:border-neutral-500'}`} onClick={() => setSelectedDay('ALL')} type="button">Toda la semana</button>{weekdays.map((day, dayOfWeek) => { const count = classes.filter((scheduledClass) => scheduledClass.dayOfWeek === dayOfWeek).length; const isSelected = selectedDay === dayOfWeek; return <button aria-pressed={isSelected} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-bold ${isSelected ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : count > 0 ? 'border-neutral-700 bg-[#0d1117] text-neutral-300 hover:border-neutral-500' : 'border-neutral-800 bg-[#161b22] text-neutral-600'}`} key={day} onClick={() => setSelectedDay(dayOfWeek)} type="button">{day.slice(0, 3)} ({count})</button> })}</div>
                    </section>

                    {filteredClasses.length === 0 ? <section className="mt-5 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center"><CalendarDays aria-hidden="true" className="mx-auto size-7 text-cyan-400" /><p className="mt-3 text-sm font-semibold text-white">No tienes clases este día.</p><p className="mt-1 text-sm text-neutral-400">Elige otro día para consultar tu agenda activa.</p></section> : <ul className="mt-5 space-y-3">
                        {filteredClasses.map((scheduledClass) => (
                            <li className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm" key={scheduledClass.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{weekdays[scheduledClass.dayOfWeek]}</p><h2 className="mt-1 font-display text-xl font-bold text-white">{scheduledClass.name}</h2></div><span className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-2.5 py-1 text-xs font-bold text-cyan-200"><Clock aria-hidden="true" className="size-3.5 text-cyan-400" />{scheduledClass.startTime} - {scheduledClass.endTime}</span></div>
                                {scheduledClass.description && <p className="mt-3 text-sm leading-6 text-neutral-300">{scheduledClass.description}</p>}
                                <p className="mt-4 inline-flex items-center gap-2 border-t border-neutral-800 pt-3 text-sm text-neutral-300"><UserRound aria-hidden="true" className="size-4 text-cyan-400" />{scheduledClass.instructorName ?? 'Instructor por asignar'}</p>
                            </li>
                        ))}
                    </ul>}
                </>
            )}
        </main>
    )
}