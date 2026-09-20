'use client'

import { useEffect, useState } from 'react'
import { Check, Clock3, Loader2, Search, ShieldCheck, X } from 'lucide-react'
import type { AttendanceStatus } from '@/types/dashboard'

interface BoardRecord {
    id: string
    date: string
    present: boolean
    hoursTrained: number
    sessionType: string | null
    status: AttendanceStatus
    notes: string | null
    punchedAt: string
    confirmedAt: string | null
    confirmedByName: string | null
    className: string | null
    isOutOfSchedule: boolean
    student: {
        id: string
        firstName: string
        lastName: string
        memberNumber: string | null
        planName: string | null
    }
}

interface BulkPayload {
    action: 'CONFIRMED' | 'REJECTED' | 'JUSTIFIED'
    ids: string[]
}

export function AdminAttendanceBoard() {
    const [records, setRecords] = useState<BoardRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [date, setDate] = useState('')
    const [status, setStatus] = useState<'PENDING' | 'all'>('PENDING')
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [acting, setActing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const params = new URLSearchParams()
        if (date) params.set('date', date)
        params.set('status', status)
        if (query.trim()) params.set('q', query.trim())
        fetch(`/api/dashboard/admin/attendance?${params.toString()}`)
            .then(async (response) => {
                const data = await response.json().catch(() => null)
                if (!response.ok) throw new Error(data?.error ?? 'No se pudieron cargar las asistencias')
                setRecords(data.records ?? [])
                setSelected(new Set())
                setError(null)
            })
            .catch((cause: Error) => {
                setError(cause.message === 'Failed to fetch' ? 'Error al cargar' : cause.message)
            })
            .finally(() => setLoading(false))
    }, [date, status, query, refreshKey])

    async function bulkAction(action: BulkPayload['action']) {
        if (selected.size === 0) return
        setActing(true)
        setError(null)
        try {
            const response = await fetch('/api/dashboard/admin/attendance', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ action, ids: [...selected] }),
            })
            const data = await response.json().catch(() => null)
            if (!response.ok) throw new Error(data?.error ?? 'No se pudo aplicar la acción')
            setLoading(true)
            setRefreshKey((key) => key + 1)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Error al aplicar acción')
        } finally {
            setActing(false)
        }
    }

    function toggle(id: string) {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelected(next)
    }

    const formatter = new Intl.DateTimeFormat('es-DO', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    })

    return (
        <section className="rounded-lg border border-edge bg-surface-2">
            <div className="flex flex-wrap items-center gap-3 border-b border-edge p-4">
                <div className="relative min-w-52 flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" aria-hidden="true" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar por alumno..."
                        className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-cyan-500"
                    />
                </div>
                <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                />
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as 'PENDING' | 'all')}
                    className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                >
                    <option value="PENDING">Pendientes</option>
                    <option value="all">Todas</option>
                </select>
                <button
                    type="button"
                    onClick={() => {
                        setLoading(true)
                        setRefreshKey((key) => key + 1)
                    }}
                    disabled={loading}
                    className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Actualizar'}
                </button>
            </div>

            {error && <p className="border-b border-edge px-4 py-3 text-sm text-danger-text">{error}</p>}

            {selected.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-3">
                    <span className="text-xs text-ink-3">{selected.size} seleccionados</span>
                    <button
                        type="button"
                        onClick={() => void bulkAction('CONFIRMED')}
                        disabled={acting}
                        className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50"
                    >
                        {acting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                        Confirmar
                    </button>
                    <button
                        type="button"
                        onClick={() => void bulkAction('JUSTIFIED')}
                        disabled={acting}
                        className="flex items-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-[#0d1117] hover:bg-sky-400 disabled:opacity-50"
                    >
                        {acting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
                        Justificar falta
                    </button>
                    <button
                        type="button"
                        onClick={() => void bulkAction('REJECTED')}
                        disabled={acting}
                        className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                        {acting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                        Rechazar
                    </button>
                </div>
            )}

            <ul className="max-h-[480px] divide-y divide-edge overflow-y-auto">
                {records.map((record) => {
                    const isConfirmed = record.status === 'CONFIRMED'
                    const isPending = record.status === 'PENDING'
                    const isJustified = record.status === 'JUSTIFIED'
                    return (
                        <li key={record.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-3/40">
                            <input
                                type="checkbox"
                                checked={selected.has(record.id)}
                                disabled={!isPending}
                                onChange={() => toggle(record.id)}
                                className="size-4 shrink-0 accent-cyan-500"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink">{record.student.firstName} {record.student.lastName}</p>
                                <p className="truncate text-xs text-ink-3">
                                    {formatter.format(new Date(record.date))}
                                    {record.className ? ` · ${record.className}` : ''}
                                    {record.student.planName ? ` · ${record.student.planName}` : ''}
                                </p>
                            </div>
                            <div className="hidden text-right text-xs text-ink-3 sm:block">
                                <p>{record.hoursTrained} h</p>
                                <p>{record.sessionType ?? 'class'}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    isConfirmed
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-ok-text'
                                        : isJustified
                                            ? 'border-sky-500/30 bg-sky-500/10 text-info-text'
                                            : isPending
                                                ? 'border-amber-500/30 bg-amber-500/10 text-warn-text'
                                                : 'border-rose-500/30 bg-rose-500/10 text-danger-text'
                                }`}>
                                    {isPending ? 'Pendiente' : isJustified ? 'Justificada' : isConfirmed ? 'Confirmada' : 'Rechazada'}
                                </span>
                                {record.isOutOfSchedule && record.status !== 'REJECTED' && (
                                    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-warn-text">
                                        Fuera de horario
                                    </span>
                                )}
                            </div>
                        </li>
                    )
                })}
                {!loading && records.length === 0 && (
                    <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-ink-4">
                        <Clock3 className="size-6" aria-hidden="true" />
                        <p className="text-sm">No hay asistencias para revisar con estos filtros.</p>
                    </li>
                )}
                {loading && (
                    <li className="flex justify-center px-4 py-12">
                        <Loader2 className="size-6 animate-spin text-ink-4" aria-hidden="true" />
                    </li>
                )}
            </ul>
        </section>
    )
}