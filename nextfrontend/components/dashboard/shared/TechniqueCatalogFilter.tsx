'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { TechniqueCatalogExplorer } from './TechniqueCatalogExplorer'
import { TECHNIQUE_CATEGORY_LABELS } from '@/lib/dashboard/technique-format'
import { KIHON_CATEGORIES, KIHON_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kihon-categories'
import { KUMITE_CATEGORIES, KUMITE_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kumite-categories'
import { buildProgramKataLevels, type KataLevelInfo } from '@/lib/dashboard/kata-level'
import type { Program } from '@/lib/curriculum/programs'
import type { AdminBeltRankSummary, AdminTechniqueSummary, KihonCategory, KumiteCategory, TechniqueCategory } from '@/types/dashboard'

type ProgramFilter = 'ALL' | Program

interface TechniqueCatalogFilterProps {
    /** Grados de la escuela (para agrupar por tramos y chips de cinturón). */
    ranks: AdminBeltRankSummary[]
    /** Técnicas a filtrar (ya reducidas por el consumidor, p. ej. solo no asignadas). */
    techniques: AdminTechniqueSummary[]
    /** Botón/acción de cada fila del catálogo. */
    renderActions?: (technique: AdminTechniqueSummary) => React.ReactNode
    /** Programa preseleccionado (por defecto 'ALL'). */
    defaultProgram?: ProgramFilter
    /** Mensaje cuando el filtro no devuelve resultados. */
    emptyMessage?: string
    /** Prefijo para el id del buscador y evitar colisiones en la página. */
    idPrefix?: string
}

/**
 * Bloque de filtros del catálogo de técnicas: buscador + programa + categoría
 * (con subfiltros de kihon/kumite) + catálogo agrupado por tramos. Compartido
 * por el catálogo de grados y katas del instructor y el "Plan técnico" de
 * evaluaciones; la diferencia es el slot `renderActions`.
 */
export function TechniqueCatalogFilter({
    ranks,
    techniques,
    renderActions,
    defaultProgram = 'ALL',
    emptyMessage = 'Sin resultados.',
    idPrefix = 'technique-catalog',
}: TechniqueCatalogFilterProps) {
    const [catalogQuery, setCatalogQuery] = useState('')
    const [programFilter, setProgramFilter] = useState<ProgramFilter>(defaultProgram)
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | TechniqueCategory>('ALL')
    const [kihonFilter, setKihonFilter] = useState<'ALL' | KihonCategory>('ALL')
    const [kumiteFilter, setKumiteFilter] = useState<'ALL' | KumiteCategory>('ALL')

    const levelsByProgram: Record<Program, Map<string, KataLevelInfo>> = {
        YOUTH: buildProgramKataLevels(ranks, 'YOUTH'),
        ADULT: buildProgramKataLevels(ranks, 'ADULT'),
    }
    const visiblePrograms: Program[] = programFilter === 'ALL' ? ['YOUTH', 'ADULT'] : [programFilter]
    const normalized = catalogQuery.trim().toLocaleLowerCase('es')
    const catalog = techniques.filter((technique) => {
        const matchesCategory = categoryFilter === 'ALL' || technique.category === categoryFilter
        const matchesKihon = categoryFilter !== 'KIHON' || kihonFilter === 'ALL' || technique.kihonCategory === kihonFilter
        const matchesKumite = categoryFilter !== 'KUMITE' || kumiteFilter === 'ALL' || technique.kumiteCategory === kumiteFilter
        const matchesSearch = !normalized || [
            technique.name,
            technique.japaneseName ?? '',
            technique.difficulty ?? '',
            TECHNIQUE_CATEGORY_LABELS[technique.category],
            technique.kihonCategory ? KIHON_CATEGORY_SHORT_LABELS[technique.kihonCategory] : '',
            technique.kumiteCategory ? KUMITE_CATEGORY_SHORT_LABELS[technique.kumiteCategory] : '',
        ].some((value) => value.toLocaleLowerCase('es').includes(normalized))
        if (!matchesCategory || !matchesKihon || !matchesKumite || !matchesSearch) return false
        if (technique.category === 'KATA' && !visiblePrograms.some((program) => levelsByProgram[program].has(technique.id))) return false
        return true
    })

    return (
        <div>
            {techniques.length > 0 && (
                <div className="flex flex-col gap-3 border-b border-edge p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <label className="relative block lg:w-64" htmlFor={`${idPrefix}-search`}>
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                        <input
                            className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                            id={`${idPrefix}-search`}
                            onChange={(event) => setCatalogQuery(event.target.value)}
                            placeholder="Buscar técnica…"
                            type="search"
                            value={catalogQuery}
                        />
                    </label>
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
                        <div className="flex shrink-0 items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                            {([['ALL', 'Todos'], ['YOUTH', 'Niños'], ['ADULT', 'Adultos']] as const).map(([value, label]) => (
                                <button aria-pressed={programFilter === value} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${programFilter === value ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={value} onClick={() => setProgramFilter(value)} type="button">{label}</button>
                            ))}
                        </div>
                        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-surface-3" />
                        {([['ALL', 'Todas'], ['KATA', 'Katas'], ['KIHON', 'Kihon'], ['KUMITE', 'Kumite'], ['BUNKAI', 'Bunkai']] as const).map(([category, label]) => (
                            <button aria-pressed={categoryFilter === category} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${categoryFilter === category ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-1 text-ink-3 hover:border-edge-strong'}`} key={category} onClick={() => setCategoryFilter(category)} type="button">{label}</button>
                        ))}
                        {categoryFilter === 'KIHON' && (
                            <div className="flex w-full shrink-0 flex-wrap items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                                <button aria-pressed={kihonFilter === 'ALL'} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${kihonFilter === 'ALL' ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} onClick={() => setKihonFilter('ALL')} type="button">Todas</button>
                                {KIHON_CATEGORIES.map((option) => (
                                    <button aria-pressed={kihonFilter === option} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${kihonFilter === option ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={option} onClick={() => setKihonFilter(option)} type="button">{KIHON_CATEGORY_SHORT_LABELS[option]}</button>
                                ))}
                            </div>
                        )}
                        {categoryFilter === 'KUMITE' && (
                            <div className="flex w-full shrink-0 flex-wrap items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                                <button aria-pressed={kumiteFilter === 'ALL'} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${kumiteFilter === 'ALL' ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} onClick={() => setKumiteFilter('ALL')} type="button">Todas</button>
                                {KUMITE_CATEGORIES.map((option) => (
                                    <button aria-pressed={kumiteFilter === option} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${kumiteFilter === option ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={option} onClick={() => setKumiteFilter(option)} type="button">{KUMITE_CATEGORY_SHORT_LABELS[option]}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {catalog.length === 0 ? (
                <p className="px-5 py-10 text-center text-xs text-ink-3">{emptyMessage}</p>
            ) : (
                <TechniqueCatalogExplorer
                    levelsByProgram={levelsByProgram}
                    ranks={ranks}
                    renderActions={renderActions}
                    searchActive={normalized.length > 0}
                    techniques={catalog}
                    visiblePrograms={visiblePrograms}
                />
            )}
        </div>
    )
}
