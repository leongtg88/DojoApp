import { CheckCircle2, GraduationCap } from 'lucide-react'
import type { StudentDashboardSummary } from '@/types/dashboard'
import { StudentSyllabus } from './StudentSyllabus'

interface StudentProgressOverviewProps {
    summary: StudentDashboardSummary
}

export function StudentProgressOverview({ summary }: StudentProgressOverviewProps) {
    const approvedCount = summary.techniques.filter(({ status }) => status === 'APPROVED').length

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Mi progreso</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Avance marcial</h1>

            <section className="mt-7 grid gap-3 sm:grid-cols-2">
                <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5">
                    <GraduationCap aria-hidden="true" className="size-5 text-cyan-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Grado actual</p>
                    <p className="mt-1 text-xl font-bold text-white">{summary.profile.currentRank?.name ?? 'Sin grado asignado'}</p>
                </article>
                <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5">
                    <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-400" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Técnicas aprobadas</p>
                    <p className="mt-1 text-xl font-bold text-white">{approvedCount} de {summary.techniques.length}</p>
                </article>
            </section>

            <StudentSyllabus techniques={summary.techniques} />
        </main>
    )
}