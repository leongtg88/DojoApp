import Link from 'next/link'
import { Award, CheckCheck, ChevronRight, Clock3, Info } from 'lucide-react'
import type { StudentTechnique } from '@/types/dashboard'

interface FocusTechniquesListProps {
    techniques: StudentTechnique[]
}

export function FocusTechniquesList({ techniques }: FocusTechniquesListProps) {
    const displayTechniques = techniques.filter(({ status }) => status !== 'APPROVED').slice(0, 3)

    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-edge px-5 py-4">
                <div className="flex items-center gap-2"><Award aria-hidden="true" className="size-4 text-warn-text" /><h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink">Técnicas en enfoque</h2></div>
                <Link className="inline-flex items-center gap-0.5 text-xs font-bold text-accent hover:underline" href="/dashboard/estudiante/progreso">Ver syllabus <ChevronRight aria-hidden="true" className="size-3.5" /></Link>
            </div>
            {displayTechniques.length === 0 ? (
                <p className="px-5 py-8 text-sm text-ink-3">No tienes técnicas pendientes de práctica.</p>
            ) : (
                <ul className="divide-y divide-edge">
                    {displayTechniques.map((technique) => (
                        <li className="px-5 py-4" key={technique.id}>
                            <div className="flex items-start justify-between gap-4">
                                <div><p className="text-[10px] font-bold uppercase tracking-widest text-accent">{technique.category}</p><h3 className="mt-1 text-sm font-bold text-ink">{technique.name}</h3></div>
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-warn-text"><Clock3 aria-hidden="true" className="size-3.5" />Pendiente</span>
                            </div>
                            <p className="mt-2 text-xs text-ink-3">{technique.practiceRepetitions} rep.{technique.targetRepetitions ? ` / ${technique.targetRepetitions}` : ''}</p>
                            {technique.notes && <p className="mt-3 flex items-start gap-2 rounded-lg border border-cyan-900/50 bg-cyan-950/20 p-2.5 text-xs text-accent-text"><Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-accent" />{technique.notes}</p>}
                        </li>
                    ))}
                </ul>
            )}
            {techniques.length > 0 && displayTechniques.length === 0 && <div className="flex items-center gap-2 border-t border-edge px-5 py-3 text-xs font-semibold text-ok-text"><CheckCheck aria-hidden="true" className="size-4" />Todas tus técnicas asignadas están aprobadas.</div>}
        </section>
    )
}