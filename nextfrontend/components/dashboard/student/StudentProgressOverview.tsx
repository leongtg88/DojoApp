import { CheckCircle2, CircleDashed, GraduationCap } from 'lucide-react'
import type { StudentDashboardSummary } from '@/types/dashboard'

interface StudentProgressOverviewProps {
    summary: StudentDashboardSummary
}

export function StudentProgressOverview({ summary }: StudentProgressOverviewProps) {
    const approvedCount = summary.techniques.filter(({ status }) => status === 'APPROVED').length

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Mi progreso</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Avance marcial</h1>

            <section className="mt-7 grid gap-3 sm:grid-cols-2">
                <article className="border border-[#e5e2e1] bg-white p-5">
                    <GraduationCap aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Grado actual</p>
                    <p className="mt-1 text-xl font-bold text-[#1c1b1b]">{summary.profile.currentRank?.name ?? 'Sin grado asignado'}</p>
                </article>
                <article className="border border-[#e5e2e1] bg-white p-5">
                    <CheckCircle2 aria-hidden="true" className="size-5 text-[#b70011]" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Técnicas aprobadas</p>
                    <p className="mt-1 text-xl font-bold text-[#1c1b1b]">{approvedCount} de {summary.techniques.length}</p>
                </article>
            </section>

            <section className="mt-8 border border-[#e5e2e1] bg-white">
                <div className="border-b border-[#e5e2e1] px-5 py-4">
                    <h2 className="font-display text-lg font-bold text-[#1c1b1b]">Técnicas asignadas</h2>
                </div>
                {summary.techniques.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#5c403c]">Tu instructor aún no te ha asignado técnicas.</p>
                ) : (
                    <ul className="divide-y divide-[#e5e2e1]">
                        {summary.techniques.map((technique) => {
                            const approved = technique.status === 'APPROVED'
                            return (
                                <li className="flex items-start gap-3 px-5 py-4" key={technique.id}>
                                    {approved ? (
                                        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#5b7f38]" />
                                    ) : (
                                        <CircleDashed aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#a1918e]" />
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-[#1c1b1b]">{technique.name}</p>
                                        {technique.description && <p className="mt-1 text-sm text-[#5c403c]">{technique.description}</p>}
                                        {technique.notes && <p className="mt-2 text-xs text-[#8a7400]">{technique.notes}</p>}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </main>
    )
}