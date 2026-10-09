'use client'

import { useState } from 'react'
import { AlertTriangle, ClipboardCheck, ClipboardList, ClipboardX } from 'lucide-react'
import type { AdminExpectedAttendanceRoster } from '@/types/dashboard'
import { WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'
import { AdminPassListEditor } from './AdminPassListEditor'

interface AdminPassListPanelProps {
    roster: AdminExpectedAttendanceRoster
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
})

export function AdminPassListPanel({ roster }: AdminPassListPanelProps) {
    const [isOpen, setIsOpen] = useState(false)
    const passPending = roster.dayMatches && !roster.passTaken

    return (
        <section className="overflow-hidden rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Pase de lista</p>
                    <h3 className="mt-1 font-display text-lg font-bold text-ink">{roster.className}</h3>
                    <p className="mt-0.5 text-xs capitalize text-ink-3">{roster.branchName} · {dateFormatter.format(new Date(`${roster.date}T00:00:00.000Z`))}</p>
                    <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${roster.passTaken ? 'text-ok-text' : passPending ? 'text-warn-text' : 'text-ink-3'}`}>
                        {roster.passTaken ? <ClipboardCheck aria-hidden="true" className="size-3.5" /> : passPending ? <ClipboardX aria-hidden="true" className="size-3.5" /> : <AlertTriangle aria-hidden="true" className="size-3.5" />}
                        {roster.passTaken
                            ? `Pase de lista completado${roster.passTakenByName ? ` por ${roster.passTakenByName}` : ''}`
                            : passPending
                                ? 'Pase de lista pendiente'
                                : 'Sin sesión este día'}
                    </p>
                </div>
                <button
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-cyan-400 hover:bg-cyan-900/50"
                    onClick={() => setIsOpen((open) => !open)}
                    type="button"
                >
                    <ClipboardList aria-hidden="true" className="size-4" />
                    {isOpen ? 'Ocultar lista' : 'Corregir pase de lista'}
                </button>
            </div>

            {!roster.dayMatches && (
                <p className="flex items-center gap-1.5 border-t border-edge bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-warn-text">
                    <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
                    La clase «{roster.className}» es los {WEEKDAY_LONG[roster.classDayOfWeek] ?? '—'}; la fecha elegida ({dateFormatter.format(new Date(`${roster.date}T00:00:00.000Z`))}) no coincide.
                </p>
            )}

            {isOpen && <AdminPassListEditor roster={roster} />}
        </section>
    )
}
