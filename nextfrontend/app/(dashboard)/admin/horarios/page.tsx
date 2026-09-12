import { auth } from '@/auth'
import { AdminSchedules } from '@/components/dashboard/admin/AdminSchedules'
import { getAdminSchedules, getAdminStudents, getAdminInstructors } from '@/lib/dashboard/admin-queries'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

export default async function AdminSchedulesPage() {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const [schedules, students, instructors] = await Promise.all([
        getAdminSchedules(userId),
        getAdminStudents(userId),
        getAdminInstructors(userId),
    ])

    if (!schedules || !students || !instructors) {
        redirect('/no-autorizado')
    }

    return <AdminSchedules schedules={schedules} students={students} instructors={instructors} />
}