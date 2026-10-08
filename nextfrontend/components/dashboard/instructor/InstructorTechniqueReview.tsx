'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, CircleDashed, ClipboardCheck, Clock, Info, Loader2, Plus, RefreshCw, Save, Search, Star, X } from 'lucide-react'
import type { InstructorTechniqueReview as TechniqueReview, StudentTechnique, TechniqueStatus } from '@/types/dashboard'
import { KataBeltChip } from '../shared/KataBeltChip'
import { TechniqueCatalogFilter } from '../shared/TechniqueCatalogFilter'
import { KATA_CRITERION_KEYS, KATA_RUBRIC, MAX_KATA_CRITERION_SCORE, MIN_KATA_CRITERION_SCORE, averageKataCriteria, blockAverage, isCompleteKataCriteria, parseKataCriteria } from '@/lib/dashboard/kata-rubric'

interface InstructorTechniqueReviewProps {
    review: TechniqueReview
}

type StatusFilter = 'ALL' | TechniqueStatus

export function InstructorTechniqueReview({ review }: InstructorTechniqueReviewProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
    const [rubricTechnique, setRubricTechnique] = useState<StudentTechnique | null>(null)
    const [assigningId, setAssigningId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function sendUpdate(method: 'POST' | 'PATCH', body: object) {
        setError(null)
        const response = await fetch('/api/dashboard/instructor/techniques', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            setError('No fue posible guardar la evaluación. Inténtalo nuevamente.')
            return false
        }

        router.refresh()
        return true
    }

    async function assignTechnique(techniqueId: string) {
        if (assigningId) return
        setAssigningId(techniqueId)
        await sendUpdate('POST', {
            studentId: review.student.id,
            techniqueId,
            notes: null,
        })
        setAssigningId(null)
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
            <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Plan técnico</p>
                        <h2 className="mt-1 font-display text-lg font-bold text-ink">Asignar técnica para evaluación</h2>
                    </div>
                    <span className="rounded-md border border-edge-strong bg-surface-1 px-2.5 py-1 text-xs font-bold text-ink-2">{unassignedTechniques.length} disponibles</span>
                </div>
                {unassignedTechniques.length === 0 ? (
                    <p className="px-5 py-8 text-xs text-ink-3">Este alumno ya tiene asignadas todas las técnicas del catálogo.</p>
                ) : (
                    <TechniqueCatalogFilter
                        defaultProgram={review.student.program}
                        emptyMessage="No hay técnicas que coincidan con los filtros."
                        idPrefix="plan-tecnico"
                        key={review.student.id}
                        ranks={review.ranks}
                        renderActions={(technique) => (
                            <button
                                aria-label={`Asignar ${technique.name}`}
                                className="inline-flex items-center justify-center rounded-md border border-cyan-500/40 bg-cyan-500/10 p-1.5 text-accent-text transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
                                disabled={assigningId === technique.id}
                                onClick={() => void assignTechnique(technique.id)}
                                title="Asignar para evaluación"
                                type="button"
                            >
                                {assigningId === technique.id ? <Loader2 aria-label="Asignando" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
                            </button>
                        )}
                        techniques={unassignedTechniques}
                    />
                )}
            </section>

            <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
                <div className="border-b border-edge px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Seguimiento de alumno</p>
                            <h2 className="mt-1 font-display text-lg font-bold text-ink">Técnicas asignadas</h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-ok-text"><CheckCheck aria-hidden="true" className="size-3.5" />{approvedCount} revisadas</span>
                    </div>
                    {review.techniques.length > 0 && (
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {([
                                    ['ALL', 'Todas', review.techniques.length],
                                    ['PENDING', 'Por practicar', review.techniques.filter(({ status }) => status === 'PENDING').length],
                                    ['IN_PROGRESS', 'En práctica', review.techniques.filter(({ status }) => status === 'IN_PROGRESS').length],
                                    ['APPROVED', 'Revisadas', approvedCount],
                                ] as const).map(([status, label, count]) => (
                                    <button aria-pressed={statusFilter === status} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === status ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-1 text-ink-3 hover:border-edge-strong'}`} key={status} onClick={() => setStatusFilter(status)} type="button">{label} ({count})</button>
                                ))}
                            </div>
                            <label className="relative block sm:w-56" htmlFor="technique-search">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-accent" />
                                <input className="w-full rounded-md border border-edge-strong bg-surface-1 py-1.5 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica" type="search" value={searchTerm} />
                            </label>
                        </div>
                    )}
                </div>
                {review.techniques.length === 0 ? (
                    <p className="px-5 py-8 text-xs text-ink-3">Este alumno no tiene técnicas asignadas.</p>
                ) : visibleTechniques.length === 0 ? (
                    <p className="px-5 py-8 text-xs text-ink-3">No hay técnicas que coincidan con los filtros seleccionados.</p>
                ) : (
                    <ul className="divide-y divide-edge">
                        {visibleTechniques.map((technique) => (
                            <TechniqueRow key={technique.id} onOpenRubric={() => setRubricTechnique(technique)} onSave={updateTechnique} technique={technique} />
                        ))}
                    </ul>
                )}
            </section>
            {error && <p className="text-sm font-medium text-danger-text">{error}</p>}

            <KataRubricModal
                onClose={() => setRubricTechnique(null)}
                onSave={(body) => (rubricTechnique ? updateTechnique(rubricTechnique.id, body) : Promise.resolve(false))}
                technique={rubricTechnique}
            />
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
    const isKata = technique.category === 'KATA'

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
            ...(isKata ? {} : { notes: notes.trim() || null }),
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{technique.category}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{technique.name}</p>
                    {technique.level && <div className="mt-1"><KataBeltChip beltColor={technique.beltColor} beltSecondaryColor={technique.beltSecondaryColor} level={technique.level} /></div>}
                    {technique.description && <p className="mt-1 text-xs text-ink-3">{technique.description}</p>}
                    {technique.practiceHours > 0 && <p className="mt-1.5 text-xs font-semibold text-ink-2"><Clock aria-hidden="true" className="mr-1 inline size-3.5 text-accent" />{technique.practiceHours}h de práctica</p>}
                    {technique.practiceRepetitions > 0 && <p className="mt-1 text-xs font-semibold text-ink-2"><RefreshCw aria-hidden="true" className="mr-1 inline size-3.5 text-accent" />{technique.practiceRepetitions} rep.{technique.targetRepetitions ? ` / ${technique.targetRepetitions}` : ''}</p>}
                </div>
                <div aria-label={`Estado de ${technique.name}`} className="inline-flex rounded-md border border-edge-strong bg-surface-1 p-1 text-xs font-bold">
                    {([
                        ['PENDING', 'Por practicar', CircleDashed, 'bg-surface-3 text-ink', 'text-ink-3 hover:text-ink'],
                        ['IN_PROGRESS', 'En práctica', RefreshCw, 'bg-blue-500/20 text-info-text', 'text-ink-3 hover:text-ink'],
                        ['APPROVED', 'Revisada', CheckCheck, 'bg-emerald-500 text-[#0d1117]', 'text-ink-3 hover:text-ink'],
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
            {isKata ? (
                <KataEvaluationBlock onOpenRubric={onOpenRubric} saving={saving} technique={technique} />
            ) : (
                <>
                    <label className="mt-3 block text-xs font-semibold text-ink-2" htmlFor={`technique-notes-${technique.id}`}><span className="inline-flex items-center gap-1"><Info aria-hidden="true" className="size-3.5 text-accent" />Observación del instructor</span><textarea className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id={`technique-notes-${technique.id}`} onChange={(event) => setNotes(event.target.value)} placeholder="Añade una observación técnica" rows={2} value={notes} /></label>
                    <div className="mt-3 grid gap-3 border-t border-edge pt-3 sm:grid-cols-[10rem_1fr]">
                        <label className="text-xs font-semibold text-ink-2" htmlFor={`technique-score-${technique.id}`}><span className="inline-flex items-center gap-1"><Star aria-hidden="true" className="size-3.5 text-accent" />Calificación / 10</span><input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id={`technique-score-${technique.id}`} max="10" min="0" onChange={(event) => setScore(event.target.value)} placeholder="Sin nota" step="0.1" type="number" value={score} /></label>
                        <label className="text-xs font-semibold text-ink-2" htmlFor={`technique-feedback-${technique.id}`}>Feedback de evaluación<textarea className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id={`technique-feedback-${technique.id}`} onChange={(event) => setFeedback(event.target.value)} placeholder="Correcciones técnicas y próximos objetivos" rows={2} value={feedback} /></label>
                    </div>
                    {technique.evaluation && <p className="mt-2 text-xs text-ok-text/80">Última evaluación: {technique.evaluation.score}/10 · {new Date(technique.evaluation.evaluatedAt).toLocaleString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}{technique.evaluation.evaluatorName ? ` · ${technique.evaluation.evaluatorName}` : ''}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} onClick={saveEvaluation} type="button">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Guardar evaluación</button>
                    </div>
                </>
            )}
        </li>
    )
}

function KataEvaluationBlock({
    onOpenRubric,
    saving,
    technique,
}: {
    onOpenRubric: () => void
    saving: boolean
    technique: StudentTechnique
}) {
    const evaluation = technique.evaluation
    const criteria = evaluation?.criteria ?? null

    return (
        <div className="mt-3 rounded-lg border border-edge bg-surface-4/50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                    <ClipboardCheck aria-hidden="true" className="size-3.5 text-accent" />Evaluación por criterios
                </span>
                {evaluation ? (
                    <span className="font-display text-lg font-extrabold text-ok-text">{evaluation.score}<span className="text-xs font-normal text-ink-3"> / 10</span></span>
                ) : (
                    <span className="text-xs text-ink-3">Sin evaluar</span>
                )}
            </div>
            {criteria && (
                <div className="mt-2.5 space-y-2">
                    {KATA_RUBRIC.map((block) => (
                        <div key={block.key}>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-3">{block.label} · {Math.round(block.weight * 100)}%</p>
                            <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-3">
                                {block.criteria.map((criterion) => (
                                    <span key={criterion.key}>
                                        {criterion.label}: <span className="font-semibold text-ink-2">{criteria[criterion.key] ?? '—'}</span>
                                    </span>
                                ))}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            <button
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-accent-text transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
                disabled={saving}
                onClick={onOpenRubric}
                type="button"
            >
                <ClipboardCheck aria-hidden="true" className="size-4" />{evaluation ? 'Editar evaluación' : 'Evaluar con criterios'}
            </button>
        </div>
    )
}

function KataRubricModal({
    onClose,
    onSave,
    technique,
}: {
    onClose: () => void
    onSave: (body: object) => Promise<boolean>
    technique: StudentTechnique | null
}) {
    if (!technique) return null

    return <KataRubricForm key={technique.id} onClose={onClose} onSave={onSave} technique={technique} />
}

function KataRubricForm({
    onClose,
    onSave,
    technique,
}: {
    onClose: () => void
    onSave: (body: object) => Promise<boolean>
    technique: StudentTechnique
}) {
    const [scores, setScores] = useState<Record<string, string>>(() => {
        const parsed = parseKataCriteria(technique.evaluation?.criteria) ?? {}
        return Object.fromEntries(KATA_CRITERION_KEYS.map((key) => [key, parsed[key] != null ? String(parsed[key]) : '']))
    })
    const [notes, setNotes] = useState(technique.notes ?? '')
    const [feedback, setFeedback] = useState(technique.evaluation?.feedback ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const entered: Record<string, number> = {}
    for (const key of KATA_CRITERION_KEYS) {
        const raw = scores[key]
        if (raw !== '' && raw != null && Number.isFinite(Number(raw))) entered[key] = Number(raw)
    }
    const complete = isCompleteKataCriteria(entered)
    const total = complete ? averageKataCriteria(entered) : null

    async function handleSave() {
        if (!complete || saving) return
        setSaving(true)
        setError(null)
        const ok = await onSave({
            criteria: entered,
            notes: notes.trim() || null,
            feedback: feedback.trim() || null,
        })
        setSaving(false)
        if (ok) {
            onClose()
        } else {
            setError('No fue posible guardar la evaluación. Inténtalo nuevamente.')
        }
    }

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose} role="dialog">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-edge bg-surface-2 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-edge pb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-accent"><ClipboardCheck aria-hidden="true" className="size-5" /></div>
                        <div>
                            <h3 className="text-base font-bold text-ink">Evaluación de kata por criterios</h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-accent">{technique.name}</span>
                                <span className="rounded border border-edge bg-surface-4 px-2 py-0.5 text-[11px] font-medium text-ink-2">{technique.category}{technique.practiceHours > 0 ? ` · ${technique.practiceHours}h de práctica` : ''}</span>
                            </div>
                        </div>
                    </div>
                    <button aria-label="Cerrar ventana" className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-edge bg-surface-4 p-3 text-xs leading-relaxed text-ink-2"><ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" /><p>Puntúa cada criterio de 0 a 10. El total es el promedio ponderado: Desempeño Técnico 70% y Desempeño Atlético 30%.</p></div>

                {error && <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-danger-text">{error}</p>}

                <div className="mt-4 space-y-4">
                    {KATA_RUBRIC.map((block) => {
                        const subtotal = blockAverage(block, entered)
                        return (
                            <section className="rounded-lg border border-edge bg-surface-1 p-4" key={block.key}>
                                <div className="flex items-center justify-between gap-2 border-b border-edge pb-2">
                                    <h4 className="text-sm font-bold text-ink">{block.label}</h4>
                                    <span className="text-xs font-bold text-accent">{Math.round(block.weight * 100)}% · {subtotal ?? '—'}</span>
                                </div>
                                <ul className="mt-3 space-y-3">
                                    {block.criteria.map((criterion) => (
                                        <li className="grid grid-cols-[1fr_5rem] items-center gap-3" key={criterion.key}>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-ink-2">{criterion.label}</p>
                                                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-3">{criterion.description}</p>
                                            </div>
                                            <input
                                                aria-label={`${criterion.label} (0 a 10)`}
                                                className="w-full rounded-md border border-edge-strong bg-surface-2 px-2 py-1.5 text-center text-sm font-semibold text-ink outline-none focus:border-cyan-500"
                                                inputMode="numeric"
                                                max={MAX_KATA_CRITERION_SCORE}
                                                min={MIN_KATA_CRITERION_SCORE}
                                                onChange={(event) => setScores((current) => ({ ...current, [criterion.key]: event.target.value }))}
                                                placeholder="—"
                                                step="1"
                                                type="number"
                                                value={scores[criterion.key] ?? ''}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )
                    })}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-ink-2" htmlFor={`kata-notes-${technique.id}`}><span className="inline-flex items-center gap-1"><Info aria-hidden="true" className="size-3.5 text-accent" />Observación del instructor</span><textarea className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id={`kata-notes-${technique.id}`} onChange={(event) => setNotes(event.target.value)} placeholder="Añade una observación técnica" rows={3} value={notes} /></label>
                    <label className="text-xs font-semibold text-ink-2" htmlFor={`kata-feedback-${technique.id}`}>Feedback de evaluación<textarea className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id={`kata-feedback-${technique.id}`} onChange={(event) => setFeedback(event.target.value)} placeholder="Correcciones técnicas y próximos objetivos" rows={3} value={feedback} /></label>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-3">Nota final</p>
                        <p className="font-display text-2xl font-extrabold text-ink">{total ?? '—'}<span className="text-sm font-normal text-ink-3"> / 10</span></p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button className="rounded-lg border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-3" onClick={onClose} type="button">Cancelar</button>
                        <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-[#0d1117] shadow-md transition-colors hover:bg-cyan-400 disabled:opacity-50" disabled={!complete || saving} onClick={handleSave} type="button">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Guardar evaluación</button>
                    </div>
                </div>
            </div>
        </div>
    )
}