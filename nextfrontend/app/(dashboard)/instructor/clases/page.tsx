import { auth } from '@/auth'
import { InstructorClasses } from '@/components/dashboard/instructor/InstructorClasses'
import { getInstructorClasses } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

export default async function InstructorClassesPage() {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        redirect('/no-autorizado')
    }

    const classes = await getInstructorClasses(session.user.id)

    return <InstructorClasses classes={classes} />
}