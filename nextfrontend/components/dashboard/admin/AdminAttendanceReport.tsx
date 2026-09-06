'use client'

import { useState } from 'react'
import { CalendarCheck2, CircleX, Search, Users } from 'lucide-react'
import type { AdminAttendanceRecord } from '@/types/dashboard'

interface AdminAttendanceReportProps {
    records: AdminAttendanceRecord[]
}

export function AdminAttendanceReport({ records }: AdminAttendanceReportProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL')
    const [branchFilter, setBranchFilter] = useState('ALL')
    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const branches = [...new Set(records.map(({ branchName }) => branchName))].sort()
    const presentCount = records.filter(({ present }) => present).length
    const filteredRecords = records.filter((record) => {
        const matchesStatus = attendanceFilter === 'ALL'
            || (attendanceFilter === 'PRESENT' && record.present)
            || (attendanceFilter === 'ABSENT' && !record.present)
        const matchesBranch = branchFilter === 'ALL' || record.branchName === branchFilter
        const matchesSearch = !normalizedSearch || [record.studentName, record.className, record.branchName, record.notes ?? '']
            .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))

        return matchesStatus && matchesBranch && matchesSearch
    })

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Asistencia global</h1>
            <p className="mt-2 text-sm text-neutral-400">Últimos 100 registros de asistencia dentro del alcance de tu escuela.</p>
            {records.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center"><Users aria-hidden="true" className="mx-auto size-7 text-cyan-400" /><p className="mt-3 text-sm font-semibold text-white">No hay asistencias registradas.</p></section>
            ) : (
                <>
                    <section className="mt-7 grid gap-3 sm:grid-cols-3"><article className="rounded-lg border border-neutral-800 bg-[#161b22] p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Registros auditados</p><p className="mt-1 text-2xl font-bold text-white">{records.length}</p></article><article className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Presencias</p><p className="mt-1 text-2xl font-bold text-emerald-200">{presentCount}</p></article><article className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-rose-200">Ausencias</p><p className="mt-1 text-2xl font-bold text-rose-200">{records.length - presentCount}</p></article></section>
                    <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                        <div className="grid gap-3 border-b border-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:p-5">
                            <label className="relative block" htmlFor="attendance-search"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-400" /><input className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="attendance-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar alumno, clase o nota" type="search" value={searchTerm} /></label>
                            <label className="text-xs font-semibold text-neutral-300" htmlFor="attendance-status">Estado<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="attendance-status" onChange={(event) => setAttendanceFilter(event.target.value as typeof attendanceFilter)} value={attendanceFilter}><option value="ALL">Todos</option><option value="PRESENT">Presentes</option><option value="ABSENT">Ausentes</option></select></label>
                            <label className="text-xs font-semibold text-neutral-300" htmlFor="attendance-branch">Sucursal<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="attendance-branch" onChange={(event) => setBranchFilter(event.target.value)} value={branchFilter}><option value="ALL">Todas</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></label>
                        </div>
                        {filteredRecords.length === 0 ? <div className="px-5 py-10 text-center"><Users aria-hidden="true" className="mx-auto size-6 text-cyan-400" /><p className="mt-3 text-sm font-semibold text-white">No hay registros con esos filtros.</p></div> : <ul className="divide-y divide-neutral-800">
                            {filteredRecords.map((record) => (
                                <li className="flex items-start justify-between gap-4 px-5 py-4" key={record.id}>
                                    <div className="flex min-w-0 gap-3">
                                        {record.present ? <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-400" /> : <CircleX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-400" />}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-white">{record.studentName}</p>
                                            <p className="mt-1 text-xs text-neutral-400">{record.className} · {record.branchName} · {formatter.format(new Date(record.date))}</p>
                                            {record.notes && <p className="mt-2 rounded-md border border-neutral-700 bg-[#0d1117] p-2 text-sm text-neutral-300">{record.notes}</p>}
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${record.present ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>{record.present ? 'Presente' : 'Ausente'}</span>
                                </li>
                            ))}
                        </ul>}
                    </section>
                </>
            )}
        </main>
    )
}