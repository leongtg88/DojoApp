import Link from 'next/link'
import type { AdminStudentSummary } from '@/types/dashboard'

interface AdminStudentsProps {
    students: AdminStudentSummary[]
}

export function AdminStudents({ students }: AdminStudentsProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Gestión de alumnos</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Padrón de alumnos dentro del alcance de tu escuela.</p>
            {students.length === 0 ? (
                <p className="mt-7 border border-[#e5e2e1] bg-white px-5 py-8 text-sm text-[#5c403c]">No hay alumnos registrados para este alcance.</p>
            ) : (
                <ul className="mt-7 divide-y divide-[#e5e2e1] border border-[#e5e2e1] bg-white">
                    {students.map((student) => (
                        <li className="px-5 py-4" key={student.id}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[#1c1b1b]">{student.firstName} {student.lastName}</p>
                                <span className="text-xs font-semibold text-[#8a7400]">{student.status}</span>
                            </div>
                            <p className="mt-1 text-sm text-[#5c403c]">{student.currentRank ?? 'Sin grado asignado'} · {student.branchName}</p>
                            <p className="mt-2 text-xs text-[#5c403c]">Clases activas: {student.activeClassNames.join(', ') || 'Sin asignar'}</p>
                            <Link className="mt-3 inline-flex text-sm font-semibold text-[#b70011]" href={`/dashboard/admin/alumnos/${student.id}`}>Ver ficha y ascensos</Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}