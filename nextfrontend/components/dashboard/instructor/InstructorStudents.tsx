'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, GraduationCap, Search, Users } from 'lucide-react'
import type { InstructorStudentSummary } from '@/types/dashboard'

interface InstructorStudentsProps {
    students: InstructorStudentSummary[]
}

export function InstructorStudents({ students }: InstructorStudentsProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const filteredStudents = normalizedSearch
        ? students.filter((student) => [
            student.firstName,
            student.lastName,
            student.currentRank ?? '',
            ...student.classNames,
        ].some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch)))
        : students

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Mis estudiantes</h1>
            <p className="mt-2 text-sm text-neutral-400">Alumnos inscritos activamente en tus clases.</p>

            {students.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
                    <Users aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
                    <p className="mt-3 text-sm font-semibold text-white">No hay alumnos activos en tus clases.</p>
                </section>
            ) : (
                <section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                    <div className="border-b border-neutral-800 p-4 sm:p-5">
                        <label className="relative block" htmlFor="student-search">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-400" />
                            <input
                                className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500"
                                id="student-search"
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Buscar por alumno, grado o clase"
                                type="search"
                                value={searchTerm}
                            />
                        </label>
                    </div>
                    {filteredStudents.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <Users aria-hidden="true" className="mx-auto size-6 text-cyan-400" />
                            <p className="mt-3 text-sm font-semibold text-white">No se encontraron alumnos.</p>
                            <p className="mt-1 text-sm text-neutral-400">Prueba con otro nombre, grado o clase.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-800">
                            {filteredStudents.map((student) => {
                                const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()

                                return (
                                    <li key={student.id}>
                                        <Link className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-neutral-800 sm:px-5" href={`/dashboard/instructor/evaluaciones?studentId=${student.id}`}>
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-sm font-extrabold text-cyan-100">{initials}</span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-white">{student.firstName} {student.lastName}</p>
                                                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-neutral-400"><GraduationCap aria-hidden="true" className="size-3.5 text-emerald-400" />{student.currentRank ?? 'Sin grado asignado'}</p>
                                                    <p className="mt-2 truncate text-xs font-semibold text-cyan-300">{student.classNames.join(' · ')}</p>
                                                </div>
                                            </div>
                                            <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            )}
        </main>
    )
}