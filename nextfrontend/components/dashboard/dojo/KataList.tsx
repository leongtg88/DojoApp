'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Clock, MessageSquare, Repeat, Search, Star, Timer } from 'lucide-react'
import type { KataProgressItem, KataStatus, PracticePlace } from '@/types/dashboard'
import { KataBadge } from './KataBadge'
import { KataBeltChip } from '../shared/KataBeltChip'

type StatusFilter = 'ALL' | KataStatus

interface KataListProps {
    katas?: KataProgressItem[]
    requiredKataIds?: string[]
    onStartPractice?: (kataId: string) => void
    onSaveNote?: (kataId: string, note: string) => void
    onLogPractice?: (kataId: string, payload: { repetitions: number; place: PracticePlace; notes?: string }) => Promise<void>
    className?: string
}

const filters: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'Todas' },
    { value: 'APPROVED', label: 'Aprobadas' },
    { value: 'IN_PROGRESS', label: 'En práctica' },
    { value: 'PENDING', label: 'Por iniciar' },
]

export function KataList({ katas = [], requiredKataIds = [], onStartPractice, onSaveNote, onLogPractice, className = '' }: KataListProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
    const [showRequired, setShowRequired] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [note, setNote] = useState('')
    const [savingNoteId, setSavingNoteId] = useState<string | null>(null)
    const [repInput, setRepInput] = useState('')
    const [repPlace, setRepPlace] = useState<PracticePlace>('DOJO')
    const [savingRepsId, setSavingRepsId] = useState<string | null>(null)

    const requiredIdSet = useMemo(() => new Set(requiredKataIds), [requiredKataIds])

    const visibleKatas = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('es')
        return katas.filter((kata) => {
            const matchesSearch =
                !normalizedSearch ||
                `${kata.name} ${'Kata'}`.toLocaleLowerCase('es').includes(normalizedSearch)
            const matchesStatus = statusFilter === 'ALL' || kata.status === statusFilter
            const matchesRequired = showRequired === (requiredIdSet.size === 0 ? kata.requiredForGrade : requiredIdSet.has(kata.id))
            return matchesSearch && matchesStatus && matchesRequired
        })
    }, [katas, requiredIdSet, search, showRequired, statusFilter])

    async function handleSaveNote(kataId: string) {
        const trimmed = note.trim()
        if (!trimmed) return
        setSavingNoteId(kataId)
        await onSaveNote?.(kataId, trimmed)
        setSavingNoteId(null)
        setNote('')
        setExpandedId(null)
    }

    async function handleLogPractice(kataId: string) {
        const repetitions = Number.parseInt(repInput, 10)
        if (!Number.isFinite(repetitions) || repetitions <= 0 || savingRepsId !== null) return
        setSavingRepsId(kataId)
        await onLogPractice?.(kataId, { repetitions, place: repPlace })
        setSavingRepsId(null)
        setRepInput('')
    }

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="space-y-3 rounded-lg border border-edge bg-surface-2 p-3">
                <label className="relative block">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
                    <input
                        className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar Pinan Nidan, Bassai Dai, Seienchin..."
                        type="search"
                        value={search}
                    />
                </label>

                <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button
                            aria-pressed={statusFilter === filter.value}
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${statusFilter === filter.value ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-4 text-ink-3 hover:text-ink'}`}
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            type="button"
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {katas.some(({ requiredForGrade }) => requiredForGrade) && (
                    <div className="inline-flex rounded-md border border-edge-strong bg-surface-1 p-1 text-xs">
                        <button
                            aria-pressed={showRequired}
                            className={`rounded px-2.5 py-1.5 ${showRequired ? 'bg-emerald-500/20 text-ok-text' : 'text-ink-3'}`}
                            onClick={() => setShowRequired(true)}
                            type="button"
                        >
                            Requeridas para mi grado
                        </button>
                        <button
                            aria-pressed={!showRequired}
                            className={`rounded px-2.5 py-1.5 ${!showRequired ? 'bg-cyan-500/20 text-accent-text' : 'text-ink-3'}`}
                            onClick={() => setShowRequired(false)}
                            type="button"
                        >
                            Adicionales / asignadas
                        </button>
                    </div>
                )}
            </div>

            {visibleKatas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-edge-strong bg-surface-2 px-6 py-12 text-center text-sm text-ink-3">
                    No hay katas que coincidan con los filtros seleccionados.
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleKatas.map((kata) => {
                        const isExpanded = expandedId === kata.id
                        const isApproved = kata.status === 'APPROVED'

                        return (
                            <article className="rounded-lg border border-edge bg-surface-2 p-4 hover:border-edge-strong" key={kata.id}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-ink">{kata.name}</h3>
                                            <KataBadge status={kata.status} />
                                            {kata.requiredForGrade && (
                                                <span className="rounded-md border border-cyan-900/60 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-text">
                                                    Requerida
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-ink-3">{kata.rankName ?? 'Programa del dojo'}</p>
                                        {kata.level && <div className="mt-1"><KataBeltChip beltColor={kata.beltColor} beltSecondaryColor={kata.beltSecondaryColor} level={kata.level} /></div>}
                                    </div>
                                    <button
                                        className="inline-flex items-center gap-1 self-start text-xs font-semibold text-accent hover:text-accent-text"
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : kata.id)
                                            setNote(kata.lastFeedback ?? '')
                                            setRepInput('')
                                            setRepPlace('DOJO')
                                        }}
                                        type="button"
                                    >
                                        Detalles {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
                                    <span className="inline-flex items-center gap-1">
                                        <Timer aria-hidden="true" className="size-3.5 text-warn-text" />
                                        {kata.practiceHours} h de práctica
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Repeat aria-hidden="true" className="size-3.5 text-accent" />
                                        {kata.practiceRepetitions} rep.{kata.targetRepetitions ? ` / ${kata.targetRepetitions}` : ''}
                                    </span>
                                    {kata.score !== null && (
                                        <span className="inline-flex items-center gap-1">
                                            <Star aria-hidden="true" className="size-3.5 text-ok-text" />
                                            Nota del sensei: {kata.score} / 10
                                        </span>
                                    )}
                                    {kata.evaluatedBy && <span>Evaluado por {kata.evaluatedBy}</span>}
                                    {kata.lastPracticeDate && (
                                        <span>{new Date(kata.lastPracticeDate).toLocaleString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-3 border-t border-edge pt-4">
                                        {kata.description && (
                                            <p className="text-sm leading-6 text-ink-2">{kata.description}</p>
                                        )}
                                        {kata.lastFeedback && (
                                            <p className="flex gap-2 rounded-md border border-cyan-900/50 bg-cyan-950/20 p-3 text-xs text-accent-text">
                                                <MessageSquare aria-hidden="true" className="size-4 shrink-0 text-accent" />
                                                {kata.lastFeedback}
                                            </p>
                                        )}
                                        {!isApproved && (
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <input
                                                    className="min-w-0 flex-1 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                                                    onChange={(event) => setNote(event.target.value)}
                                                    placeholder="Nota personal de práctica..."
                                                    value={note}
                                                />
                                                <button
                                                    className="rounded-md bg-amber-500 px-3 py-2 text-xs font-bold text-[#0d1117] hover:bg-amber-400 disabled:opacity-50"
                                                    disabled={!note.trim() || savingNoteId === kata.id}
                                                    onClick={() => handleSaveNote(kata.id)}
                                                    type="button"
                                                >
                                                    {savingNoteId === kata.id ? 'Guardando...' : 'Guardar nota'}
                                                </button>
                                                {kata.status === 'PENDING' && onStartPractice && (
                                                    <button
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-warn-text hover:bg-amber-500/20"
                                                        onClick={() => onStartPractice(kata.id)}
                                                        type="button"
                                                    >
                                                        <Clock aria-hidden="true" className="size-3.5" />
                                                        Comenzar práctica
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {!isApproved && onLogPractice && (
                                            <div className="space-y-2 rounded-md border border-edge bg-surface-1 p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                                                        <Repeat aria-hidden="true" className="size-3.5" />Registrar repeticiones
                                                    </span>
                                                    <input
                                                        className="w-28 rounded-md border border-edge-strong bg-surface-2 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                                                        min={1}
                                                        onChange={(event) => setRepInput(event.target.value)}
                                                        placeholder="Ej: 50"
                                                        type="number"
                                                        value={repInput}
                                                    />
                                                    <select
                                                        className="rounded-md border border-edge-strong bg-surface-2 px-3 py-2 text-xs text-ink outline-none focus:border-cyan-500"
                                                        onChange={(event) => setRepPlace(event.target.value as PracticePlace)}
                                                        value={repPlace}
                                                    >
                                                        <option value="DOJO">En el dojo</option>
                                                        <option value="FUERA">Fuera del dojo</option>
                                                    </select>
                                                    <button
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-cyan-500 px-3 py-2 text-xs font-bold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                                                        disabled={!repInput || Number(repInput) <= 0 || savingRepsId === kata.id}
                                                        onClick={() => handleLogPractice(kata.id)}
                                                        type="button"
                                                    >
                                                        {savingRepsId === kata.id ? 'Guardando...' : 'Guardar repeticiones'}
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-ink-4">¿Falta una técnica? Pídele a tu sensei que la asigne a tu expediente.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}