import { auth } from '@/auth'
import { InstructorTechniqueReview } from '@/components/dashboard/instructor/InstructorTechniqueReview'
import { StudentSearchSelect } from '@/components/dashboard/instructor/StudentSearchSelect'
import { getInstructorStudents, getInstructorTechniqueReview } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

interface InstructorEvaluationsPageProps {
    searchParams: Promise<{ studentId?: string }>
}

export default async function InstructorEvaluationsPage({ searchParams }: InstructorEvaluationsPageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        redirect('/no-autorizado')
    }

    const parameters = await searchParams
    const students = await getInstructorStudents(session.user.id)
    const studentId = parameters.studentId ?? students[0]?.id
    const review = studentId ? await getInstructorTechniqueReview(session.user.id, studentId) : null

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Técnicas y katas</h1>
            <section className="mt-7 rounded-lg border border-edge bg-surface-2 p-5">
                <StudentSearchSelect students={students} studentId={studentId} />
            </section>
            {review ? <InstructorTechniqueReview review={review} /> : <p className="mt-6 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-8 text-xs text-ink-3">No tienes alumnos activos para evaluar.</p>}
        </main>
    )
}