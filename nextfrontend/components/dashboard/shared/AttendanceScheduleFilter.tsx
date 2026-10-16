'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, Check, ChevronDown } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface AttendanceScheduleGroup {
    label: string | null
    options: { id: string; name: string }[]
}

interface AttendanceScheduleFilterProps {
    groups: AttendanceScheduleGroup[]
    selectedClassId: string | null
    basePath: string
    /** Fecha de sesión derivada de la clase, ya formateada. */
    dateLabel: string
    /** Fecha de sesión derivada de la clase (YYYY-MM-DD), para prellenar el override. */
    defaultDate: string | null
    /** Fecha elegida manualmente (override), si existe. */
    overrideDate: string | null
    /** La fecha consultada coincide con el día de la semana de la clase. */
    dayMatches: boolean
    /** Día de la semana de la clase (p. ej. "Miércoles"), para el aviso. */
    classDayLabel: string | null
    /** Clase que está en curso ahora; se resalta en el listado. */
    inSessionClassId?: string | null
}

export function AttendanceScheduleFilter({
    groups,
    selectedClassId,
    basePath,
    dateLabel,
    defaultDate,
    overrideDate,
    dayMatches,
    classDayLabel,
    inSessionClassId = null,
}: AttendanceScheduleFilterProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const initialCustomDate = overrideDate ?? defaultDate ?? ''
    const [customDate, setCustomDate] = useState(initialCustomDate)
    // Reinicia la fecha sugerida cuando cambia la clase (o el override) sin usar effects.
    const resetKey = `${selectedClassId ?? ''}|${overrideDate ?? ''}|${defaultDate ?? ''}`
    const [lastResetKey, setLastResetKey] = useState(resetKey)
    if (resetKey !== lastResetKey) {
        setLastResetKey(resetKey)
        setCustomDate(initialCustomDate)
    }

    const selectedOption = groups.flatMap((group) => group.options).find((option) => option.id === selectedClassId) ?? null

    function selectClass(classId: string) {
        // Al cambiar de clase se descarta la fecha: se recalcula desde el horario.
        router.push(`${basePath}?classId=${encodeURIComponent(classId)}`)
    }

    function loadCustomDate() {
        if (!customDate || !selectedClassId) return
        router.push(`${basePath}?classId=${encodeURIComponent(selectedClassId)}&date=${encodeURIComponent(customDate)}`)
    }

    return (
        <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-52 flex-1 flex-col gap-1.5">
                    <span className="text-sm font-semibold text-ink" id="attendance-class-label">Clase</span>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <button
                                aria-labelledby="attendance-class-label"
                                className="flex items-center justify-between gap-2 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-left text-xs text-ink outline-none transition-colors hover:bg-surface-3/40 focus:border-cyan-500"
                                type="button"
                            >
                                <span className={`min-w-0 truncate ${selectedOption ? 'font-semibold text-ink' : 'text-ink-4'}`}>
                                    {selectedOption?.name ?? 'Selecciona una clase'}
                                </span>
                                <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[min(92vw,28rem)] overflow-hidden p-0">
                            <div className="max-h-80 overflow-y-auto p-1.5">
                                {groups.map((group, index) => (
                                    <div className={index > 0 ? 'mt-1 border-t border-edge pt-1' : ''} key={`${group.label ?? 'grupo'}-${index}`}>
                                        {group.label && (
                                            <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-ink-4">{group.label}</p>
                                        )}
                                        <ul className="space-y-0.5">
                                            {group.options.map((option) => {
                                                const active = option.id === selectedClassId
                                                const inSession = option.id === inSessionClassId
                                                return (
                                                    <li key={option.id}>
                                                        <button
                                                            aria-current={active ? 'true' : undefined}
                                                            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${active ? 'bg-cyan-500/15 text-accent-text' : 'text-ink-2 hover:bg-surface-3 hover:text-ink'}`}
                                                            onClick={() => {
                                                                setOpen(false)
                                                                if (!active) selectClass(option.id)
                                                            }}
                                                            type="button"
                                                        >
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-xs font-semibold">{option.name}</span>
                                                            </span>
                                                            {inSession && (
                                                                <span className="shrink-0 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-text">En curso</span>
                                                            )}
                                                            {active && <Check aria-hidden="true" className="size-3.5 shrink-0 text-accent" />}
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                ))}
                                {groups.length === 0 && (
                                    <p className="px-3 py-6 text-center text-xs text-ink-4">No hay horarios disponibles.</p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
                    Fecha
                    <span className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-medium capitalize text-ink-2">
                        <CalendarDays aria-hidden="true" className="size-3.5 text-accent" />
                        {dateLabel}
                    </span>
                </div>
            </div>

            <details className="mt-3 text-xs">
                <summary className="inline-flex cursor-pointer select-none items-center gap-1.5 font-semibold text-accent">
                    <ChevronDown aria-hidden="true" className="size-3.5" />Cargar otra fecha
                </summary>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-2" htmlFor="attendance-custom-date">
                        Fecha específica
                        <DatePicker
                            id="attendance-custom-date"
                            onChange={setCustomDate}
                            value={customDate}
                        />
                    </label>
                    <button
                        className="rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-50"
                        disabled={!customDate}
                        onClick={loadCustomDate}
                        type="button"
                    >
                        Cargar
                    </button>
                </div>
            </details>

            {!dayMatches && (
                <p className="mt-3 inline-flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-warn-text">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                        Esta clase {classDayLabel ? `es los ${classDayLabel}` : 'no sesiona ese día'}; la fecha elegida ({dateLabel}) no coincide. Igual puedes revisar o registrar la asistencia.
                    </span>
                </p>
            )}
        </section>
    )
}
