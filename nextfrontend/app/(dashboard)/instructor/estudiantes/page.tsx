import { auth } from '@/auth'
import { InstructorStudents } from '@/components/dashboard/instructor/InstructorStudents'
import { getInstructorStudents } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function InstructorStudentsPage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        redirect('/no-autorizado')
    }

    const students = await getInstructorStudents(session.user.id)

    return <InstructorStudents students={students} />
}