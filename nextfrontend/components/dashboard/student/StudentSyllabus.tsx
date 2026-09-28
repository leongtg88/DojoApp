'use client'

import { useState } from 'react'
import { Award, CheckCheck, CircleDashed, Info, Repeat, Search, Star } from 'lucide-react'
import { KIHON_CATEGORIES, KIHON_CATEGORY_LABELS, KIHON_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kihon-categories'
import { KUMITE_CATEGORIES, KUMITE_CATEGORY_LABELS, KUMITE_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kumite-categories'
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

const categoryById = new Map(categories.map(({ id, label, accent }) => [id, { label, accent }]))
const KIHON_ACCENT = 'bg-[#00617f]'
const KUMITE_ACCENT = 'bg-[#dc2626]'

interface SyllabusSection {
    key: string
    label: string
    accent: string
    items: StudentTechnique[]
}

/** Dentro de Kihon y Kumite agrupa por sub-categoría; el resto por categoría superior. */
function buildSections(techniques: StudentTechnique[]): SyllabusSection[] {
    const sections: SyllabusSection[] = []

    const kihon = techniques.filter(({ category }) => category === 'KIHON')
    for (const subCategory of KIHON_CATEGORIES) {
        const items = kihon.filter((technique) => technique.kihonCategory === subCategory)
        if (items.length > 0) {
            sections.push({ key: `KIHON:${subCategory}`, label: KIHON_CATEGORY_LABELS[subCategory], accent: KIHON_ACCENT, items })
        }
    }
    const uncategorized = kihon.filter((technique) => !technique.kihonCategory)
    if (uncategorized.length > 0) {
        sections.push({ key: 'KIHON:__none__', label: 'Kihon (sin categoría)', accent: KIHON_ACCENT, items: uncategorized })
    }

    const kumite = techniques.filter(({ category }) => category === 'KUMITE')
    for (const subCategory of KUMITE_CATEGORIES) {
        const items = kumite.filter((technique) => technique.kumiteCategory === subCategory)
        if (items.length > 0) {
            sections.push({ key: `KUMITE:${subCategory}`, label: KUMITE_CATEGORY_LABELS[subCategory], accent: KUMITE_ACCENT, items })
        }
    }
    const uncategorizedKumite = kumite.filter((technique) => !technique.kumiteCategory)
    if (uncategorizedKumite.length > 0) {
        sections.push({ key: 'KUMITE:__none__', label: 'Kumite (sin categoría)', accent: KUMITE_ACCENT, items: uncategorizedKumite })
    }

    for (const category of categories) {
        if (category.id === 'KIHON' || category.id === 'KUMITE') continue
        const items = techniques.filter((technique) => technique.category === category.id)
        if (items.length > 0) {
            sections.push({ key: category.id, label: category.label, accent: category.accent, items })
        }
    }

    return sections
}

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
    const sections = buildSections(filteredTechniques)

    return (
        <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Syllabus marcial</p>
                    <h2 className="mt-1 font-display text-xl font-bold text-ink">Técnicas asignadas</h2>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-3">{techniques.length} técnicas</p>
            </div>
            <p className="mt-2 px-1 text-xs text-ink-4">¿Falta una técnica? Pídele a tu sensei que la asigne a tu expediente para poder registrar sus repeticiones.</p>

            <div aria-label="Filtrar técnicas por categoría" className="mt-4 flex gap-2 overflow-x-auto pb-1">
                <button
                    aria-pressed={activeCategory === 'ALL'}
                    className={`shrink-0 rounded-md border px-3.5 py-1.5 text-xs font-bold transition-colors ${activeCategory === 'ALL' ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-2 text-ink-3 hover:border-edge-strong'}`}
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
                            className={`shrink-0 rounded-md border px-3.5 py-1.5 text-xs font-bold transition-colors ${isActive ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-2 text-ink-3 hover:border-edge-strong'}`}
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
                    {([['ALL', 'Todos los estados', techniques.length], ['PENDING', 'Pendientes', techniques.length - approvedCount], ['APPROVED', 'Revisadas', approvedCount]] as const).map(([status, label, count]) => <button aria-pressed={statusFilter === status} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === status ? 'border-emerald-500/50 bg-emerald-500/15 text-ok-text' : 'border-edge-strong bg-surface-2 text-ink-3 hover:border-edge-strong'}`} key={status} onClick={() => setStatusFilter(status)} type="button">{label} ({count})</button>)}
                </div>
                <label className="relative block sm:w-60" htmlFor="student-technique-search">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-accent" />
                    <input className="w-full rounded-md border border-edge-strong bg-surface-2 py-2 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="student-technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar kata o técnica" type="search" value={searchTerm} />
                </label>
            </div>

            {filteredTechniques.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center">
                    <Award aria-hidden="true" className="mx-auto size-8 text-ink-4" />
                    <p className="mt-3 text-sm font-semibold text-ink">No hay técnicas en esta categoría</p>
                    <p className="mt-1 text-sm text-ink-3">Prueba con otra categoría, estado o término de búsqueda.</p>
                </div>
            ) : (
                <div className="mt-4 space-y-6">
                    {sections.map((section) => (
                        <div key={section.key}>
                            <div className="flex items-center gap-2 px-1">
                                <span aria-hidden="true" className={`h-3 w-1 rounded-full ${section.accent}`} />
                                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-3">{section.label}</h3>
                                <span className="text-xs text-ink-4">{section.items.length}</span>
                            </div>
                            <ul className="mt-2 space-y-3">
                                {section.items.map((technique) => {
                                    const category = categoryById.get(technique.category)
                                    const categoryLabel = technique.category === 'KIHON' && technique.kihonCategory
                                        ? KIHON_CATEGORY_SHORT_LABELS[technique.kihonCategory]
                                        : technique.category === 'KUMITE' && technique.kumiteCategory
                                            ? KUMITE_CATEGORY_SHORT_LABELS[technique.kumiteCategory]
                                            : category?.label ?? technique.category
                                    const approved = technique.status === 'APPROVED'

                                    return (
                                        <li className="rounded-lg border border-edge bg-surface-2 p-4 shadow-sm" key={technique.id}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 gap-3">
                                                    <span aria-hidden="true" className={`mt-0.5 h-10 w-1 shrink-0 rounded-full ${category?.accent ?? 'bg-neutral-600'}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold uppercase tracking-wide text-accent">{categoryLabel}</p>
                                                        <h3 className="mt-1 text-base font-bold text-ink">{technique.name}</h3>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold ${approved ? 'border-emerald-500/40 bg-emerald-500/15 text-ok-text' : 'border-edge-strong bg-surface-1 text-ink-2'}`}>
                                                    {approved ? <CheckCheck aria-hidden="true" className="size-3.5" /> : <CircleDashed aria-hidden="true" className="size-3.5" />}
                                                    {approved ? 'Revisada' : 'Pendiente'}
                                                </span>
                                            </div>
                                            {technique.description && <p className="mt-3 pl-4 text-sm leading-6 text-ink-2">{technique.description}</p>}
                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pl-4 text-xs text-ink-3">
                                                <span className="inline-flex items-center gap-1"><Repeat aria-hidden="true" className="size-3.5 text-accent" />{technique.practiceRepetitions} rep.{technique.targetRepetitions ? ` / ${technique.targetRepetitions}` : ''}</span>
                                            </div>
                                            {technique.notes && <p className="mt-3 flex items-start gap-2 rounded-md border border-cyan-900/50 bg-cyan-950/20 p-2.5 text-xs leading-5 text-accent-text"><Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-accent" />{technique.notes}</p>}
                                            {technique.evaluation && <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-900/50 bg-emerald-950/20 p-2.5 text-xs leading-5 text-ok-text"><Star aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ok-text" /><div><p className="font-bold">Evaluación: {technique.evaluation.score} / 10</p>{technique.evaluation.feedback && <p className="mt-1">{technique.evaluation.feedback}</p>}<p className="mt-1 text-ok-text/80">{new Date(technique.evaluation.evaluatedAt).toLocaleString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}{technique.evaluation.evaluatorName ? ` · ${technique.evaluation.evaluatorName}` : ''}</p></div></div>}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}