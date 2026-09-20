'use client'

import { useState } from 'react'
import { CalendarDays, ChevronRight, Clock, UserRound } from 'lucide-react'
import type { ClassSchedule } from '@/types/dashboard'
import { nextClassFrom, WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'

interface StudentScheduleProps {
    classes: ClassSchedule[]
}

export function StudentSchedule({ classes }: StudentScheduleProps) {
    const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL')
    const filteredClasses = selectedDay === 'ALL'
        ? classes
        : classes.filter(({ dayOfWeek }) => dayOfWeek === selectedDay)
    const nextClass = nextClassFrom(classes)

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Mi horario</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Clases inscritas</h1>
            <p className="mt-2 text-sm text-ink-3">Horario de las clases activas en tu expediente.</p>

            {classes.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center">
                    <CalendarDays aria-hidden="true" className="mx-auto size-7 text-accent" />
                    <p className="mt-3 text-sm font-semibold text-ink">No tienes clases activas asignadas.</p>
                    <p className="mt-1 text-sm text-ink-3">Contacta a la administración para completar tu inscripción.</p>
                </section>
            ) : (
                <>
                    {nextClass && <section className="mt-7 rounded-lg border border-cyan-900/50 bg-surface-2 p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Próxima sesión</p><h2 className="mt-1 font-display text-xl font-bold text-ink">{nextClass.name}</h2><p className="mt-1 text-sm text-ink-3">{WEEKDAY_LONG[nextClass.dayOfWeek]} · {nextClass.startTime} - {nextClass.endTime}</p></div><span className="inline-flex items-center gap-1 text-xs font-bold text-accent">Ver agenda <ChevronRight aria-hidden="true" className="size-3.5" /></span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-edge pt-4 text-sm text-ink-2"><span className="inline-flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-accent" />{nextClass.instructorName ?? 'Instructor por asignar'}</span>{nextClass.description && <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 text-accent" />{nextClass.description}</span>}</div></section>}

                    <section className="mt-5 rounded-lg border border-edge bg-surface-2 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Agenda semanal</p>
                        <div aria-label="Filtrar clases por día" className="mt-3 flex gap-2 overflow-x-auto pb-1"><button aria-pressed={selectedDay === 'ALL'} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-bold ${selectedDay === 'ALL' ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-1 text-ink-3 hover:border-edge-strong'}`} onClick={() => setSelectedDay('ALL')} type="button">Toda la semana</button>{WEEKDAY_LONG.map((day, dayOfWeek) => { const count = classes.filter((scheduledClass) => scheduledClass.dayOfWeek === dayOfWeek).length; const isSelected = selectedDay === dayOfWeek; return <button aria-pressed={isSelected} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-bold ${isSelected ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : count > 0 ? 'border-edge-strong bg-surface-1 text-ink-2 hover:border-edge-strong' : 'border-edge bg-surface-2 text-ink-4'}`} key={day} onClick={() => setSelectedDay(dayOfWeek)} type="button">{day.slice(0, 3)} ({count})</button> })}</div>
                    </section>

                    {filteredClasses.length === 0 ? <section className="mt-5 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center"><CalendarDays aria-hidden="true" className="mx-auto size-7 text-accent" /><p className="mt-3 text-sm font-semibold text-ink">No tienes clases este día.</p><p className="mt-1 text-sm text-ink-3">Elige otro día para consultar tu agenda activa.</p></section> : <ul className="mt-5 space-y-3">
                        {filteredClasses.map((scheduledClass) => (
                            <li className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm" key={scheduledClass.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">{WEEKDAY_LONG[scheduledClass.dayOfWeek]}</p><h2 className="mt-1 font-display text-xl font-bold text-ink">{scheduledClass.name}</h2></div><span className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-2.5 py-1 text-xs font-bold text-accent-text"><Clock aria-hidden="true" className="size-3.5 text-accent" />{scheduledClass.startTime} - {scheduledClass.endTime}</span></div>
                                {scheduledClass.description && <p className="mt-3 text-sm leading-6 text-ink-2">{scheduledClass.description}</p>}
                                <p className="mt-4 inline-flex items-center gap-2 border-t border-edge pt-3 text-sm text-ink-2"><UserRound aria-hidden="true" className="size-4 text-accent" />{scheduledClass.instructorName ?? 'Instructor por asignar'}</p>
                            </li>
                        ))}
                    </ul>}
                </>
            )}
        </main>
    )
}