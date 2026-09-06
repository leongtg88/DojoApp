import { auth } from '@/auth'
import { InstructorStudents } from '@/components/dashboard/instructor/InstructorStudents'
import { getInstructorStudents } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'

export default async function InstructorStudentsPage() {
    const session = await auth()

    if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
        redirect('/dashboard/no-autorizado')
    }

    const students = await getInstructorStudents(session.user.id)

    return <InstructorStudents students={students} />
}