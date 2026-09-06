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

                    <section className="mt-5 border border-[#e5e2e1] bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Agenda semanal</p>
                        <div aria-label="Filtrar clases por día" className="mt-3 flex gap-2 overflow-x-auto pb-1"><button aria-pressed={selectedDay === 'ALL'} className={`shrink-0 border px-3 py-2 text-xs font-bold ${selectedDay === 'ALL' ? 'border-[#1c1b1b] bg-[#1c1b1b] text-white' : 'border-[#e5e2e1] bg-[#fcf9f8] text-[#5c403c] hover:border-[#a1918e]'}`} onClick={() => setSelectedDay('ALL')} type="button">Toda la semana</button>{weekdays.map((day, dayOfWeek) => { const count = classes.filter((scheduledClass) => scheduledClass.dayOfWeek === dayOfWeek).length; const isSelected = selectedDay === dayOfWeek; return <button aria-pressed={isSelected} className={`shrink-0 border px-3 py-2 text-xs font-bold ${isSelected ? 'border-[#b70011] bg-[#b70011] text-white' : count > 0 ? 'border-[#e5e2e1] bg-white text-[#5c403c] hover:border-[#a1918e]' : 'border-[#e5e2e1] bg-[#f6f3f2] text-[#a1918e]'}`} key={day} onClick={() => setSelectedDay(dayOfWeek)} type="button">{day.slice(0, 3)} ({count})</button> })}</div>
                    </section>

                    {filteredClasses.length === 0 ? <section className="mt-5 border border-dashed border-[#d8d1cf] bg-white px-5 py-10 text-center"><CalendarDays aria-hidden="true" className="mx-auto size-7 text-[#a1918e]" /><p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No tienes clases este día.</p><p className="mt-1 text-sm text-[#5c403c]">Elige otro día para consultar tu agenda activa.</p></section> : <ul className="mt-5 space-y-3">
                        {filteredClasses.map((scheduledClass) => (
                            <li className="border border-[#e5e2e1] bg-white p-5 shadow-sm" key={scheduledClass.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">{weekdays[scheduledClass.dayOfWeek]}</p><h2 className="mt-1 font-display text-xl font-bold text-[#1c1b1b]">{scheduledClass.name}</h2></div><span className="inline-flex items-center gap-2 border border-[#e5e2e1] bg-[#f6f3f2] px-2.5 py-1 text-xs font-bold text-[#5c403c]"><Clock aria-hidden="true" className="size-3.5 text-[#b70011]" />{scheduledClass.startTime} - {scheduledClass.endTime}</span></div>
                                {scheduledClass.description && <p className="mt-3 text-sm leading-6 text-[#5c403c]">{scheduledClass.description}</p>}
                                <p className="mt-4 inline-flex items-center gap-2 border-t border-[#e5e2e1] pt-3 text-sm text-[#5c403c]"><UserRound aria-hidden="true" className="size-4 text-[#b70011]" />{scheduledClass.instructorName ?? 'Instructor por asignar'}</p>
                            </li>
                        ))}
                    </ul>}
                </>
            )}
        </main>
    )
}