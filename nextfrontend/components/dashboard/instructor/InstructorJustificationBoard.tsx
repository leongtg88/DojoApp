'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Inbox, Loader2, XCircle } from 'lucide-react'
import type { InstructorPendingJustification } from '@/types/dashboard'

interface InstructorJustificationBoardProps {
    justifications: InstructorPendingJustification[]
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export function InstructorJustificationBoard({ justifications }: InstructorJustificationBoardProps) {
    const router = useRouter()
    const [busyId, setBusyId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function review(justificationId: string, action: 'approve' | 'reject') {
        setError(null)
        setBusyId(justificationId)

        const response = await fetch(`/api/dashboard/instructor/attendance/justification/${justificationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        })

        setBusyId(null)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible revisar la justificación.')
            return
        }

        router.refresh()
    }

    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-edge px-5 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Inasistencias de tus alumnos</p>
                    <h2 className="mt-1 font-display text-lg font-bold text-ink">Justificaciones pendientes</h2>
                </div>
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-warn-text">{justifications.length} por revisar</span>
            </div>

            {error && <p className="border-b border-edge px-5 py-3 text-sm text-danger-text">{error}</p>}

            {justifications.length === 0 ? (
                <p className="flex flex-col items-center gap-2 px-5 py-12 text-center text-ink-4">
                    <Inbox aria-hidden="true" className="size-6" />
                    <span className="text-sm">No hay justificaciones pendientes en tus clases.</span>
                </p>
            ) : (
                <ul className="divide-y divide-edge">
                    {justifications.map((justification) => (
                        <li className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-start" key={justification.id}>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-ink">{justification.studentName}</p>
                                <p className="mt-1 text-xs text-ink-3">{justification.className} · {dateFormatter.format(new Date(`${justification.date}T00:00:00.000Z`))}</p>
                                <p className="mt-2 rounded-md border border-edge bg-surface-1 px-3 py-2 text-sm text-ink-2">{justification.reason}</p>
                            </div>
                            <div className="flex shrink-0 gap-2 self-end sm:self-center">
                                <button
                                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                                    disabled={busyId === justification.id}
                                    onClick={() => review(justification.id, 'approve')}
                                    type="button"
                                >
                                    {busyId === justification.id ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="size-3.5" />}
                                    Aprobar
                                </button>
                                <button
                                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-danger-text hover:bg-rose-500/10 disabled:opacity-50"
                                    disabled={busyId === justification.id}
                                    onClick={() => review(justification.id, 'reject')}
                                    type="button"
                                >
                                    <XCircle aria-hidden="true" className="size-3.5" />
                                    Rechazar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
