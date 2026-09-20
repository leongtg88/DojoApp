import { Award } from 'lucide-react'
import type { StudentDashboardSummary, StudentKataProgressSummary } from '@/types/dashboard'
import { ExaminationCriteriaCard } from './ExaminationCriteriaCard'
import { StudentSyllabus } from './StudentSyllabus'
import { KataProgressPanel } from './KataProgressPanel'
import { GradoProgress } from '@/components/dashboard/dojo/GradoProgress'

interface StudentProgressOverviewProps {
    kataSummary: StudentKataProgressSummary
    summary: StudentDashboardSummary
}

export function StudentProgressOverview({ kataSummary, summary }: StudentProgressOverviewProps) {
    const { grado, katas } = kataSummary

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-accent">Mi progreso</p>
                    <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Katas y grado</h1>
                    <p className="mt-2 text-sm text-ink-3">
                        {grado.currentRankName ?? 'Grado actual'} · {grado.approvedKatas} de {grado.requiredKatas} katas aprobadas
                    </p>
                </div>
                <Award aria-hidden="true" className="size-8 shrink-0 text-ok-text" />
            </header>

            <div className="mt-7 space-y-5">
                <GradoProgress grado={grado} />
                <KataProgressPanel katas={katas} />
                <ExaminationCriteriaCard grado={grado} />
                <StudentSyllabus techniques={summary.techniques} />
            </div>
        </main>
    )
}