import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { DashboardBeltRank } from '@/types/dashboard'

interface MartialGradeCardProps {
    rank: DashboardBeltRank | null
    studentName: string
    approvedTechniques: number
    totalTechniques: number
}

export function MartialGradeCard({ rank, studentName, approvedTechniques, totalTechniques }: MartialGradeCardProps) {
    const progress = totalTechniques === 0 ? 0 : Math.round((approvedTechniques / totalTechniques) * 100)

    return (
        <section className="relative overflow-hidden rounded-xl border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-9 -right-4 font-display text-[9rem] font-black leading-none text-white opacity-[0.04]">級</span>
            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Grado actual</p>
                        <h2 className="mt-1 font-display text-2xl font-black text-white">{rank?.name ?? 'Sin grado asignado'}</h2>
                    </div>
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-extrabold text-cyan-200">{progress}% avance</span>
                </div>

                <div className="mt-5 rounded-md border border-neutral-700 bg-[#0d1117] p-1.5 shadow-inner">
                    <div className="relative flex h-10 items-center justify-between overflow-hidden rounded-sm bg-[#5a3825] px-4 shadow-sm">
                        <span aria-hidden="true" className="absolute inset-x-0 top-1.5 h-px bg-[#3f2518]" />
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 h-px bg-[#3f2518]" />
                        <span className="relative text-[10px] font-extrabold uppercase tracking-widest text-[#eee49f]">当世具足 · {studentName}</span>
                        <span aria-hidden="true" className="relative h-6 w-1.5 rounded-sm bg-[#dc2626]" />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-neutral-200">{approvedTechniques} de {totalTechniques} técnicas aprobadas</span>
                    <Link className="inline-flex shrink-0 items-center gap-0.5 font-bold text-cyan-300 hover:underline" href="/dashboard/estudiante/progreso">Ver progreso <ChevronRight aria-hidden="true" className="size-4" /></Link>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0d1117] p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
        </section>
    )
}