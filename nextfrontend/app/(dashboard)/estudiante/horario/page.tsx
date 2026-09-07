import { auth } from '@/auth'
import { StudentSchedule } from '@/components/dashboard/student/StudentSchedule'
import { getStudentSchedule } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function StudentSchedulePage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'STUDENT')) {
        redirect('/no-autorizado')
    }

    const classes = await getStudentSchedule(session.user.id)

    if (!classes) {
        redirect('/dashboard/estudiante')
    }

    return <StudentSchedule classes={classes} />
}