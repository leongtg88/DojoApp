'use client'

import { useState } from 'react'
import { BookOpen, ChevronRight, GraduationCap, ListChecks, Rows3 } from 'lucide-react'
import type { AdminBeltRankSummary } from '@/types/dashboard'

interface AdminCurriculumCatalogProps {
    ranks: AdminBeltRankSummary[]
}

export function AdminCurriculumCatalog({ ranks }: AdminCurriculumCatalogProps) {
    const [selectedRankId, setSelectedRankId] = useState(ranks[0]?.id ?? '')
    const selectedRank = ranks.find(({ id }) => id === selectedRankId) ?? ranks[0]
    const totalTechniques = ranks.reduce((total, rank) => total + rank.techniqueCount, 0)

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Grados y técnicas</h1>
            <p className="mt-2 text-sm text-neutral-400">Catálogo curricular configurado para tu escuela.</p>
            {ranks.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
                    <GraduationCap aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
                    <p className="mt-3 text-sm font-semibold text-white">No hay grados configurados.</p>
                </section>
            ) : (
                <>
                    <section className="mt-7 grid gap-3 sm:grid-cols-2">
                        <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm"><Rows3 aria-hidden="true" className="size-5 text-cyan-400" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Grados configurados</p><p className="mt-1 text-3xl font-bold text-white">{ranks.length}</p></article>
                        <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm"><BookOpen aria-hidden="true" className="size-5 text-emerald-400" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Técnicas asociadas</p><p className="mt-1 text-3xl font-bold text-white">{totalTechniques}</p></article>
                    </section>

                    <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Escalafón curricular</p>
                        <div aria-label="Seleccionar grado" className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {ranks.map((rank) => {
                                const isSelected = rank.id === selectedRank?.id
                                return <button aria-pressed={isSelected} className={`shrink-0 rounded-md border px-3 py-2 text-left text-xs font-bold transition-colors ${isSelected ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : 'border-neutral-700 bg-[#0d1117] text-neutral-400 hover:border-neutral-500'}`} key={rank.id} onClick={() => setSelectedRankId(rank.id)} type="button"><span className="block text-[10px] uppercase tracking-wide opacity-75">Orden {rank.order}</span><span className="mt-0.5 block">{rank.name}</span></button>
                            })}
                        </div>
                    </section>

                    {selectedRank && <section className="mt-5 border border-[#e5e2e1] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span aria-hidden="true" className="flex size-12 items-center justify-center bg-[#5c403c] text-white"><GraduationCap className="size-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Grado seleccionado</p><h2 className="mt-1 font-display text-xl font-bold text-[#1c1b1b]">{selectedRank.name}</h2><p className="mt-1 text-sm text-[#5c403c]">Posición {selectedRank.order} dentro del escalafón.</p></div></div><span className="inline-flex w-fit items-center gap-2 border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2 text-sm font-bold text-[#5c403c]"><ListChecks aria-hidden="true" className="size-4 text-[#b70011]" />{selectedRank.techniqueCount} técnicas</span></div>{selectedRank.techniqueCount === 0 && <p className="mt-5 border border-dashed border-[#d8d1cf] bg-[#fffaf0] p-4 text-sm text-[#5c403c]">Este grado aún no tiene técnicas asociadas en el catálogo activo.</p>}<p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a7400]">La edición de grados y la asociación de técnicas se habilitarán cuando existan endpoints administrativos para esas operaciones.<ChevronRight aria-hidden="true" className="size-3.5" /></p></section>}
                </>
            )}
        </main>
    )
}