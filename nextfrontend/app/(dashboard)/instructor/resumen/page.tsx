import { auth } from '@/auth'
import { InstructorDashboardOverview } from '@/components/dashboard/instructor/InstructorDashboardOverview'
import { getInstructorClasses, getInstructorPendingCount, getInstructorStudents, getInstructorUpcomingBirthdays } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function InstructorDashboardPage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        redirect('/no-autorizado')
    }

    const [birthdays, classes, students, pendingCount] = await Promise.all([
        getInstructorUpcomingBirthdays(session.user.id),
        getInstructorClasses(session.user.id),
        getInstructorStudents(session.user.id),
        getInstructorPendingCount(session.user.id),
    ])

    return <InstructorDashboardOverview birthdays={birthdays} classes={classes} pendingCount={pendingCount} students={students} />
}