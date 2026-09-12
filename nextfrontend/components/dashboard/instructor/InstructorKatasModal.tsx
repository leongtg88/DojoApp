'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpenCheck, CheckCircle2, ChevronDown, Loader2, Save, X } from 'lucide-react'
import type { InstructorKataAssignmentData, InstructorKataGrade } from '@/types/dashboard'

interface InstructorKatasModalProps {
    open: boolean
    studentId: string
    studentName: string
    onClose: () => void
}

export function InstructorKatasModal({ open, studentId, studentName, onClose }: InstructorKatasModalProps) {
    const router = useRouter()
    const [data, setData] = useState<InstructorKataAssignmentData | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [wasOpen, setWasOpen] = useState(open)

    if (open && !wasOpen) {
        setWasOpen(true)
        setError(null)
        setData(null)
        setLoading(true)
    } else if (!open && wasOpen) {
        setWasOpen(false)
    }

    useEffect(() => {
        if (!open) return
        fetch(`/api/dashboard/instructor/students/${studentId}/katas`)
            .then(async (response) => {
                const payload = await response.json().catch(() => null)
                if (!response.ok) throw new Error(payload?.error ?? 'No se pudo cargar el expediente')
                setData(payload)
                const first = payload.grades?.find((grade: InstructorKataGrade) => grade.katas.length > 0)
                if (first) setExpanded(new Set([first.rankId]))
            })
            .catch((cause: Error) => setError(cause.message))
            .finally(() => setLoading(false))
    }, [open, studentId])

    if (!open) return null

    function toggleGrade(rankId: string) {
        setExpanded((current) => {
            const next = new Set(current)
            if (next.has(rankId)) next.delete(rankId)
            else next.add(rankId)
            return next
        })
    }

    function toggleKata(grade: InstructorKataGrade, kataId: string) {
        setData((current) => {
            if (!current) return current
            const grades = current.grades.map((gradeItem) => {
                if (gradeItem.rankId !== grade.rankId) return gradeItem
                const katas = gradeItem.katas.map((kataItem) =>
                    kataItem.id === kataId ? { ...kataItem, assigned: !kataItem.assigned } : kataItem
                )
                return { ...gradeItem, katas }
            })
            return { ...current, grades }
        })
    }

    async function save() {
        if (!data) return
        setSaving(true)
        setError(null)
        try {
            const techniqueIds = data.grades.flatMap((grade) => grade.katas.filter(({ assigned }) => assigned).map(({ id }) => id))
            const response = await fetch('/api/dashboard/instructor/techniques/assign', {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ studentId, techniqueIds }),
            })
            const payload = await response.json().catch(() => null)
            if (!response.ok) throw new Error(payload?.error ?? 'No se pudo guardar la asignación')
            router.refresh()
            onClose()
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    const totalAssigned = data?.grades.reduce((sum, grade) => sum + grade.katas.filter(({ assigned }) => assigned).length, 0) ?? 0

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-neutral-800 bg-[#161b22] shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                    <div>
                        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                            <BookOpenCheck className="size-5 text-cyan-400" aria-hidden="true" />
                            Asignar katas al expediente
                        </h3>
                        <p className="mt-0.5 text-xs text-neutral-400">{studentName}{data?.currentRank ? ` · ${data.currentRank}` : ''}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:text-white">
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                    {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                    {loading && (
                        <p className="flex items-center gap-2 py-10 text-sm text-neutral-400">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />Cargando grados y katas…
                        </p>
                    )}

                    {!loading && data && (
                        <>
                            <p className="text-xs text-neutral-400">Marca las katas que formarán parte del expediente del alumno por grado. ({totalAssigned} seleccionadas)</p>
                            {data.grades.map((grade) => {
                                const isOpen = expanded.has(grade.rankId)
                                const assignedInGrade = grade.katas.filter(({ assigned }) => assigned).length
                                return (
                                    <div key={grade.rankId} className="overflow-hidden rounded-md border border-neutral-800 bg-[#0d1117]">
                                        <button type="button" onClick={() => toggleGrade(grade.rankId)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-neutral-800/50">
                                            <span className="flex items-center gap-2 text-sm font-semibold text-white">
                                                <ChevronDown aria-hidden="true" className={`size-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                {grade.isMaximumRank ? 'Grado máximo' : `Grado ${grade.order}`} {grade.kyuDan ? `· ${grade.kyuDan}` : ''}
                                            </span>
                                            <span className="text-xs text-neutral-400">{assignedInGrade}/{grade.katas.length}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="divide-y divide-neutral-800/60 border-t border-neutral-800">
                                                {grade.katas.map((kata) => (
                                                    <label key={kata.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-neutral-800/40">
                                                        <input
                                                            type="checkbox"
                                                            checked={kata.assigned}
                                                            onChange={() => toggleKata(grade, kata.id)}
                                                            className="size-4 accent-cyan-500"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm text-white">{kata.name}{kata.kanji ? <span className="ml-1.5 text-neutral-500">{kata.kanji}</span> : null}</p>
                                                            {kata.description && <p className="truncate text-[11px] text-neutral-500">{kata.description}</p>}
                                                        </div>
                                                        {kata.status === 'APPROVED' && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                                                <CheckCircle2 className="size-3" aria-hidden="true" />Aprobada
                                                            </span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 px-5 py-3.5">
                    <button type="button" onClick={onClose} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving || loading || !data}
                        className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                        Guardar asignación
                    </button>
                </div>
            </div>
        </div>
    )
}