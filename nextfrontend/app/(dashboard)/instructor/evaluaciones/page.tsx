import { auth } from '@/auth'
import { InstructorTechniqueReview } from '@/components/dashboard/instructor/InstructorTechniqueReview'
import { StudentSearchSelect } from '@/components/dashboard/instructor/StudentSearchSelect'
import { pickDefaultEvaluationStudentId } from '@/lib/dashboard/instructor-defaults'
import {
    getInstructorAttendanceRoster,
    getInstructorScheduleOptions,
    getInstructorStudents,
    getInstructorTechniqueReview,
} from '@/lib/dashboard/instructor-queries'
import { latestSessionDate, resolveDefaultSessionClass, santoDomingoDayKey } from '@/lib/dashboard/schedule-utils'
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
    let studentId = parameters.studentId ?? null

    // UX-B4: sin selección previa, abre con el alumno de la clase en curso.
    if (!studentId) {
        const now = new Date()
        const options = await getInstructorScheduleOptions(session.user.id)
        const ownClasses = options.filter((option) => option.isOwnClass)
        const defaultClass = resolveDefaultSessionClass(ownClasses.length > 0 ? ownClasses : options, now)
        const roster = defaultClass
            ? await getInstructorAttendanceRoster(
                session.user.id,
                defaultClass.id,
                santoDomingoDayKey(latestSessionDate(defaultClass.dayOfWeek, now)),
            )
            : null

        studentId = pickDefaultEvaluationStudentId(
            roster?.students.map((student) => student.id) ?? [],
            students.map((student) => student.id),
        )
    }

    const review = studentId ? await getInstructorTechniqueReview(session.user.id, studentId) : null

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Técnicas y katas</h1>
            <section className="mt-7 rounded-lg border border-edge bg-surface-2 p-5">
                <StudentSearchSelect key={studentId ?? 'no-selection'} students={students} studentId={studentId ?? undefined} />
            </section>
            {review ? (
                <InstructorTechniqueReview key={review.student.id} review={review} />
            ) : students.length === 0 ? (
                <p className="mt-6 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-8 text-xs text-ink-3">No tienes alumnos activos para evaluar.</p>
            ) : (
                <p className="mt-6 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-8 text-xs text-ink-3">Selecciona un alumno para ver y evaluar sus técnicas y katas.</p>
            )}
        </main>
    )
}
