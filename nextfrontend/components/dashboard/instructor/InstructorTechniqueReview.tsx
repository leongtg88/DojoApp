'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, CircleDashed, ClipboardCheck, Clock, Info, Loader2, Plus, RefreshCw, Save, Search, Star, X } from 'lucide-react'
import type { InstructorTechniqueReview as TechniqueReview, StudentTechnique, TechniqueStatus } from '@/types/dashboard'

interface InstructorTechniqueReviewProps {
    review: TechniqueReview
}

type StatusFilter = 'ALL' | TechniqueStatus

export function InstructorTechniqueReview({ review }: InstructorTechniqueReviewProps) {
    const router = useRouter()
    const [selectedTechniqueId, setSelectedTechniqueId] = useState('')
    const [assignmentNotes, setAssignmentNotes] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
    const [rubricTechnique, setRubricTechnique] = useState<StudentTechnique | null>(null)
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

    async function updateTechnique(techniqueId: string, body: object) {
        return sendUpdate('PATCH', { studentId: review.student.id, techniqueId, ...body })
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
                    <select className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" onChange={(event) => setSelectedTechniqueId(event.target.value)} value={selectedTechniqueId}>
                        <option value="">Selecciona una técnica</option>
                        {unassignedTechniques.map((technique) => <option key={technique.id} value={technique.id}>{technique.category}: {technique.name}</option>)}
                    </select>
                    <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" onChange={(event) => setAssignmentNotes(event.target.value)} placeholder="Observación opcional" value={assignmentNotes} />
                    <button className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={isSaving} type="submit"><Plus aria-hidden="true" className="size-4" />Asignar</button>
                </div>
            </form>

            <section className="rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                <div className="border-b border-neutral-800 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Seguimiento de alumno</p>
                            <h2 className="mt-1 font-display text-lg font-bold text-white">Técnicas asignadas</h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200"><CheckCheck aria-hidden="true" className="size-3.5" />{approvedCount} dominadas</span>
                    </div>
                    {review.techniques.length > 0 && (
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {([
                                    ['ALL', 'Todas', review.techniques.length],
                                    ['PENDING', 'Por practicar', review.techniques.filter(({ status }) => status === 'PENDING').length],
                                    ['IN_PROGRESS', 'En práctica', review.techniques.filter(({ status }) => status === 'IN_PROGRESS').length],
                                    ['APPROVED', 'Dominadas', approvedCount],
                                ] as const).map(([status, label, count]) => (
                                    <button aria-pressed={statusFilter === status} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === status ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : 'border-neutral-700 bg-[#0d1117] text-neutral-400 hover:border-neutral-500'}`} key={status} onClick={() => setStatusFilter(status)} type="button">{label} ({count})</button>
                                ))}
                            </div>
                            <label className="relative block sm:w-56" htmlFor="technique-search">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-cyan-400" />
                                <input className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-1.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica" type="search" value={searchTerm} />
                            </label>
                        </div>
                    )}
                </div>
                {review.techniques.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-400">Este alumno no tiene técnicas asignadas.</p>
                ) : visibleTechniques.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-400">No hay técnicas que coincidan con los filtros seleccionados.</p>
                ) : (
                    <ul className="divide-y divide-neutral-800">
                        {visibleTechniques.map((technique) => (
                            <TechniqueRow key={technique.id} onOpenRubric={() => setRubricTechnique(technique)} onSave={updateTechnique} technique={technique} />
                        ))}
                    </ul>
                )}
            </section>
            {error && <p className="text-sm font-medium text-red-400">{error}</p>}

            <ExamRubricModal onClose={() => setRubricTechnique(null)} technique={rubricTechnique} />
        </section>
    )
}

function TechniqueRow({
    onOpenRubric,
    onSave,
    technique,
}: {
    onOpenRubric: () => void
    onSave: (techniqueId: string, body: object) => Promise<boolean>
    technique: StudentTechnique
}) {
    const [status, setStatus] = useState<TechniqueStatus>(technique.status)
    const [notes, setNotes] = useState(technique.notes ?? '')
    const [score, setScore] = useState(technique.evaluation?.score?.toString() ?? '')
    const [feedback, setFeedback] = useState(technique.evaluation?.feedback ?? '')
    const [saving, setSaving] = useState(false)

    async function saveBody(body: object) {
        if (saving) return false
        setSaving(true)
        const ok = await onSave(technique.id, body)
        setSaving(false)
        return ok
    }

    async function selectStatus(next: TechniqueStatus) {
        if (next === status || saving) return
        const previous = status
        setStatus(next)
        const ok = await saveBody({
            approved: next === 'APPROVED',
            inPractice: next === 'IN_PROGRESS',
            notes: notes.trim() || null,
        })
        if (!ok) setStatus(previous)
    }

    async function saveEvaluation() {
        await saveBody({
            approved: status === 'APPROVED',
            inPractice: status === 'IN_PROGRESS',
            notes: notes.trim() || null,
            score: score === '' ? null : Number(score),
            feedback: feedback.trim() || null,
        })
    }

    return (
        <li className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{technique.category}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{technique.name}</p>
                    {technique.description && <p className="mt-1 text-sm text-neutral-400">{technique.description}</p>}
                    {technique.practiceHours > 0 && <p className="mt-1.5 text-xs font-semibold text-neutral-300"><Clock aria-hidden="true" className="mr-1 inline size-3.5 text-cyan-400" />{technique.practiceHours}h de práctica</p>}
                </div>
                <div aria-label={`Estado de ${technique.name}`} className="inline-flex rounded-md border border-neutral-700 bg-[#0d1117] p-1 text-xs font-bold">
                    {([
                        ['PENDING', 'Por practicar', CircleDashed, 'bg-neutral-700 text-white', 'text-neutral-400 hover:text-white'],
                        ['IN_PROGRESS', 'En práctica', RefreshCw, 'bg-blue-500/20 text-blue-200', 'text-neutral-400 hover:text-white'],
                        ['APPROVED', 'Dominada', CheckCheck, 'bg-emerald-500 text-[#0d1117]', 'text-neutral-400 hover:text-white'],
                    ] as const).map(([value, label, Icon, activeClass, idleClass]) => {
                        const isActive = status === value
                        return (
                            <button
                                aria-pressed={isActive}
                                className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors disabled:opacity-60 ${isActive ? activeClass : idleClass}`}
                                disabled={saving}
                                key={value}
                                onClick={() => selectStatus(value)}
                                type="button"
                            >
                                {saving && isActive ? <Loader2 aria-label="Guardando" className="size-3.5 animate-spin" /> : <Icon aria-hidden="true" className="size-3.5" />}
                                {label}
                            </button>
                        )
                    })}
                </div>
            </div>
            <label className="mt-3 block text-xs font-semibold text-neutral-300" htmlFor={`technique-notes-${technique.id}`}><span className="inline-flex items-center gap-1"><Info aria-hidden="true" className="size-3.5 text-cyan-400" />Observación del instructor</span><textarea className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id={`technique-notes-${technique.id}`} onChange={(event) => setNotes(event.target.value)} placeholder="Añade una observación técnica" rows={2} value={notes} /></label>
            <div className="mt-3 grid gap-3 border-t border-neutral-800 pt-3 sm:grid-cols-[10rem_1fr]">
                <label className="text-xs font-semibold text-neutral-300" htmlFor={`technique-score-${technique.id}`}><span className="inline-flex items-center gap-1"><Star aria-hidden="true" className="size-3.5 text-cyan-400" />Calificación / 10</span><input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id={`technique-score-${technique.id}`} max="10" min="0" onChange={(event) => setScore(event.target.value)} placeholder="Sin nota" step="1" type="number" value={score} /></label>
                <label className="text-xs font-semibold text-neutral-300" htmlFor={`technique-feedback-${technique.id}`}>Feedback de evaluación<textarea className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id={`technique-feedback-${technique.id}`} onChange={(event) => setFeedback(event.target.value)} placeholder="Correcciones técnicas y próximos objetivos" rows={2} value={feedback} /></label>
            </div>
            {technique.evaluation && <p className="mt-2 text-xs text-emerald-300/80">Última evaluación: {technique.evaluation.score}/10 · {new Date(technique.evaluation.evaluatedAt).toLocaleDateString('es-DO')}{technique.evaluation.evaluatorName ? ` · ${technique.evaluation.evaluatorName}` : ''}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:opacity-60" disabled={saving} onClick={() => onOpenRubric()} type="button"><ClipboardCheck aria-hidden="true" className="size-4" />Pautas de examen</button>
                <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} onClick={saveEvaluation} type="button">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Guardar evaluación</button>
            </div>
        </li>
    )
}

function ExamRubricModal({ onClose, technique }: { onClose: () => void; technique: StudentTechnique | null }) {
    if (!technique) return null

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose} role="dialog">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-800 bg-[#161616] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-cyan-400"><ClipboardCheck aria-hidden="true" className="size-5" /></div>
                        <div>
                            <h3 className="text-base font-bold text-white">Pautas de Examen Oficial</h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">{technique.name}</span>
                                <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-300">{technique.category}{technique.practiceHours > 0 ? ` · ${technique.practiceHours}h de práctica` : ''}</span>
                            </div>
                        </div>
                    </div>
                    <button aria-label="Cerrar ventana" className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs leading-relaxed text-neutral-300"><ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-400" /><p>Criterios obligatorios de evaluación estipulados por el tribunal de cinturones de Santo Domingo Dojo.</p></div>

                <div className="mt-3 flex flex-col gap-2.5">
                    {([
                        ['Postura y Estabilidad (Dachi)', 'Firmeza absoluta en Zenkutsu dachi, Kokutsu dachi y Kiba dachi sin balanceo de talón al rotar.'],
                        ['Potencia e Impacto (Kime & Hip Koshi)', 'Rotación precisa de cadera en bloqueos y golpes. Contracción muscular instantánea en el punto focal.'],
                        ['Mirada y Presencia Marcial (Chudan Metsuke)', 'La vista debe preceder al movimiento antes de cualquier desplazamiento o cambio de frente.'],
                        ['Grito Marcial (Kiai)', 'Ejecución sonora diafragmática en los puntos focales reglamentarios del embusen.'],
                    ] as const).map(([title, body]) => (
                        <div className="flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:border-neutral-800 hover:bg-neutral-900" key={title}>
                            <CheckCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                            <div>
                                <h4 className="text-xs font-bold text-white">{title}</h4>
                                <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end border-t border-neutral-800 pt-2">
                    <button className="rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-[#0d1117] shadow-md transition-colors hover:bg-cyan-400" onClick={onClose} type="button">Entendido</button>
                </div>
            </div>
        </div>
    )
}