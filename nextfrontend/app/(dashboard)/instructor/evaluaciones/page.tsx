import { auth } from '@/auth'
import { InstructorTechniqueReview } from '@/components/dashboard/instructor/InstructorTechniqueReview'
import { getInstructorStudents, getInstructorTechniqueReview } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'

interface InstructorEvaluationsPageProps {
    searchParams: Promise<{ studentId?: string }>
}

export default async function InstructorEvaluationsPage({ searchParams }: InstructorEvaluationsPageProps) {
    const session = await auth()

    if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
        redirect('/dashboard/no-autorizado')
    }

    const parameters = await searchParams
    const students = await getInstructorStudents(session.user.id)
    const studentId = parameters.studentId ?? students[0]?.id
    const review = studentId ? await getInstructorTechniqueReview(session.user.id, studentId) : null

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Técnicas y katas</h1>
            <form className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] p-5" method="get">
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-200" htmlFor="studentId">
                    Alumno
                    <select className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" defaultValue={studentId} id="studentId" name="studentId">
                        {students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}
                    </select>
                </label>
                <button className="mt-3 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117]" type="submit">Cargar alumno</button>
            </form>
            {review ? <InstructorTechniqueReview review={review} /> : <p className="mt-6 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-8 text-sm text-neutral-400">No tienes alumnos activos para evaluar.</p>}
        </main>
    )
}