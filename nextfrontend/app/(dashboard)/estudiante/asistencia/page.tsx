import { auth } from '@/auth'
import { StudentAttendanceHistory } from '@/components/dashboard/student/StudentAttendanceHistory'
import { getStudentAttendanceHistory } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentAttendancePage() {
    const session = await auth()

    if (session?.user?.role !== 'STUDENT' || !session.user.id) {
        redirect('/dashboard/no-autorizado')
    }

    const records = await getStudentAttendanceHistory(session.user.id)

    if (!records) {
        redirect('/dashboard/estudiante')
    }

    return <StudentAttendanceHistory records={records} />
}