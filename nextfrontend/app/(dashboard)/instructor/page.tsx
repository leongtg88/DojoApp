import { auth } from '@/auth'
import { InstructorDashboardOverview } from '@/components/dashboard/instructor/InstructorDashboardOverview'
import { getInstructorClasses, getInstructorStudents } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'

export default async function InstructorDashboardPage() {
    const session = await auth()

    if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
        redirect('/dashboard/no-autorizado')
    }

    const [classes, students] = await Promise.all([
        getInstructorClasses(session.user.id),
        getInstructorStudents(session.user.id),
    ])

    return <InstructorDashboardOverview classes={classes} students={students} />
}