import { auth } from '@/auth'
import { StudentSchedule } from '@/components/dashboard/student/StudentSchedule'
import { getStudentSchedule } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentSchedulePage() {
    const session = await auth()

    if (session?.user?.role !== 'STUDENT' || !session.user.id) {
        redirect('/dashboard/no-autorizado')
    }

    const classes = await getStudentSchedule(session.user.id)

    if (!classes) {
        redirect('/dashboard/estudiante')
    }

    return <StudentSchedule classes={classes} />
}