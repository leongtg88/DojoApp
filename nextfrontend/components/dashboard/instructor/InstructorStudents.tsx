'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BookOpenCheck, Search, Users } from 'lucide-react'
import type { InstructorStudentSummary } from '@/types/dashboard'
import { InstructorKatasModal } from './InstructorKatasModal'

interface InstructorStudentsProps {
    students: InstructorStudentSummary[]
}

export function InstructorStudents({ students }: InstructorStudentsProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [katasFor, setKatasFor] = useState<InstructorStudentSummary | null>(null)
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const filteredStudents = normalizedSearch
        ? students.filter((student) => [
            student.firstName,
            student.lastName,
            student.currentRank ?? '',
            ...student.classNames,
        ].some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch)))
        : students

    const averageAttendance = students.length
        ? Math.round(students.reduce((sum, student) => sum + student.attendancePercent, 0) / students.length)
        : 0

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Estudiantes de la escuela</h1>
            <p className="mt-2 text-sm text-ink-3">Alumnos activos de tu escuela.</p>

            {students.length > 0 && (
                <section className="mt-6 grid gap-3 sm:grid-cols-3">
                    <article className="rounded-lg border border-edge bg-surface-2 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Alumnos activos</p>
                        <p className="mt-1 text-2xl font-bold text-ink">{students.length}</p>
                    </article>
                    <article className="rounded-lg border border-edge bg-surface-2 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Katas dominadas (promedio)</p>
                        <p className="mt-1 text-2xl font-bold text-ink">
                            {students.length ? (students.reduce((sum, student) => sum + student.masteredCount, 0) / students.length).toFixed(1) : '0.0'}
                        </p>
                    </article>
                    <article className="rounded-lg border border-edge bg-surface-2 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Asistencia (promedio)</p>
                        <p className="mt-1 text-2xl font-bold text-ok-text">{averageAttendance}%</p>
                    </article>
                </section>
            )}

            {students.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center">
                    <Users aria-hidden="true" className="mx-auto size-7 text-accent" />
                    <p className="mt-3 text-sm font-semibold text-ink">No hay alumnos activos en tu escuela.</p>
                </section>
            ) : (
                <section className="mt-7 rounded-lg border border-edge bg-surface-2 shadow-sm">
                    <div className="border-b border-edge p-4 sm:p-5">
                        <label className="relative block" htmlFor="student-search">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                            <input
                                className="w-full rounded-md border border-edge-strong bg-surface-1 py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
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
                            <Users aria-hidden="true" className="mx-auto size-6 text-accent" />
                            <p className="mt-3 text-sm font-semibold text-ink">No se encontraron alumnos.</p>
                            <p className="mt-1 text-sm text-ink-3">Prueba con otro nombre, grado o clase.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-edge">
                            {filteredStudents.map((student) => {
                                const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()
                                const masteredPct = student.requiredCount > 0
                                    ? Math.min(100, Math.round((student.masteredCount / student.requiredCount) * 100))
                                    : 0

                                return (
                                    <li key={student.id}>
                                        <Link className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-surface-3 sm:px-5" href={`/dashboard/instructor/evaluaciones?studentId=${student.id}`}>
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-sm font-extrabold text-accent-text">{initials}</span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-ink">{student.firstName} {student.lastName}</p>
                                                    <p className="mt-1 inline-flex items-center gap-2 text-xs text-ink-3">
                                                        <span aria-hidden="true" className="inline-block h-3.5 w-9 rounded-sm border border-white/30" style={{ backgroundColor: student.beltColor ?? '#3f3f46' }} />
                                                        <span>{student.currentRank ?? 'Sin grado asignado'}</span>
                                                        {student.kyuDan && <span className="text-ink-4">· {student.kyuDan}</span>}
                                                    </p>
                                                    <p className="mt-2 truncate text-xs font-semibold text-accent">{student.classNames.join(' · ') || 'Sin clases activas'}</p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setKatasFor(student)}
                                                    className="flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-cyan-900/50"
                                                    title="Asignar katas por grado al expediente"
                                                >
                                                    <BookOpenCheck className="size-3.5" aria-hidden="true" />Katas
                                                </button>
                                                <div className="hidden sm:block" title={`Katas dominadas: ${student.masteredCount} de ${student.requiredCount}`}>
                                                    <p className="text-right text-[11px] font-semibold uppercase tracking-wide text-ink-3">Katas</p>
                                                    <div className="mt-1.5 flex items-center gap-2">
                                                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3">
                                                            <div className="h-full rounded-full bg-cyan-500 transition-all duration-500" style={{ width: `${masteredPct}%` }} />
                                                        </div>
                                                        <span className="font-mono text-xs font-bold text-ink">{student.masteredCount}/{student.requiredCount}</span>
                                                    </div>
                                                </div>
                                                <div className="hidden sm:block" title={`Asistencia: ${student.attendancePercent}%`}>
                                                    <p className="text-right text-[11px] font-semibold uppercase tracking-wide text-ink-3">Asistencia</p>
                                                    <div className="mt-1.5 flex items-center gap-2">
                                                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3">
                                                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${student.attendancePercent}%` }} />
                                                        </div>
                                                        <span className="font-mono text-xs font-bold text-ok-text">{student.attendancePercent}%</span>
                                                    </div>
                                                </div>
                                                <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-ink-4 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                                            </div>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            )}

            <InstructorKatasModal
                open={katasFor !== null}
                studentId={katasFor?.id ?? ''}
                studentName={katasFor ? `${katasFor.firstName} ${katasFor.lastName}` : ''}
                onClose={() => setKatasFor(null)}
            />
        </main>
    )
}