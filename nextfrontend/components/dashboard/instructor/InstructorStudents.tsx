import { GraduationCap, Users } from 'lucide-react'
import type { InstructorStudentSummary } from '@/types/dashboard'

interface InstructorStudentsProps {
    students: InstructorStudentSummary[]
}

export function InstructorStudents({ students }: InstructorStudentsProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Mis estudiantes</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Alumnos inscritos activamente en tus clases.</p>

            {students.length === 0 ? (
                <section className="mt-7 border border-[#e5e2e1] bg-white px-5 py-10 text-center">
                    <Users aria-hidden="true" className="mx-auto size-7 text-[#a1918e]" />
                    <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No hay alumnos activos en tus clases.</p>
                </section>
            ) : (
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {students.map((student) => (
                        <li className="border border-[#e5e2e1] bg-white p-5" key={student.id}>
                            <p className="text-lg font-bold text-[#1c1b1b]">{student.firstName} {student.lastName}</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm text-[#5c403c]">
                                <GraduationCap aria-hidden="true" className="size-4 text-[#b70011]" />
                                {student.currentRank ?? 'Sin grado asignado'}
                            </p>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Clases activas</p>
                            <p className="mt-1 text-sm text-[#5c403c]">{student.classNames.join(', ')}</p>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}