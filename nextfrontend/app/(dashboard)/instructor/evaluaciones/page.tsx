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
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Técnicas y katas</h1>
            <form className="mt-7 border border-[#e5e2e1] bg-white p-5" method="get">
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1c1b1b]" htmlFor="studentId">
                    Alumno
                    <select className="border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" defaultValue={studentId} id="studentId" name="studentId">
                        {students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}
                    </select>
                </label>
                <button className="mt-3 bg-[#5c403c] px-4 py-2.5 text-sm font-semibold text-white" type="submit">Cargar alumno</button>
            </form>
            {review ? <InstructorTechniqueReview review={review} /> : <p className="mt-6 border border-[#e5e2e1] bg-white px-5 py-8 text-sm text-[#5c403c]">No tienes alumnos activos para evaluar.</p>}
        </main>
    )
}