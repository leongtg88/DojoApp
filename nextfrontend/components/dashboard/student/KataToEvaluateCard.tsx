import Link from 'next/link'
import { ChevronRight, ClipboardCheck, Hourglass } from 'lucide-react'
import type { KataProgressItem } from '@/types/dashboard'
import { KataBadge } from '@/components/dashboard/dojo/KataBadge'

interface KataToEvaluateCardProps {
    katas: KataProgressItem[]
}

export function KataToEvaluateCard({ katas }: KataToEvaluateCardProps) {
    const pendingEvaluation = katas.filter(({ status }) => status === 'IN_PROGRESS').slice(0, 3)

    return (
        <section className="rounded-lg border border-amber-500/20 bg-[#161b22] shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                <div className="flex items-center gap-2">
                    <ClipboardCheck aria-hidden="true" className="size-4 text-amber-400" />
                    <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">Próximas katas a evaluar</h2>
                </div>
                <Link className="inline-flex items-center gap-0.5 text-xs font-bold text-cyan-300 hover:underline" href="/dashboard/estudiante/progreso">Ver katas <ChevronRight aria-hidden="true" className="size-3.5" /></Link>
            </div>
            {pendingEvaluation.length === 0 ? (
                <p className="px-5 py-8 text-sm text-neutral-400">Aún no tienes katas en práctica para evaluar. Comienza a practicar alguna para que tu sensei pueda calificarla.</p>
            ) : (
                <ul className="divide-y divide-neutral-800">
                    {pendingEvaluation.map((kata) => (
                        <li className="px-5 py-4" key={kata.id}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-white">{kata.name}</h3><KataBadge status={kata.status} /></div>
                                    <p className="mt-1 text-xs text-neutral-400">{kata.practiceHours} h de práctica{!kata.evaluatedBy ? ' · pendiente de evaluación del sensei' : ` · evaluada por ${kata.evaluatedBy}`}</p>
                                </div>
                                <Hourglass aria-hidden="true" className="size-5 shrink-0 text-amber-400/70" />
                            </div>
                            {kata.lastFeedback && <p className="mt-3 line-clamp-2 text-xs text-neutral-300">{kata.lastFeedback}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}