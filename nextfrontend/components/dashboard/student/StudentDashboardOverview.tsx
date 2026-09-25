import type { StudentDashboardSummary, StudentKataProgressSummary } from '@/types/dashboard'
import { StudentBirthdayCard } from './StudentBirthdayCard'
import { ExaminationCriteriaCard } from './ExaminationCriteriaCard'
import { FocusTechniquesList } from './FocusTechniquesList'
import { MartialGradeCard } from './MartialGradeCard'
import { StudentGreeting } from './StudentGreeting'
import { StudentMetricsGrid } from './StudentMetricsGrid'
import { NextClassCard } from './NextClassCard'

interface StudentDashboardOverviewProps {
    summary: StudentDashboardSummary
    kataSummary: StudentKataProgressSummary | null
}

export function StudentDashboardOverview({ summary, kataSummary }: StudentDashboardOverviewProps) {
    const { attendance, profile, techniques, upcomingClasses } = summary
    const approvedTechniques = techniques.filter(({ status }) => status === 'APPROVED').length
    const studentName = `${profile.firstName} ${profile.lastName}`

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <StudentGreeting profile={profile} />
            <div className="mt-7">
                <MartialGradeCard approvedTechniques={approvedTechniques} grado={kataSummary?.grado} rank={profile.currentRank} studentName={studentName} totalTechniques={techniques.length} studentId={profile.id} />
            </div>
            <div className="mt-5">
                <NextClassCard classes={upcomingClasses} studentId={profile.id} />
            </div>
            <div className="mt-5">
                <StudentBirthdayCard dateOfBirth={profile.dateOfBirth} />
            </div>
            <div className="mt-5">
                <StudentMetricsGrid attendance={attendance} techniques={techniques} grado={kataSummary?.grado ?? null} />
            </div>
            <div className="mt-5">
                <FocusTechniquesList techniques={techniques} studentId={profile.id} />
            </div>
            <div className="mt-5">
                {kataSummary && <ExaminationCriteriaCard grado={kataSummary.grado} />}
            </div>
        </main>
    )
}