'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck2, CircleX, Clock3, Loader2, Repeat, Search, ShieldCheck, Users, X } from 'lucide-react'
import type { AdminAttendanceBranch, AdminAttendanceItem, AttendanceStatus } from '@/types/dashboard'

const STATUS_META: Record<AttendanceStatus, { label: string; className: string }> = {
    PENDING: { label: 'Pendiente', className: 'border-amber-500/30 bg-amber-500/10 text-warn-text' },
    CONFIRMED: { label: 'Confirmada', className: 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' },
    REJECTED: { label: 'Rechazada', className: 'border-rose-500/30 bg-rose-500/10 text-danger-text' },
    JUSTIFIED: { label: 'Justificada', className: 'border-sky-500/30 bg-sky-500/10 text-info-text' },
}

const SESSION_TYPE_LABELS: Record<string, string> = {
    class: 'Clase',
    private: 'Clase privada',
    autonomous: 'Entrenamiento libre',
    seminar: 'Seminario',
    other: 'Otro',
}

const formatter = new Intl.DateTimeFormat('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
})

export function AdminAttendanceView() {
    const [records, setRecords] = useState<AdminAttendanceItem[]>([])
    const [branches, setBranches] = useState<AdminAttendanceBranch[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [date, setDate] = useState('')
    const [status, setStatus] = useState<'all' | AttendanceStatus>('PENDING')
    const [present, setPresent] = useState<'all' | 'present' | 'absent'>('all')
    const [branch, setBranch] = useState('all')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [acting, setActing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(id)
    }, [query])

    useEffect(() => {
        let cancelled = false
        const params = new URLSearchParams()
        params.set('status', status)
        if (date) params.set('date', date)
        if (present !== 'all') params.set('present', present)
        if (branch !== 'all') params.set('branch', branch)
        if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim())

        fetch(`/api/dashboard/admin/attendance?${params.toString()}`)
            .then(async (response) => {
                const data = await response.json().catch(() => null)
                if (!response.ok) throw new Error(data?.error ?? 'No se pudieron cargar las asistencias')
                if (cancelled) return
                setRecords(data.records ?? [])
                setBranches(data.branches ?? [])
                setSelected(new Set())
                setError(null)
            })
            .catch((cause: Error) => {
                if (cancelled) return
                setError(cause.message === 'Failed to fetch' ? 'Error al cargar' : cause.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [date, status, present, branch, debouncedQuery, refreshKey])

    const hasActiveFilters = Boolean(date) || status !== 'PENDING' || present !== 'all' || branch !== 'all' || query.trim().length > 0

    function clearFilters() {
        setQuery('')
        setDebouncedQuery('')
        setDate('')
        setStatus('PENDING')
        setPresent('all')
        setBranch('all')
    }

    function toggle(id: string) {
        setSelected((current) => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    async function bulkAction(action: 'CONFIRMED' | 'REJECTED' | 'JUSTIFIED') {
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

    return (
        <>
            <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-edge p-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">Registros de asistencia</p>
                        <p className="mt-0.5 text-xs text-ink-3">
                            {loading ? 'Cargando…' : `${records.length} registro${records.length === 1 ? '' : 's'}`}
                            {hasActiveFilters ? ' con filtros aplicados' : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((open) => !open)}
                        aria-expanded={filtersOpen}
                        aria-controls="attendance-filters"
                        aria-label={filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                        className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-edge-strong bg-surface-1 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                        <Search aria-hidden="true" className="size-5" />
                        {hasActiveFilters && <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-cyan-400" />}
                    </button>
                </div>

                {filtersOpen && (
                    <div className="grid gap-3 border-b border-edge p-4 sm:p-5" id="attendance-filters">
                        <label className="block text-xs font-semibold text-ink-2" htmlFor="attendance-search">Buscar
                            <span className="relative mt-1 block">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                                <input className="w-full rounded-md border border-edge-strong bg-surface-1 py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="attendance-search" onChange={(event) => setQuery(event.target.value)} placeholder="Alumno, clase o nota" type="search" value={query} />
                            </span>
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-date">Fecha
                                <input className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500" id="attendance-date" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
                            </label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-presence">Presencia
                                <select className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500" id="attendance-presence" onChange={(event) => setPresent(event.target.value as typeof present)} value={present}>
                                    <option value="all">Todas</option>
                                    <option value="present">Presentes</option>
                                    <option value="absent">Ausentes</option>
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-status">Estado
                                <select className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500" id="attendance-status" onChange={(event) => setStatus(event.target.value as typeof status)} value={status}>
                                    <option value="all">Todos</option>
                                    <option value="PENDING">Pendientes</option>
                                    <option value="CONFIRMED">Confirmadas</option>
                                    <option value="REJECTED">Rechazadas</option>
                                    <option value="JUSTIFIED">Justificadas</option>
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-branch">Sucursal
                                <select className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500" id="attendance-branch" onChange={(event) => setBranch(event.target.value)} value={branch}>
                                    <option value="all">Todas</option>
                                    {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            {hasActiveFilters && (
                                <button type="button" onClick={clearFilters} className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3">Limpiar filtros</button>
                            )}
                        </div>
                    </div>
                )}

                {error && <p className="border-b border-edge px-4 py-3 text-sm text-danger-text">{error}</p>}

                {selected.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-3">
                        <span className="text-xs text-ink-3">{selected.size} seleccionados</span>
                        <button type="button" onClick={() => void bulkAction('CONFIRMED')} disabled={acting} className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50">
                            {acting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
                            Confirmar
                        </button>
                        <button type="button" onClick={() => void bulkAction('JUSTIFIED')} disabled={acting} className="flex items-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-[#0d1117] hover:bg-sky-400 disabled:opacity-50">
                            {acting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
                            Justificar falta
                        </button>
                        <button type="button" onClick={() => void bulkAction('REJECTED')} disabled={acting} className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                            {acting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                            Rechazar
                        </button>
                    </div>
                )}

                <ul className="divide-y divide-edge">
                    {records.map((record) => {
                        const statusMeta = STATUS_META[record.status]
                        const isPending = record.status === 'PENDING'
                        return (
                            <li key={record.id} className="flex items-start gap-3 px-4 py-4 hover:bg-surface-3/40">
                                <input type="checkbox" checked={selected.has(record.id)} disabled={!isPending} onChange={() => toggle(record.id)} className="mt-1 size-4 shrink-0 accent-cyan-500" />
                                <div className="flex min-w-0 flex-1 gap-3">
                                    {record.present ? <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok-text" /> : <CircleX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-text" />}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{record.student.firstName} {record.student.lastName}</p>
                                        <p className="mt-1 text-xs text-ink-3">{formatter.format(new Date(record.date))} · {record.className ?? SESSION_TYPE_LABELS[record.sessionType ?? 'autonomous'] ?? 'Entrenamiento libre'} · {record.branchName ?? 'Sin sucursal'}{record.student.planName ? ` · ${record.student.planName}` : ''}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {record.hoursTrained > 0 && <span className="inline-flex items-center gap-1 rounded-md border border-edge-strong bg-surface-1 px-2 py-0.5 text-[11px] font-semibold text-ink-2"><Clock3 aria-hidden="true" className="size-3 text-accent" />{record.hoursTrained}h</span>}
                                            {record.confirmedByName && <span className="text-[11px] text-ink-4">Confirmado por {record.confirmedByName}</span>}
                                            {record.isOutOfSchedule && record.status !== 'REJECTED' && <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-warn-text">Fuera de horario</span>}
                                        </div>
                                        {record.practiceLogs.length > 0 && (
                                            <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-ink-3">
                                                <Repeat aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
                                                {record.practiceLogs.map((log) => `${log.techniqueName} ×${log.repetitions}${log.place === 'FUERA' ? ' (fuera)' : ''}`).join(' · ')}
                                            </p>
                                        )}
                                        {record.notes && <p className="mt-2 rounded-md border border-edge-strong bg-surface-1 p-2 text-sm text-ink-2">{record.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${record.present ? 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' : 'border-rose-500/30 bg-rose-500/10 text-danger-text'}`}>{record.present ? 'Presente' : 'Ausente'}</span>
                                </div>
                            </li>
                        )
                    })}
                    {!loading && records.length === 0 && (
                        <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-ink-4">
                            <Users className="size-6" aria-hidden="true" />
                            <p className="text-sm">No hay asistencias con estos filtros.</p>
                        </li>
                    )}
                    {loading && (
                        <li className="flex justify-center px-4 py-12">
                            <Loader2 className="size-6 animate-spin text-ink-4" aria-hidden="true" />
                        </li>
                    )}
                </ul>
            </section>
        </>
    )
}
