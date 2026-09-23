'use client'

import { useState } from 'react'
import { CalendarCheck2, CircleX, Clock3, Repeat, Search, Users } from 'lucide-react'
import type { AdminAttendanceRecord, AttendanceStatus } from '@/types/dashboard'

interface AdminAttendanceReportProps {
    records: AdminAttendanceRecord[]
}

const STATUS_META: Record<AttendanceStatus, { label: string; className: string }> = {
    PENDING: { label: 'Punch-in pendiente', className: 'border-amber-500/30 bg-amber-500/10 text-warn-text' },
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

export function AdminAttendanceReport({ records }: AdminAttendanceReportProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL')
    const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL')
    const [branchFilter, setBranchFilter] = useState('ALL')
    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const branches = [...new Set(records.map(({ branchName }) => branchName ?? 'Punch-in'))].sort()
    const presentCount = records.filter(({ present }) => present).length
    const totalHours = records.reduce((total, record) => total + (record.hoursTrained ?? 0), 0)
    const filteredRecords = records.filter((record) => {
        const matchesStatus = attendanceFilter === 'ALL'
            || (attendanceFilter === 'PRESENT' && record.present)
            || (attendanceFilter === 'ABSENT' && !record.present)
        const matchesState = statusFilter === 'ALL' || record.status === statusFilter
        const matchesBranch = branchFilter === 'ALL' || record.branchName === branchFilter
        const matchesSearch = !normalizedSearch || [record.studentName, record.className ?? '', record.branchName ?? '', record.notes ?? '']
            .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))

        return matchesStatus && matchesState && matchesBranch && matchesSearch
    })

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Asistencia global</h1>
            <p className="mt-2 text-sm text-ink-3">Últimos 100 registros de asistencia dentro del alcance de tu escuela.</p>
            {records.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center"><Users aria-hidden="true" className="mx-auto size-7 text-accent" /><p className="mt-3 text-sm font-semibold text-ink">No hay asistencias registradas.</p></section>
            ) : (
                <>
                    <section className="mt-7 grid gap-3 sm:grid-cols-4">
                        <article className="rounded-lg border border-edge bg-surface-2 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Registros auditados</p><p className="mt-1 text-2xl font-bold text-ink">{records.length}</p></article>
                        <article className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ok-text">Presencias</p><p className="mt-1 text-2xl font-bold text-ok-text">{presentCount}</p></article>
                        <article className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-danger-text">Ausencias</p><p className="mt-1 text-2xl font-bold text-danger-text">{records.length - presentCount}</p></article>
                        <article className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-accent-text">Horas entrenadas</p><p className="mt-1 text-2xl font-bold text-accent-text">{totalHours.toFixed(1)}h</p></article>
                    </section>
                    <section className="mt-5 rounded-lg border border-edge bg-surface-2 shadow-sm">
                        <div className="grid gap-3 border-b border-edge p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:p-5">
                            <label className="relative block" htmlFor="attendance-search"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" /><input className="w-full rounded-md border border-edge-strong bg-surface-1 py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="attendance-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar alumno, clase o nota" type="search" value={searchTerm} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-attendance">Presencia<select className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="attendance-attendance" onChange={(event) => setAttendanceFilter(event.target.value as typeof attendanceFilter)} value={attendanceFilter}><option value="ALL">Todos</option><option value="PRESENT">Presentes</option><option value="ABSENT">Ausentes</option></select></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-status">Estado<select className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="attendance-status" onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} value={statusFilter}><option value="ALL">Todos</option><option value="PENDING">Punch-in pendiente</option><option value="CONFIRMED">Confirmadas</option><option value="REJECTED">Rechazadas</option></select></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="attendance-branch">Sucursal<select className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="attendance-branch" onChange={(event) => setBranchFilter(event.target.value)} value={branchFilter}><option value="ALL">Todas</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></label>
                        </div>
                        {filteredRecords.length === 0 ? <div className="px-5 py-10 text-center"><Users aria-hidden="true" className="mx-auto size-6 text-accent" /><p className="mt-3 text-sm font-semibold text-ink">No hay registros con esos filtros.</p></div> : <ul className="divide-y divide-edge">
                            {filteredRecords.map((record) => {
                                const statusMeta = STATUS_META[record.status]
                                return (
                                    <li className="flex items-start justify-between gap-4 px-5 py-4" key={record.id}>
                                        <div className="flex min-w-0 gap-3">
                                            {record.present ? <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok-text" /> : <CircleX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-text" />}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-ink">{record.studentName}</p>
                                                <p className="mt-1 text-xs text-ink-3">{record.className ?? SESSION_TYPE_LABELS[record.sessionType ?? 'autonomous'] ?? 'Entrenamiento libre'} · {record.branchName ?? 'Sin sucursal'} · {formatter.format(new Date(record.date))}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    {record.hoursTrained > 0 && <span className="inline-flex items-center gap-1 rounded-md border border-edge-strong bg-surface-1 px-2 py-0.5 text-[11px] font-semibold text-ink-2"><Clock3 aria-hidden="true" className="size-3 text-accent" />{record.hoursTrained}h</span>}
                                                    {record.confirmedByName && <span className="text-[11px] text-ink-4">Confirmado por {record.confirmedByName}</span>}
                                                </div>
                                                {record.practiceLogs && record.practiceLogs.length > 0 && (
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
                        </ul>}
                    </section>
                </>
            )}
        </main>
    )
}