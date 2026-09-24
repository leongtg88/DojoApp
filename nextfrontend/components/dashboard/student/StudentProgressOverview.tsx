import { Award, Hourglass } from 'lucide-react'
import type { StudentAttendancePunchData, StudentDashboardSummary, StudentKataProgressSummary } from '@/types/dashboard'
import { ExaminationCriteriaCard } from './ExaminationCriteriaCard'
import { StudentSyllabus } from './StudentSyllabus'
import { GradoProgress } from '@/components/dashboard/dojo/GradoProgress'

interface StudentProgressOverviewProps {
    kataSummary: StudentKataProgressSummary
    summary: StudentDashboardSummary
    attendanceData: StudentAttendancePunchData
}

export function StudentProgressOverview({ kataSummary, summary, attendanceData }: StudentProgressOverviewProps) {
    const { grado } = kataSummary
    const pendingCount = attendanceData.summary.pendingCount

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

            {pendingCount > 0 && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <Hourglass aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warn-text" />
                    <div>
                        <p className="text-sm font-bold text-warn-text">
                            {pendingCount} práctica{pendingCount > 1 ? 's' : ''} por confirmar
                        </p>
                        <p className="mt-0.5 text-xs text-ink-3">
                            El Sensei confirmará tus punch de asistencia; al hacerlo se reflejarán en tu progreso de grado y metas.
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-7 space-y-5">
                <GradoProgress grado={grado} />
                <ExaminationCriteriaCard grado={grado} />
                <StudentSyllabus techniques={summary.techniques} />
            </div>
        </main>
    )
}