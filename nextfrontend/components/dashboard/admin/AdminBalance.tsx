'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Download, Filter, Search } from 'lucide-react'
import type { AdminBalanceRow, BalanceLevel } from '@/types/dashboard'

interface AdminBalanceProps {
    rows: AdminBalanceRow[]
}

const LEVEL_META: Record<BalanceLevel, { label: string; className: string }> = {
    OK: { label: 'En rango', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
    LOW: { label: 'Contactar', className: 'border-rose-500/30 bg-rose-500/10 text-rose-200' },
    HIGH: { label: 'Plan superior', className: 'border-amber-500/30 bg-amber-500/10 text-amber-200' },
    VERY_HIGH: { label: 'Revisar', className: 'border-purple-500/30 bg-purple-500/10 text-purple-200' },
}

const SCHOLARSHIP_LABELS: Record<string, string> = {
    NONE: '',
    ECONOMIC: 'Beca económica',
    MERIT: 'Beca por mérito',
    COMPETITOR: 'Beca competidor',
}

export function AdminBalance({ rows }: AdminBalanceProps) {
    const [search, setSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState<'ALL' | BalanceLevel>('ALL')
    const [onlyAlerts, setOnlyAlerts] = useState(false)
    const [onlyOutOfSchedule, setOnlyOutOfSchedule] = useState(false)

    const normalizedSearch = search.trim().toLocaleLowerCase('es')
    const filtered = rows.filter((row) => {
        const matchesSearch =
            !normalizedSearch ||
            `${row.studentName} ${row.memberNumber ?? ''} ${row.planName ?? ''}`.toLocaleLowerCase('es').includes(normalizedSearch)
        const matchesLevel = levelFilter === 'ALL' || row.balanceLevel === levelFilter
        const matchesAlert = !onlyAlerts || row.balanceAlert
        const matchesOut = !onlyOutOfSchedule || row.outOfScheduleCount > 0
        return matchesSearch && matchesLevel && matchesAlert && matchesOut
    })

    function exportCsv() {
        const header = ['Alumno', 'Matrícula', 'Grado', 'Plan', 'Horas plan', 'Horas entrenadas', 'Diferencia', 'Estado', 'Alerta', 'Aviso', 'Fuera de horario', 'Beca']
        const lines = filtered.map((row) => [
            row.studentName.replaceAll(',', ' '),
            row.memberNumber ?? '',
            row.currentRank ?? '',
            row.planName ?? 'Sin plan',
            row.isUnlimited ? '∞' : String(row.planMonthlyHours ?? ''),
            String(row.confirmedHours),
            row.balanceDiff == null ? '' : String(row.balanceDiff),
            LEVEL_META[row.balanceLevel].label,
            row.balanceAlert ? 'Sí' : '',
            row.isCompetitor ? 'Competidor' : '',
            String(row.outOfScheduleCount),
            SCHOLARSHIP_LABELS[row.scholarshipType] ?? '',
        ].map((cell) => `"${cell}"`).join(','))
        const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'balance-horas.csv'
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const alertCount = rows.filter((row) => row.balanceAlert).length
    const outOfScheduleCount = rows.filter((row) => row.outOfScheduleCount > 0).length

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
                    <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Balance de horas</h1>
                    <p className="mt-2 max-w-xl text-sm text-neutral-400">
                        Horas confirmadas del mes natural frente a las horas del plan de cada alumno.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={exportCsv}
                    className="flex items-center gap-2 rounded-md border border-neutral-700 bg-[#161b22] px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
                >
                    <Download className="size-4" aria-hidden="true" />
                    Exportar CSV
                </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-[#161b22] p-3">
                <div className="relative min-w-52 flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por alumno, matrícula o plan..."
                        className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500"
                    />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Filter className="size-3.5" aria-hidden="true" />
                    Estado
                    <select
                        value={levelFilter}
                        onChange={(event) => setLevelFilter(event.target.value as 'ALL' | BalanceLevel)}
                        className="rounded-md border border-neutral-700 bg-[#0d1117] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                    >
                        <option value="ALL">Todos</option>
                        <option value="OK">En rango</option>
                        <option value="LOW">Contactar</option>
                        <option value="HIGH">Plan superior</option>
                        <option value="VERY_HIGH">Revisar</option>
                    </select>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-300">
                    <input
                        type="checkbox"
                        checked={onlyAlerts}
                        onChange={(event) => setOnlyAlerts(event.target.checked)}
                        className="size-3.5 accent-cyan-500"
                    />
                    Solo alertas ({alertCount})
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-300">
                    <input
                        type="checkbox"
                        checked={onlyOutOfSchedule}
                        onChange={(event) => setOnlyOutOfSchedule(event.target.checked)}
                        className="size-3.5 accent-cyan-500"
                    />
                    Con fuera de horario ({outOfScheduleCount})
                </label>
            </div>

            <section className="mt-5 overflow-x-auto rounded-lg border border-neutral-800 bg-[#161b22]">
                <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-neutral-500">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Alumno</th>
                            <th className="px-4 py-3 font-semibold">Plan</th>
                            <th className="px-4 py-3 text-right font-semibold">Horas plan</th>
                            <th className="px-4 py-3 text-right font-semibold">Horas reales</th>
                            <th className="px-4 py-3 text-right font-semibold">Δ</th>
                            <th className="px-4 py-3 font-semibold">Estado</th>
                            <th className="px-4 py-3 text-center font-semibold">Fuera</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {filtered.map((row) => (
                            <tr key={row.studentId} className="hover:bg-neutral-800/40">
                                <td className="px-4 py-3">
                                    <Link href={`/dashboard/admin/alumnos/${row.studentId}`} className="font-medium text-white hover:text-cyan-400">
                                        {row.studentName}
                                    </Link>
                                    <div className="text-xs text-neutral-500">
                                        {row.currentRank ?? 'Sin grado'}
                                        {row.scholarshipType !== 'NONE' && ` · ${SCHOLARSHIP_LABELS[row.scholarshipType]}`}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                    {row.planName ?? <span className="text-amber-400">Asignar plan</span>}
                                    {row.isCompetitor && <span className="ml-1.5 rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-200">Competidor</span>}
                                </td>
                                <td className="px-4 py-3 text-right text-neutral-300">{row.isUnlimited ? '∞' : row.planMonthlyHours}</td>
                                <td className="px-4 py-3 text-right font-semibold text-white">{row.confirmedHours}</td>
                                <td className="px-4 py-3 text-right text-neutral-300">
                                    {row.balanceDiff == null ? '—' : `${row.balanceDiff > 0 ? '+' : ''}${row.balanceDiff}`}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${LEVEL_META[row.balanceLevel].className}`}>
                                        {LEVEL_META[row.balanceLevel].label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {row.outOfScheduleCount > 0 ? (
                                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200">
                                            {row.outOfScheduleCount}x
                                        </span>
                                    ) : (
                                        <span className="text-neutral-600">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">Sin resultados con los filtros aplicados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </main>
    )
}