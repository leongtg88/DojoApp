'use client'

import { useState } from 'react'
import { Award, CheckCheck, CircleDashed, Info, Search, Star } from 'lucide-react'
import type { StudentTechnique, TechniqueCategory } from '@/types/dashboard'

interface StudentSyllabusProps {
    techniques: StudentTechnique[]
}

const categories: { id: TechniqueCategory; label: string; accent: string }[] = [
    { id: 'KIHON', label: 'Kihon', accent: 'bg-[#00617f]' },
    { id: 'KATA', label: 'Kata', accent: 'bg-[#666028]' },
    { id: 'KUMITE', label: 'Kumite', accent: 'bg-[#dc2626]' },
    { id: 'BUNKAI', label: 'Bunkai', accent: 'bg-[#b8b070]' },
]

export function StudentSyllabus({ techniques }: StudentSyllabusProps) {
    const [activeCategory, setActiveCategory] = useState<TechniqueCategory | 'ALL'>('ALL')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const categoryTechniques = activeCategory === 'ALL'
        ? techniques
        : techniques.filter(({ category }) => category === activeCategory)
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const filteredTechniques = categoryTechniques.filter((technique) => {
        const matchesStatus = statusFilter === 'ALL' || technique.status === statusFilter
        const matchesSearch = !normalizedSearch || [technique.name, technique.description ?? '']
            .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))
        return matchesStatus && matchesSearch
    })
    const approvedCount = techniques.filter(({ status }) => status === 'APPROVED').length

    return (
        <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Syllabus marcial</p>
                    <h2 className="mt-1 font-display text-xl font-bold text-white">Técnicas asignadas</h2>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{techniques.length} técnicas</p>
            </div>

            <div aria-label="Filtrar técnicas por categoría" className="mt-4 flex gap-2 overflow-x-auto pb-1">
                <button
                    aria-pressed={activeCategory === 'ALL'}
                    className={`shrink-0 rounded-md border px-3.5 py-1.5 text-xs font-bold transition-colors ${activeCategory === 'ALL' ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : 'border-neutral-700 bg-[#161b22] text-neutral-400 hover:border-neutral-500'}`}
                    onClick={() => setActiveCategory('ALL')}
                    type="button"
                >
                    Todas ({techniques.length})
                </button>
                {categories.map(({ id, label }) => {
                    const count = techniques.filter(({ category }) => category === id).length
                    const isActive = activeCategory === id

                    return (
                        <button
                            aria-pressed={isActive}
                            className={`shrink-0 rounded-md border px-3.5 py-1.5 text-xs font-bold transition-colors ${isActive ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : 'border-neutral-700 bg-[#161b22] text-neutral-400 hover:border-neutral-500'}`}
                            key={id}
                            onClick={() => setActiveCategory(id)}
                            type="button"
                        >
                            {label} ({count})
                        </button>
                    )
                })}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div aria-label="Filtrar técnicas por estado" className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {([['ALL', 'Todas', techniques.length], ['PENDING', 'Pendientes', techniques.length - approvedCount], ['APPROVED', 'Aprobadas', approvedCount]] as const).map(([status, label, count]) => <button aria-pressed={statusFilter === status} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === status ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100' : 'border-neutral-700 bg-[#161b22] text-neutral-400 hover:border-neutral-500'}`} key={status} onClick={() => setStatusFilter(status)} type="button">{label} ({count})</button>)}
                </div>
                <label className="relative block sm:w-60" htmlFor="student-technique-search">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-cyan-400" />
                    <input className="w-full rounded-md border border-neutral-700 bg-[#161b22] py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="student-technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar kata o técnica" type="search" value={searchTerm} />
                </label>
            </div>

            {filteredTechniques.length === 0 ? (
                <div className="mt-4 border border-dashed border-[#d5d0ce] bg-white px-5 py-10 text-center">
                    <Award aria-hidden="true" className="mx-auto size-8 text-[#a1918e]" />
                    <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No hay técnicas en esta categoría</p>
                    <p className="mt-1 text-sm text-[#5c403c]">Prueba con otra categoría, estado o término de búsqueda.</p>
                </div>
            ) : (
                <ul className="mt-4 space-y-3">
                    {filteredTechniques.map((technique) => {
                        const category = categories.find(({ id }) => id === technique.category)
                        const approved = technique.status === 'APPROVED'

                        return (
                            <li className="border border-[#e5e2e1] bg-white p-4 shadow-sm" key={technique.id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 gap-3">
                                        <span aria-hidden="true" className={`mt-0.5 h-10 w-1 shrink-0 ${category?.accent ?? 'bg-[#a1918e]'}`} />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#666028]">{category?.label ?? technique.category}</p>
                                            <h3 className="mt-1 text-base font-bold text-[#1c1b1b]">{technique.name}</h3>
                                        </div>
                                    </div>
                                    <span className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1 text-[11px] font-bold ${approved ? 'bg-[#e6f1d8] text-[#426020]' : 'bg-[#e5e2e1] text-[#5c403c]'}`}>
                                        {approved ? <CheckCheck aria-hidden="true" className="size-3.5" /> : <CircleDashed aria-hidden="true" className="size-3.5" />}
                                        {approved ? 'Aprobada' : 'Pendiente'}
                                    </span>
                                </div>
                                {technique.description && <p className="mt-3 pl-4 text-sm leading-6 text-[#5c403c]">{technique.description}</p>}
                                {technique.notes && <p className="mt-3 flex items-start gap-2 border border-[#e5e2e1] bg-[#f6f3f2] p-2.5 text-xs leading-5 text-[#1c1b1b]"><Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[#b70011]" />{technique.notes}</p>}
                                {technique.evaluation && <div className="mt-3 flex items-start gap-2 border border-[#cee2b7] bg-[#f6faef] p-2.5 text-xs leading-5 text-[#426020]"><Star aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /><div><p className="font-bold">Evaluación: {technique.evaluation.score} / 10</p>{technique.evaluation.feedback && <p className="mt-1">{technique.evaluation.feedback}</p>}<p className="mt-1 text-[#5b7f38]">{new Date(technique.evaluation.evaluatedAt).toLocaleDateString('es-DO')}{technique.evaluation.evaluatorName ? ` · ${technique.evaluation.evaluatorName}` : ''}</p></div></div>}
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}