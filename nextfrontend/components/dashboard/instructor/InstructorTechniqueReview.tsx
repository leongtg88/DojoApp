'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, CircleDashed, Info, Plus, Save, Search, Star } from 'lucide-react'
import type { InstructorTechniqueReview as TechniqueReview } from '@/types/dashboard'

interface InstructorTechniqueReviewProps {
    review: TechniqueReview
}

export function InstructorTechniqueReview({ review }: InstructorTechniqueReviewProps) {
    const router = useRouter()
    const [selectedTechniqueId, setSelectedTechniqueId] = useState('')
    const [assignmentNotes, setAssignmentNotes] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function sendUpdate(method: 'POST' | 'PATCH', body: object) {
        setError(null)
        setIsSaving(true)
        const response = await fetch('/api/dashboard/instructor/techniques', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        setIsSaving(false)

        if (!response.ok) {
            setError('No fue posible guardar la evaluación. Inténtalo nuevamente.')
            return false
        }

        router.refresh()
        return true
    }

    async function assignTechnique(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedTechniqueId) {
            setError('Selecciona una técnica para asignar.')
            return
        }

        const saved = await sendUpdate('POST', {
            studentId: review.student.id,
            techniqueId: selectedTechniqueId,
            notes: assignmentNotes.trim() || null,
        })

        if (saved) {
            setSelectedTechniqueId('')
            setAssignmentNotes('')
        }
    }

        async function updateTechnique(techniqueId: string, approved: boolean, notes: string | null, score: number | null, feedback: string | null) {
        await sendUpdate('PATCH', {
            studentId: review.student.id,
            techniqueId,
            approved,
            notes: notes?.trim() || null,
                    score,
                    feedback: feedback?.trim() || null,
        })
    }

    const assignedTechniqueIds = new Set(review.techniques.map(({ id }) => id))
    const unassignedTechniques = review.availableTechniques.filter(({ id }) => !assignedTechniqueIds.has(id))
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const visibleTechniques = review.techniques.filter((technique) => {
        const matchesStatus = statusFilter === 'ALL' || technique.status === statusFilter
        const matchesSearch = !normalizedSearch || [technique.name, technique.description ?? '', technique.category]
            .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))

        return matchesStatus && matchesSearch
    })
    const approvedCount = review.techniques.filter(({ status }) => status === 'APPROVED').length

    return (
        <section className="mt-6 space-y-6">
            <form className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm" onSubmit={assignTechnique}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Plan técnico</p>
                        <h2 className="mt-1 font-display text-lg font-bold text-white">Asignar técnica</h2>
                    </div>
                    <span className="rounded-md border border-neutral-700 bg-[#0d1117] px-2.5 py-1 text-xs font-bold text-neutral-300">{unassignedTechniques.length} disponibles</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <select className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" onChange={(event) => setSelectedTechniqueId(event.target.value)} value={selectedTechniqueId}>
                        <option value="">Selecciona una técnica</option>
                        {unassignedTechniques.map((technique) => <option key={technique.id} value={technique.id}>{technique.category}: {technique.name}</option>)}
                    </select>
                    <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-neutral-500" onChange={(event) => setAssignmentNotes(event.target.value)} placeholder="Observación opcional" value={assignmentNotes} />
                    <button className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] disabled:opacity-60" disabled={isSaving} type="submit"><Plus aria-hidden="true" className="size-4" />Asignar</button>
                </div>
            </form>

            <section className="rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                <div className="border-b border-neutral-800 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Seguimiento de alumno</p>
                            <h2 className="mt-1 font-display text-lg font-bold text-white">Técnicas asignadas</h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200"><CheckCheck aria-hidden="true" className="size-3.5" />{approvedCount} aprobadas</span>
                    </div>
                    {review.techniques.length > 0 && (
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {([
                                    ['ALL', 'Todas', review.techniques.length],
                                    ['PENDING', 'Pendientes', review.techniques.length - approvedCount],
                                    ['APPROVED', 'Aprobadas', approvedCount],
                                ] as const).map(([status, label, count]) => (
                                    <button aria-pressed={statusFilter === status} className={`shrink-0 border px-3 py-1.5 text-xs font-bold ${statusFilter === status ? 'border-[#1c1b1b] bg-[#1c1b1b] text-white' : 'border-[#e5e2e1] bg-white text-[#5c403c] hover:border-[#a1918e]'}`} key={status} onClick={() => setStatusFilter(status)} type="button">{label} ({count})</button>
                                ))}
                            </div>
                            <label className="relative block sm:w-56" htmlFor="technique-search">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8a7400]" />
                                <input className="w-full border border-[#d8d1cf] bg-[#fcf9f8] py-1.5 pl-9 pr-3 text-xs outline-none focus:border-[#b70011]" id="technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica" type="search" value={searchTerm} />
                            </label>
                        </div>
                    )}
                </div>
                {review.techniques.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#5c403c]">Este alumno no tiene técnicas asignadas.</p>
                ) : visibleTechniques.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#5c403c]">No hay técnicas que coincidan con los filtros seleccionados.</p>
                ) : (
                    <ul className="divide-y divide-[#e5e2e1]">
                        {visibleTechniques.map((technique) => (
                            <TechniqueRow isSaving={isSaving} key={technique.id} onSave={updateTechnique} technique={technique} />
                        ))}
                    </ul>
                )}
            </section>
            {error && <p className="text-sm font-medium text-[#b70011]">{error}</p>}
        </section>
    )
}

function TechniqueRow({
    isSaving,
    onSave,
    technique,
}: {
    isSaving: boolean
    onSave: (techniqueId: string, approved: boolean, notes: string | null, score: number | null, feedback: string | null) => Promise<void>
    technique: TechniqueReview['techniques'][number]
}) {
    const [approved, setApproved] = useState(technique.status === 'APPROVED')
    const [notes, setNotes] = useState(technique.notes ?? '')
    const [score, setScore] = useState(technique.evaluation?.score?.toString() ?? '')
    const [feedback, setFeedback] = useState(technique.evaluation?.feedback ?? '')

    return (
        <li className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">{technique.category}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">{technique.name}</p>
                    {technique.description && <p className="mt-1 text-sm text-[#5c403c]">{technique.description}</p>}
                </div>
                <div aria-label={`Estado de ${technique.name}`} className="inline-flex border border-[#d8d1cf] p-1 text-xs font-bold">
                    <button aria-pressed={!approved} className={`inline-flex items-center gap-1 px-2.5 py-1.5 ${!approved ? 'bg-[#e5e2e1] text-[#5c403c]' : 'text-[#5c403c] hover:bg-[#f0edec]'}`} onClick={() => setApproved(false)} type="button"><CircleDashed aria-hidden="true" className="size-3.5" />Pendiente</button>
                    <button aria-pressed={approved} className={`inline-flex items-center gap-1 px-2.5 py-1.5 ${approved ? 'bg-[#5b7f38] text-white' : 'text-[#5c403c] hover:bg-[#f0edec]'}`} onClick={() => setApproved(true)} type="button"><CheckCheck aria-hidden="true" className="size-3.5" />Aprobada</button>
                </div>
            </div>
            <label className="mt-3 block text-xs font-semibold text-[#5c403c]" htmlFor={`technique-notes-${technique.id}`}><span className="inline-flex items-center gap-1"><Info aria-hidden="true" className="size-3.5 text-[#8a7400]" />Observación del instructor</span><textarea className="mt-1.5 w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm font-normal text-[#1c1b1b] outline-none focus:border-[#b70011]" id={`technique-notes-${technique.id}`} onChange={(event) => setNotes(event.target.value)} placeholder="Añade una observación técnica" rows={2} value={notes} /></label>
            <div className="mt-3 grid gap-3 border-t border-[#e5e2e1] pt-3 sm:grid-cols-[10rem_1fr]">
                <label className="text-xs font-semibold text-[#5c403c]" htmlFor={`technique-score-${technique.id}`}><span className="inline-flex items-center gap-1"><Star aria-hidden="true" className="size-3.5 text-[#8a7400]" />Calificación / 10</span><input className="mt-1.5 w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm font-normal text-[#1c1b1b] outline-none focus:border-[#b70011]" id={`technique-score-${technique.id}`} max="10" min="0" onChange={(event) => setScore(event.target.value)} placeholder="Sin nota" step="1" type="number" value={score} /></label>
                <label className="text-xs font-semibold text-[#5c403c]" htmlFor={`technique-feedback-${technique.id}`}>Feedback de evaluación<textarea className="mt-1.5 w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm font-normal text-[#1c1b1b] outline-none focus:border-[#b70011]" id={`technique-feedback-${technique.id}`} onChange={(event) => setFeedback(event.target.value)} placeholder="Correcciones técnicas y próximos objetivos" rows={2} value={feedback} /></label>
            </div>
            {technique.evaluation && <p className="mt-2 text-xs text-[#5b7f38]">Última evaluación: {technique.evaluation.score}/10 · {new Date(technique.evaluation.evaluatedAt).toLocaleDateString('es-DO')}{technique.evaluation.evaluatorName ? ` · ${technique.evaluation.evaluatorName}` : ''}</p>}
            <button className="mt-3 inline-flex items-center gap-2 border border-[#b70011] px-3 py-2 text-sm font-semibold text-[#b70011] disabled:opacity-60" disabled={isSaving} onClick={() => onSave(technique.id, approved, notes, score === '' ? null : Number(score), feedback)} type="button"><Save aria-hidden="true" className="size-4" />Guardar evaluación</button>
        </li>
    )
}