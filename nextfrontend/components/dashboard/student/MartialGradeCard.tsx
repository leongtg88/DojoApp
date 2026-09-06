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
        <section className="relative overflow-hidden rounded-xl border border-[#e5e2e1] bg-[#ebe7e7] p-5 shadow-sm">
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-9 -right-4 font-display text-[9rem] font-black leading-none text-[#1c1b1b] opacity-[0.04]">級</span>
            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#666028]">Grado actual</p>
                        <h2 className="mt-1 font-display text-2xl font-black text-[#1c1b1b]">{rank?.name ?? 'Sin grado asignado'}</h2>
                    </div>
                    <span className="rounded-full border border-[#e5e2e1] bg-white px-2.5 py-1 text-xs font-extrabold text-[#b70011]">{progress}% avance</span>
                </div>

                <div className="mt-5 rounded-md border border-[#e5e2e1] bg-white p-1.5 shadow-inner">
                    <div className="relative flex h-10 items-center justify-between overflow-hidden rounded-sm bg-[#5a3825] px-4 shadow-sm">
                        <span aria-hidden="true" className="absolute inset-x-0 top-1.5 h-px bg-[#3f2518]" />
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 h-px bg-[#3f2518]" />
                        <span className="relative text-[10px] font-extrabold uppercase tracking-widest text-[#eee49f]">当世具足 · {studentName}</span>
                        <span aria-hidden="true" className="relative h-6 w-1.5 rounded-sm bg-[#dc2626]" />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-[#1c1b1b]">{approvedTechniques} de {totalTechniques} técnicas aprobadas</span>
                    <Link className="inline-flex shrink-0 items-center gap-0.5 font-bold text-[#dc2626] hover:underline" href="/dashboard/estudiante/progreso">Ver progreso <ChevronRight aria-hidden="true" className="size-4" /></Link>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e2e1] p-0.5"><div className="h-full rounded-full bg-[#dc2626] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
        </section>
    )
}