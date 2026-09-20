import Link from 'next/link'
import { BadgeCheck, ChevronRight } from 'lucide-react'
import type { DashboardBeltRank, GradoProgressData } from '@/types/dashboard'

interface MartialGradeCardProps {
    rank: DashboardBeltRank | null
    studentName: string
    approvedTechniques: number
    totalTechniques: number
    grado?: GradoProgressData
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
}

function darken(hex: string, amount: number): string {
    const rgb = hexToRgb(hex)
    if (!rgb) return hex
    const clamp = (n: number) => Math.max(0, Math.min(255, n))
    return `rgb(${clamp(rgb.r - amount)}, ${clamp(rgb.g - amount)}, ${clamp(rgb.b - amount)})`
}

function isLightColor(hex: string): boolean {
    const rgb = hexToRgb(hex)
    if (!rgb) return false
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 150
}

const BELT_DEFAULT = '#e5e7eb'

export function MartialGradeCard({ rank, studentName, approvedTechniques, totalTechniques, grado }: MartialGradeCardProps) {
    const progress = totalTechniques === 0 ? 0 : Math.round((approvedTechniques / totalTechniques) * 100)
    const beltColor = grado?.beltColor ?? rank?.beltColor ?? BELT_DEFAULT
    const lightBelt = isLightColor(beltColor)
    const tagText = lightBelt ? '#1a1a1a' : '#eee49f'

    return (
        <section className="relative overflow-hidden rounded-xl border border-amber-900/40 bg-gradient-to-br from-surface-3 via-surface-2 to-surface-1 p-5 shadow-lg shadow-black/20">
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-4 font-display text-[9rem] font-black leading-none text-ink opacity-[0.05]">級</span>

            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-warn-text">Grado actual</p>
                        <h2 className="mt-1 font-display text-2xl font-black text-ink">{rank?.name ?? 'Sin grado asignado'}</h2>
                        <p className="mt-1 text-xs font-semibold text-ink-3">Siguiente: {grado?.nextRankName ?? 'convocatoria de examen'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-warn-text">Plan oficial de grado</span>
                        {grado ? (
                            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-extrabold text-accent-text">{grado.overallPercent}% avance</span>
                        ) : (
                            <span className="rounded-full border border-edge-strong bg-surface-3/50 px-2.5 py-1 text-xs font-extrabold text-ink-3">Sin datos</span>
                        )}
                    </div>
                </div>

                <div className="mt-5 rounded-md border border-edge-strong bg-surface-1 p-1.5 shadow-inner">
                    <div className="relative flex h-10 items-center justify-between overflow-hidden rounded-sm px-4 shadow-sm" style={{ backgroundColor: beltColor }}>
                        <span aria-hidden="true" className="absolute inset-x-0 top-1.5 h-px" style={{ backgroundColor: darken(beltColor, 40) }} />
                        <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 h-px" style={{ backgroundColor: darken(beltColor, 40) }} />
                        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: darken(beltColor, 25) }} />
                        <span aria-hidden="true" className="relative flex size-4 shrink-0 items-center justify-center rounded-[3px] border" style={{ borderColor: darken(beltColor, 50), backgroundColor: darken(beltColor, 25) }}>
                            <span className="size-2 rounded-sm" style={{ backgroundColor: darken(beltColor, 50) }} />
                        </span>
                        <span className="relative flex flex-col items-start">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: tagText }}>当世具足</span>
                            <span className="text-[8px] font-semibold tracking-wider" style={{ color: `${tagText}cc` }}>{studentName}</span>
                        </span>
                        <span aria-hidden="true" className="relative h-6 w-1.5 rounded-sm bg-[#dc2626]" />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-ink">{approvedTechniques} de {totalTechniques} técnicas aprobadas</span>
                    <Link className="inline-flex shrink-0 items-center gap-0.5 font-bold text-accent hover:underline" href="/dashboard/estudiante/progreso">Ver progreso <ChevronRight aria-hidden="true" className="size-4" /></Link>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-1 p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all" style={{ width: `${progress}%` }} /></div>

                <div className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2.5 ${grado?.isEligible ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-edge-strong bg-surface-1'}`}>
                    <BadgeCheck aria-hidden="true" className={`size-4 shrink-0 ${grado?.isEligible ? 'text-ok-text' : 'text-warn-text'}`} />
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink">Budo Pass</p>
                        <p className={`truncate text-xs ${grado?.isEligible ? 'text-ok-text' : 'text-ink-3'}`}>
                            {grado?.isEligible
                                ? 'Listo para examen de grado'
                                : grado
                                    ? `Preparación al ${grado.overallPercent}%`
                                    : 'Aún sin evaluar'}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}