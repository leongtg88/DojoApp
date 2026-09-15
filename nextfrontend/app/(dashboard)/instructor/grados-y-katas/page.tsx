import { auth } from '@/auth'
import { InstructorCurriculumView } from '@/components/dashboard/instructor/InstructorCurriculumView'
import { getInstructorCurriculum } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function InstructorCurriculumPage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session.user, 'INSTRUCTOR')) {
        redirect('/no-autorizado')
    }

    const curriculum = await getInstructorCurriculum(session.user.id)

    if (!curriculum) {
        redirect('/no-autorizado')
    }

    return <InstructorCurriculumView curriculum={curriculum} />
}
