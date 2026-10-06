'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Search, X } from 'lucide-react'
import type { InstructorStudentSummary } from '@/types/dashboard'

interface StudentSearchSelectProps {
    students: InstructorStudentSummary[]
    studentId?: string
}

/**
 * Buscador de alumnos con dropdown (combobox) para el panel de evaluaciones.
 * Filtra la lista ya cargada por nombre, apellido o grado y navega al alumno
 * seleccionado mediante `?studentId=`.
 */
export function StudentSearchSelect({ students, studentId }: StudentSearchSelectProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const containerRef = useRef<HTMLDivElement>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)

    const selectedStudent = useMemo(
        () => students.find((student) => student.id === studentId) ?? null,
        [students, studentId],
    )

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredStudents = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
        if (!normalizedSearch) return students
        return students.filter((student) => [
            student.firstName,
            student.lastName,
            `${student.firstName} ${student.lastName}`,
            student.currentRank ?? '',
            student.kyuDan ?? '',
        ].some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch)))
    }, [students, searchTerm])

    function selectStudent(id: string) {
        setIsOpen(false)
        setSearchTerm('')
        if (id === studentId) return
        startTransition(() => {
            router.push(`/dashboard/instructor/evaluaciones?studentId=${id}`)
        })
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter')) {
            setIsOpen(true)
            return
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setHighlighted((index) => Math.min(index + 1, filteredStudents.length - 1))
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            setHighlighted((index) => Math.max(index - 1, 0))
        }
        if (event.key === 'Enter' && filteredStudents[highlighted]) {
            event.preventDefault()
            selectStudent(filteredStudents[highlighted].id)
        }
        if (event.key === 'Escape') setIsOpen(false)
    }

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-sm font-semibold text-ink" htmlFor="evaluaciones-student-search">Alumno</label>
            <div className="relative mt-1.5">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                <input
                    autoComplete="off"
                    className="w-full rounded-md border border-edge-strong bg-surface-1 py-2.5 pl-10 pr-10 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                    id="evaluaciones-student-search"
                    onChange={(event) => {
                        setSearchTerm(event.target.value)
                        setHighlighted(0)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Buscar alumno por nombre o grado…'}
                    type="search"
                    value={searchTerm}
                />
                {isPending ? (
                    <Loader2 aria-label="Cargando alumno" className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-accent" />
                ) : searchTerm ? (
                    <button aria-label="Limpiar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 transition-colors hover:text-ink" onClick={() => { setSearchTerm(''); setIsOpen(true) }} type="button">
                        <X aria-hidden="true" className="size-4" />
                    </button>
                ) : null}
            </div>

            {selectedStudent && !isOpen && (
                <p className="mt-1.5 text-xs text-ink-3">
                    Alumno actual: <span className="font-semibold text-ink-2">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                    {selectedStudent.currentRank ? ` · ${selectedStudent.currentRank}` : ''}
                </p>
            )}

            {isOpen && (
                <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-edge-strong bg-surface-1 shadow-xl">
                    {filteredStudents.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-ink-3">No se encontraron alumnos con ese criterio.</p>
                    ) : (
                        filteredStudents.slice(0, 30).map((student, index) => {
                            const isSelected = student.id === studentId
                            return (
                                <button
                                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${index === highlighted ? 'bg-cyan-500/10' : 'hover:bg-surface-3/60'}`}
                                    key={student.id}
                                    onClick={() => selectStudent(student.id)}
                                    onMouseEnter={() => setHighlighted(index)}
                                    type="button"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{student.firstName} {student.lastName}</p>
                                        <p className="truncate text-[11px] text-ink-3">
                                            {[student.currentRank ?? 'Sin grado', student.kyuDan, ...student.classNames].filter(Boolean).join(' · ') || 'Sin grado'}
                                        </p>
                                    </div>
                                    {isSelected && <Check aria-hidden="true" className="size-4 shrink-0 text-accent" />}
                                </button>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
