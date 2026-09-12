'use client'

import { useState } from 'react'
import { Loader2, Plus, Search, UserPlus, X } from 'lucide-react'
import type { InstructorStudentSearchResult } from '@/types/dashboard'

interface InstructorAddStudentModalProps {
    open: boolean
    alreadyPresentIds: Set<string>
    onAdd: (student: { id: string; firstName: string; lastName: string; currentRank: string | null }) => void
    onClose: () => void
}

export function InstructorAddStudentModal({ open, alreadyPresentIds, onAdd, onClose }: InstructorAddStudentModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<InstructorStudentSearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!open) return null

    async function search() {
        const term = query.trim()
        if (term.length < 2) return
        setSearching(true)
        setError(null)
        try {
            const response = await fetch(`/api/dashboard/instructor/students/search?q=${encodeURIComponent(term)}`)
            const payload = await response.json().catch(() => null)
            if (!response.ok) throw new Error(payload?.error ?? 'No se pudieron buscar alumnos')
            setResults(payload.students ?? [])
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Error al buscar')
            setResults([])
        } finally {
            setSearching(false)
        }
    }

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-lg border border-neutral-800 bg-[#161b22] shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                    <div>
                        <h3 className="font-display text-lg font-bold text-white">Agregar alumno al tatami</h3>
                        <p className="text-xs text-neutral-400">Busca alumnos de tu escuela aunque no estén inscritos en esta clase.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:text-white">
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search() } }}
                                placeholder="Nombre, apellido o matrícula (mín. 2 caracteres)"
                                className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500"
                            />
                        </div>
                        <button type="button" onClick={() => void search()} disabled={searching || query.trim().length < 2} className="rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50">
                            {searching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Buscar'}
                        </button>
                    </div>

                    {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                    {!searching && results.length === 0 && query.trim().length >= 2 && (
                        <p className="py-6 text-center text-sm text-neutral-500">Sin resultados.</p>
                    )}
                    {searching && (
                        <p className="flex items-center gap-2 py-6 text-center text-sm text-neutral-400">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />Buscando…
                        </p>
                    )}
                    {!searching && results.length > 0 && (
                        <ul className="max-h-64 divide-y divide-neutral-800 overflow-y-auto rounded-md border border-neutral-800">
                            {results.map((student) => {
                                const alreadyAdded = alreadyPresentIds.has(student.id)
                                return (
                                    <li key={student.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{student.firstName} {student.lastName}</p>
                                            <p className="text-xs text-neutral-400">{student.currentRank ?? 'Sin grado asignado'}</p>
                                        </div>
                                        {alreadyAdded ? (
                                            <span className="rounded border border-neutral-700 px-2 py-1 text-[11px] font-semibold text-neutral-400">Ya en la lista</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => onAdd({ id: student.id, firstName: student.firstName, lastName: student.lastName, currentRank: student.currentRank })}
                                                className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0d1117] hover:bg-emerald-400"
                                            >
                                                <UserPlus className="size-3.5" aria-hidden="true" />Agregar
                                            </button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 px-5 py-3.5">
                    <button type="button" onClick={onClose} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800">
                        <span className="flex items-center gap-1.5"><Plus className="size-3.5" aria-hidden="true" />Listo</span>
                    </button>
                </div>
            </div>
        </div>
    )
}