import Link from 'next/link'
import type { StudentDashboardSummary } from '@/types/dashboard'
import { StudentBirthdayCard } from './StudentBirthdayCard'
import { FocusTechniquesList } from './FocusTechniquesList'
import { MartialGradeCard } from './MartialGradeCard'
import { StudentGreeting } from './StudentGreeting'
import { StudentMetricsGrid } from './StudentMetricsGrid'

interface StudentDashboardOverviewProps {
    summary: StudentDashboardSummary
}

export function StudentDashboardOverview({ summary }: StudentDashboardOverviewProps) {
    const { attendance, profile, techniques } = summary
    const approvedTechniques = techniques.filter(({ status }) => status === 'APPROVED').length
    const studentName = `${profile.firstName} ${profile.lastName}`

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <StudentGreeting profile={profile} />
            <section className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <MartialGradeCard approvedTechniques={approvedTechniques} rank={profile.currentRank} studentName={studentName} totalTechniques={techniques.length} />
                <StudentBirthdayCard dateOfBirth={profile.dateOfBirth} />
            </section>
            <div className="mt-5"><StudentMetricsGrid attendance={attendance} techniques={techniques} /></div>
            <div className="mt-5"><FocusTechniquesList techniques={techniques} /></div>
        </main>
    )
}