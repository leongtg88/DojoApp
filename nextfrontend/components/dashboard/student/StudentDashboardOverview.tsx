import type { StudentDashboardSummary, StudentKataProgressSummary } from '@/types/dashboard'
import { StudentBirthdayCard } from './StudentBirthdayCard'
import { ExaminationCriteriaCard } from './ExaminationCriteriaCard'
import { FocusTechniquesList } from './FocusTechniquesList'
import { MartialGradeCard } from './MartialGradeCard'
import { PrimaryActionCard } from './PrimaryActionCard'
import { StudentGreeting } from './StudentGreeting'
import { StudentMetricsGrid } from './StudentMetricsGrid'

interface StudentDashboardOverviewProps {
    summary: StudentDashboardSummary
    kataSummary: StudentKataProgressSummary | null
}

/**
 * UX-A5b · Nuevo Inicio del alumno.
 *
 * Orden: saludo → UNA acción principal → técnicas en foco → camino al próximo
 * cinturón → secundarios plegados. Los datos vienen del resumen y del progreso
 * que la página ya consulta; no se añaden consultas nuevas.
 */
export function StudentDashboardOverview({ summary, kataSummary }: StudentDashboardOverviewProps) {
    const { attendance, profile, techniques, upcomingClasses } = summary
    const approvedTechniques = techniques.filter(({ status }) => status === 'APPROVED').length
    const studentName = `${profile.firstName} ${profile.lastName}`
    const pendingRecoveries = kataSummary?.grado.pendingRecoveries ?? 0
    const focusTechniqueName = techniques.find(({ status }) => status !== 'APPROVED')?.name ?? null

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <StudentGreeting profile={profile} />

            <PrimaryActionCard
                classes={upcomingClasses}
                focusTechniqueName={focusTechniqueName}
                pendingRecoveries={pendingRecoveries}
                studentId={profile.id}
            />

            <div className="mt-5">
                <FocusTechniquesList limit={3} studentId={profile.id} techniques={techniques} />
            </div>

            <div className="mt-5">
                <MartialGradeCard
                    approvedTechniques={approvedTechniques}
                    grado={kataSummary?.grado}
                    rank={profile.currentRank}
                    studentId={profile.id}
                    studentName={studentName}
                    totalTechniques={techniques.length}
                />
            </div>

            <details className="mt-5 rounded-lg border border-edge bg-surface-2">
                <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-ink">Más detalles</summary>
                <div className="space-y-5 border-t border-edge px-5 py-5">
                    <StudentMetricsGrid attendance={attendance} grado={kataSummary?.grado ?? null} katas={kataSummary?.katas ?? []} techniques={techniques} />
                    <StudentBirthdayCard dateOfBirth={profile.dateOfBirth} />
                    {kataSummary && <ExaminationCriteriaCard grado={kataSummary.grado} studentId={profile.id} />}
                </div>
            </details>
        </main>
    )
}
