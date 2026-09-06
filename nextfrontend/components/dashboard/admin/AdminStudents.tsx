'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, GraduationCap, Search, Users } from 'lucide-react'
import type { AdminStudentSummary } from '@/types/dashboard'

interface AdminStudentsProps {
    students: AdminStudentSummary[]
}

export function AdminStudents({ students }: AdminStudentsProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [branchFilter, setBranchFilter] = useState('ALL')
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const statuses = [...new Set(students.map(({ status }) => status))].sort()
    const branches = [...new Set(students.map(({ branchName }) => branchName))].sort()
    const filteredStudents = students.filter((student) => {
        const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter
        const matchesBranch = branchFilter === 'ALL' || student.branchName === branchFilter
        const matchesSearch = !normalizedSearch || [
            student.firstName,
            student.lastName,
            student.currentRank ?? '',
            student.branchName,
            ...student.activeClassNames,
        ].some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))

        return matchesStatus && matchesBranch && matchesSearch
    })

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Gestión de alumnos</h1>
            <p className="mt-2 text-sm text-neutral-400">Padrón de alumnos dentro del alcance de tu escuela.</p>
            {students.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
                    <Users aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
                    <p className="mt-3 text-sm font-semibold text-white">No hay alumnos registrados para este alcance.</p>
                </section>
            ) : (
                <section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                    <div className="grid gap-3 border-b border-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:p-5">
                        <label className="relative block" htmlFor="admin-student-search">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-400" />
                            <input className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="admin-student-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por alumno, grado o clase" type="search" value={searchTerm} />
                        </label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="admin-student-status">Estado<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="admin-student-status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="ALL">Todos los estados</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="admin-student-branch">Sucursal<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="admin-student-branch" onChange={(event) => setBranchFilter(event.target.value)} value={branchFilter}><option value="ALL">Todas las sucursales</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></label>
                    </div>
                    {filteredStudents.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <Users aria-hidden="true" className="mx-auto size-6 text-[#a1918e]" />
                            <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No se encontraron alumnos.</p>
                            <p className="mt-1 text-sm text-[#5c403c]">Ajusta los filtros para ver otros expedientes.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-800">
                            {filteredStudents.map((student) => {
                                const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()

                                return (
                                    <li key={student.id}>
                                        <Link className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-neutral-800 sm:px-5" href={`/dashboard/admin/alumnos/${student.id}`}>
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-sm font-extrabold text-cyan-100">{initials}</span>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-white">{student.firstName} {student.lastName}</p><span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${student.status === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}>{student.status}</span></div>
                                                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-neutral-400"><GraduationCap aria-hidden="true" className="size-3.5 text-emerald-400" />{student.currentRank ?? 'Sin grado asignado'} · {student.branchName}</p>
                                                    <p className="mt-2 truncate text-xs font-semibold text-cyan-300">{student.activeClassNames.join(' · ') || 'Sin clases activas'}</p>
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