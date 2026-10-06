'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { KATA_BANDS, bandForOrder, beltChipsForLevels, type KataBand } from '@/lib/dashboard/kata-bands'
import { techniqueMetaLine } from '@/lib/dashboard/technique-format'
import type { KataLevelInfo } from '@/lib/dashboard/kata-level'
import type { Program } from '@/lib/curriculum/programs'
import type { AdminBeltRankSummary, AdminTechniqueSummary } from '@/types/dashboard'

interface TechniqueBandGroup {
    key: string
    band: KataBand
    label: string
    items: AdminTechniqueSummary[]
}

const PROGRAM_LABELS: Record<Program, string> = {
    YOUTH: 'Niños',
    ADULT: 'Adultos',
}

/** Muestra de color de cinturón (con franja secundaria opcional). Se usa en las
 *  cabeceras de tramo y al lado del nombre de cada técnica. */
function BeltSwatch({ beltColor, beltSecondaryColor }: { beltColor: string | null; beltSecondaryColor?: string | null }) {
    const color = beltColor ?? '#3f3f46'
    const isDark = color.toUpperCase() === '#212121'
    return (
        <span
            aria-hidden="true"
            className="relative inline-block h-3 w-5 shrink-0 overflow-hidden rounded-sm border border-white/30"
            style={{ backgroundColor: color, boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.5)' : undefined }}
        >
            {beltSecondaryColor && <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2" style={{ backgroundColor: beltSecondaryColor }} />}
        </span>
    )
}

interface TechniqueCatalogExplorerProps {
    ranks: AdminBeltRankSummary[]
    /** Técnicas ya filtradas que se van a mostrar. */
    techniques: AdminTechniqueSummary[]
    visiblePrograms: Program[]
    levelsByProgram: Record<Program, Map<string, KataLevelInfo>>
    /** Con búsqueda activa se expanden todos los tramos. */
    searchActive: boolean
    /** Botones de la fila (Enviar/Editar/Eliminar según el rol). */
    renderActions?: (technique: AdminTechniqueSummary) => React.ReactNode
}

/**
 * Catálogo de técnicas agrupado por programa y tramo de kyu, con chips de
 * cinturón y acordeones. Compartido por el catálogo del admin y el del
 * instructor; la diferencia entre roles es el slot `renderActions`.
 */
export function TechniqueCatalogExplorer({
    ranks,
    techniques,
    visiblePrograms,
    levelsByProgram,
    searchActive,
    renderActions,
}: TechniqueCatalogExplorerProps) {
    const [openBands, setOpenBands] = useState<Record<string, boolean>>({})

    const isBandOpen = (key: string) => searchActive || Boolean(openBands[key])

    function toggleBand(key: string) {
        setOpenBands((current) => ({ ...current, [key]: !current[key] }))
    }

    function bandGroupsForProgram(program: Program): TechniqueBandGroup[] {
        const groups: TechniqueBandGroup[] = []
        for (const definition of KATA_BANDS[program]) {
            const items = techniques
                .filter((technique) => {
                    const level = levelsByProgram[program].get(technique.id)
                    return level != null && bandForOrder(program, level.gradeOrder) === definition.band
                })
                .sort((a, b) => {
                    const levelA = levelsByProgram[program].get(a.id)
                    const levelB = levelsByProgram[program].get(b.id)
                    const rankA = levelA ? levelA.gradeOrder * 1000 + levelA.position : 100000 + a.order
                    const rankB = levelB ? levelB.gradeOrder * 1000 + levelB.position : 100000 + b.order
                    return rankA - rankB || a.name.localeCompare(b.name)
                })
            if (items.length > 0) groups.push({ key: `${program}:${definition.band}`, band: definition.band, label: definition.label, items })
        }
        return groups
    }

    const ungradedTechniques = techniques
        .filter((technique) => !visiblePrograms.some((program) => levelsByProgram[program].has(technique.id)))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

    function renderTechnique(technique: AdminTechniqueSummary, level: KataLevelInfo | undefined) {
        const rank = technique.rankIds.length > 0 ? ranks.find(({ id }) => id === technique.rankIds[0]) : undefined
        const meta = techniqueMetaLine(technique, technique.category !== 'KATA')
        return (
            <li className="flex items-start justify-between gap-4 px-5 py-4" key={technique.id}>
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {(level || rank) && <BeltSwatch beltColor={level?.beltColor ?? rank?.beltColor ?? null} beltSecondaryColor={level?.beltSecondaryColor} />}
                        <span className="min-w-0 truncate">{technique.name}</span>
                        {technique.japaneseName && <span className="shrink-0 text-xs font-normal text-ink-3">{technique.japaneseName}</span>}
                    </p>
                    {meta && <p className="mt-1 text-xs text-ink-3">{meta}</p>}
                    {technique.description && <p className="mt-2 text-xs text-ink-3">{technique.description}</p>}
                </div>
                {renderActions && <div className="flex shrink-0 items-center gap-1.5">{renderActions(technique)}</div>}
            </li>
        )
    }

    return (
        <div>
            {visiblePrograms.map((program) => {
                const groups = bandGroupsForProgram(program)
                if (groups.length === 0) return null
                return (
                    <div key={program}>
                        <p className="border-b border-edge bg-surface-1/60 px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent">{PROGRAM_LABELS[program]}</p>
                        {groups.map((group) => {
                            const levels = group.items
                                .map((technique) => levelsByProgram[program].get(technique.id))
                                .filter((level): level is KataLevelInfo => level != null)
                            const belts = beltChipsForLevels(levels)
                            const isOpen = isBandOpen(group.key)
                            return (
                                <div key={group.key}>
                                    <button
                                        aria-expanded={isOpen}
                                        className="flex w-full flex-col gap-1.5 border-b border-edge bg-surface-1/40 px-5 py-2 text-left transition-colors hover:bg-surface-1/70"
                                        onClick={() => toggleBand(group.key)}
                                        type="button"
                                    >
                                        <span className="flex w-full items-center gap-2">
                                            {isOpen ? <ChevronUp aria-hidden="true" className="size-4 shrink-0 text-ink-3" /> : <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-3" />}
                                            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{group.label}</span>
                                            <span className="ml-auto text-[11px] text-ink-4">{group.items.length}</span>
                                        </span>
                                        {!isOpen && belts.length > 0 && (
                                            <span className="flex flex-wrap items-center gap-1.5 pl-6">
                                                {belts.map((belt) => <BeltSwatch beltColor={belt.beltColor} key={belt.key} />)}
                                            </span>
                                        )}
                                    </button>
                                    {isOpen && (
                                        <ul className="divide-y divide-edge">
                                            {group.items.map((technique) => renderTechnique(technique, levelsByProgram[program].get(technique.id)))}
                                        </ul>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            })}

            {ungradedTechniques.length > 0 && (
                <div>
                    <button
                        aria-expanded={isBandOpen('__ungraded__')}
                        className="flex w-full items-center gap-2 border-b border-edge bg-surface-1/40 px-5 py-1.5 text-left transition-colors hover:bg-surface-1/70"
                        onClick={() => toggleBand('__ungraded__')}
                        type="button"
                    >
                        {isBandOpen('__ungraded__') ? <ChevronUp aria-hidden="true" className="size-4 shrink-0 text-ink-3" /> : <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-3" />}
                        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Sin grado</span>
                        <span className="ml-auto text-[11px] text-ink-4">{ungradedTechniques.length}</span>
                    </button>
                    {isBandOpen('__ungraded__') && (
                        <ul className="divide-y divide-edge">
                            {ungradedTechniques.map((technique) => renderTechnique(technique, undefined))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
