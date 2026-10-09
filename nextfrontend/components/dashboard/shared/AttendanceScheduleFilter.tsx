'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, ChevronDown } from 'lucide-react'

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
}: AttendanceScheduleFilterProps) {
    const router = useRouter()
    const initialCustomDate = overrideDate ?? defaultDate ?? ''
    const [customDate, setCustomDate] = useState(initialCustomDate)
    // Reinicia la fecha sugerida cuando cambia la clase (o el override) sin usar effects.
    const resetKey = `${selectedClassId ?? ''}|${overrideDate ?? ''}|${defaultDate ?? ''}`
    const [lastResetKey, setLastResetKey] = useState(resetKey)
    if (resetKey !== lastResetKey) {
        setLastResetKey(resetKey)
        setCustomDate(initialCustomDate)
    }

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
                <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="attendance-class">
                    Clase
                    <select
                        className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none focus:border-cyan-500"
                        id="attendance-class"
                        onChange={(event) => selectClass(event.target.value)}
                        value={selectedClassId ?? ''}
                    >
                        {groups.map((group, index) =>
                            group.label ? (
                                <optgroup key={`${group.label}-${index}`} label={group.label}>
                                    {group.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                                </optgroup>
                            ) : (
                                group.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)
                            ),
                        )}
                    </select>
                </label>
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
                        <input
                            className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none focus:border-cyan-500"
                            id="attendance-custom-date"
                            onChange={(event) => setCustomDate(event.target.value)}
                            type="date"
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
