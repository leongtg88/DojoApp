'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Clock, MessageSquare, Search, Star, Timer } from 'lucide-react'
import type { KataProgressItem, KataStatus } from '@/types/dashboard'
import { KataBadge } from './KataBadge'

type StatusFilter = 'ALL' | KataStatus

interface KataListProps {
    katas?: KataProgressItem[]
    requiredKataIds?: string[]
    onStartPractice?: (kataId: string) => void
    onSaveNote?: (kataId: string, note: string) => void
    className?: string
}

const filters: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'Todas' },
    { value: 'APPROVED', label: 'Aprobadas' },
    { value: 'IN_PROGRESS', label: 'En práctica' },
    { value: 'PENDING', label: 'Por iniciar' },
]

export function KataList({ katas = [], requiredKataIds = [], onStartPractice, onSaveNote, className = '' }: KataListProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
    const [showRequired, setShowRequired] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [note, setNote] = useState('')
    const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

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

    return (
        <section className={`space-y-4 ${className}`}>
            <div className="space-y-3 rounded-lg border border-neutral-800 bg-[#161b22] p-3">
                <label className="relative block">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-400" />
                    <input
                        className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500"
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
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${statusFilter === filter.value ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200' : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white'}`}
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            type="button"
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {katas.some(({ requiredForGrade }) => requiredForGrade) && (
                    <div className="inline-flex rounded-md border border-neutral-700 bg-[#0d1117] p-1 text-xs">
                        <button
                            aria-pressed={showRequired}
                            className={`rounded px-2.5 py-1.5 ${showRequired ? 'bg-emerald-500/20 text-emerald-200' : 'text-neutral-400'}`}
                            onClick={() => setShowRequired(true)}
                            type="button"
                        >
                            Requeridas para mi grado
                        </button>
                        <button
                            aria-pressed={!showRequired}
                            className={`rounded px-2.5 py-1.5 ${!showRequired ? 'bg-cyan-500/20 text-cyan-200' : 'text-neutral-400'}`}
                            onClick={() => setShowRequired(false)}
                            type="button"
                        >
                            Adicionales / asignadas
                        </button>
                    </div>
                )}
            </div>

            {visibleKatas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-6 py-12 text-center text-sm text-neutral-400">
                    No hay katas que coincidan con los filtros seleccionados.
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleKatas.map((kata) => {
                        const isExpanded = expandedId === kata.id
                        const isApproved = kata.status === 'APPROVED'

                        return (
                            <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-4 hover:border-neutral-700" key={kata.id}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-white">{kata.name}</h3>
                                            <KataBadge status={kata.status} />
                                            {kata.requiredForGrade && (
                                                <span className="rounded-md border border-cyan-900/60 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                                                    Requerida
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-400">{kata.rankName ?? 'Programa del dojo'}</p>
                                    </div>
                                    <button
                                        className="inline-flex items-center gap-1 self-start text-xs font-semibold text-cyan-300 hover:text-cyan-100"
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : kata.id)
                                            setNote(kata.lastFeedback ?? '')
                                        }}
                                        type="button"
                                    >
                                        Detalles {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                                    <span className="inline-flex items-center gap-1">
                                        <Timer aria-hidden="true" className="size-3.5 text-amber-400" />
                                        {kata.practiceHours} h de práctica
                                    </span>
                                    {kata.score !== null && (
                                        <span className="inline-flex items-center gap-1">
                                            <Star aria-hidden="true" className="size-3.5 text-emerald-400" />
                                            Nota del sensei: {kata.score} / 10
                                        </span>
                                    )}
                                    {kata.evaluatedBy && <span>Evaluado por {kata.evaluatedBy}</span>}
                                    {kata.lastPracticeDate && (
                                        <span>{new Date(kata.lastPracticeDate).toLocaleDateString('es-DO')}</span>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                                        {kata.description && (
                                            <p className="text-sm leading-6 text-neutral-300">{kata.description}</p>
                                        )}
                                        {kata.lastFeedback && (
                                            <p className="flex gap-2 rounded-md border border-cyan-900/50 bg-cyan-950/20 p-3 text-xs text-cyan-100">
                                                <MessageSquare aria-hidden="true" className="size-4 shrink-0 text-cyan-400" />
                                                {kata.lastFeedback}
                                            </p>
                                        )}
                                        {!isApproved && (
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <input
                                                    className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500"
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
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
                                                        onClick={() => onStartPractice(kata.id)}
                                                        type="button"
                                                    >
                                                        <Clock aria-hidden="true" className="size-3.5" />
                                                        Comenzar práctica
                                                    </button>
                                                )}
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