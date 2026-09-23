'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight, Clock3, Loader2, ShieldAlert, TriangleAlert } from 'lucide-react'
import type { StudentMonthlyStatus } from '@/types/dashboard'

function balanceColor(level: StudentMonthlyStatus['balanceLevel']) {
    if (level === 'OK') return 'text-ok-text'
    if (level === 'HIGH') return 'text-accent'
    if (level === 'VERY_HIGH') return 'text-warn-text'
    return 'text-danger-text'
}

function balanceBarColor(level: StudentMonthlyStatus['balanceLevel']) {
    if (level === 'OK') return 'bg-emerald-400'
    if (level === 'HIGH') return 'bg-cyan-400'
    if (level === 'VERY_HIGH') return 'bg-amber-400'
    return 'bg-rose-400'
}

export function StudentMonthlyProgress({ studentId }: { studentId?: string }) {
    const [month, setMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [data, setData] = useState<StudentMonthlyStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams({ month })
        if (studentId) params.set('estudiante', studentId)
        fetch(`/api/dashboard/student/monthly-status?${params.toString()}`)
            .then(async (response) => {
                const payload = await response.json().catch(() => null)
                if (!response.ok) throw new Error(payload?.error ?? 'No se pudo cargar el estado mensual')
                setData(payload)
                setError(null)
            })
            .catch((cause: Error) => {
                setError(cause.message === 'Failed to fetch' ? 'Error al cargar' : cause.message)
            })
            .finally(() => setLoading(false))
    }, [month, studentId])

    const monthLabel = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))

    function shiftMonth(delta: number) {
        setMonth((current) => {
            const [year, monthNumber] = current.split('-').map(Number)
            const date = new Date(year, monthNumber - 1 + delta, 1)
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        })
    }

    const percent = data?.expectedHours && data.expectedHours > 0 ? Math.min(100, Math.round((data.confirmedHours / data.expectedHours) * 100)) : 0

    return (
        <section className="rounded-lg border border-edge bg-surface-2 p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarClock aria-hidden="true" className="size-4 text-accent" />
                    <h2 className="font-display text-base font-bold text-ink">Progreso mensual</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-2">
                    <button type="button" onClick={() => shiftMonth(-1)} className="rounded p-1 hover:bg-surface-3" aria-label="Mes anterior">
                        <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <span className="w-36 text-center font-semibold capitalize">{monthLabel}</span>
                    <button type="button" onClick={() => shiftMonth(1)} className="rounded p-1 hover:bg-surface-3" aria-label="Mes siguiente">
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {error && <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-danger-text">{error}</p>}
            {loading && !data && (
                <p className="mt-4 flex items-center gap-2 text-sm text-ink-3">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />Cargando…
                </p>
            )}

            {!loading && data && (
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-edge bg-surface-1 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Horas confirmadas</p>
                            <p className="mt-1 text-2xl font-extrabold text-ink">{data.confirmedHours} <span className="text-sm font-semibold text-ink-3">h</span></p>
                        </div>
                        <div className="rounded-lg border border-edge bg-surface-1 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Meta del plan</p>
                            <p className="mt-1 text-2xl font-extrabold text-ink">{data.expectedHours ?? '—'} <span className="text-sm font-semibold text-ink-3">{data.expectedHours ? 'h' : ''}</span></p>
                        </div>
                    </div>

                    {data.plan && (
                        <div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-ink-2">{data.plan.name}</span>
                                <span className={`font-bold ${balanceColor(data.balanceLevel)}`}>
                                    {data.balanceDiff === null ? '—' : data.balanceDiff >= 0 ? `+${data.balanceDiff} h` : `${data.balanceDiff} h`}
                                </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                                <div className={`h-full rounded-full ${balanceBarColor(data.balanceLevel)}`} style={{ width: `${percent}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-ink-3">{data.plan.isUnlimited ? 'Plan de horas ilimitadas' : `${percent}% de la meta del mes`}</p>
                        </div>
                    )}

                    {data.balanceAlert && (
                        <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-warn-text">
                            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            {data.balanceMessage}
                        </p>
                    )}
                    {!data.plan && (
                        <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-warn-text">
                            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            Aún no tienes un plan asignado. Consulta con tu administrador.
                        </p>
                    )}

                    {data.pendingRecoveries.length > 0 && (
                        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-info-text">Recuperaciones pendientes ({data.pendingRecoveries.length})</p>
                            <ul className="mt-2 space-y-1">
                                {data.pendingRecoveries.map((recovery) => (
                                    <li key={recovery.id} className="flex items-center justify-between gap-2 text-xs text-info-text">
                                        <span>{new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short' }).format(new Date(recovery.date))}{recovery.className ? ` · ${recovery.className}` : ''}</span>
                                        <span className="text-info-text/70">por recuperar</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-2 text-[11px] text-info-text/80">Quienes faltan de forma justificada recuperan las horas entrenando fuera de su horario habitual.</p>
                        </div>
                    )}

                    {data.outOfScheduleCount > 0 && (
                        <p className="flex items-center gap-2 text-xs text-warn-text">
                            <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                            {data.outOfScheduleCount} registro(s) este mes fuera de tu horario de referencia.
                        </p>
                    )}
                </div>
            )}
        </section>
    )
}