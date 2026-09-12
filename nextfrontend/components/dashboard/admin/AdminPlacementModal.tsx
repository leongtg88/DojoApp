'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { DAY_LABELS } from '@/lib/dashboard/balance'
import type { PlanSummary, ScholarshipType, ScheduleOption } from '@/types/dashboard'

interface AdminPlacementModalProps {
    open: boolean
    studentId: string
    studentName: string
    initialPlanId: string | null
    initialSchedules: string[]
    initialScholarshipType: ScholarshipType
    initialScholarshipNote: string | null
    initialIsCompetitor: boolean
    onClose: () => void
}

const SCHOLARSHIP_LABELS: Record<ScholarshipType, string> = {
    NONE: 'Sin beca',
    ECONOMIC: 'Beca económica',
    MERIT: 'Beca por mérito',
    COMPETITOR: 'Beca competidor',
}

export function AdminPlacementModal({
    open,
    studentId,
    studentName,
    initialPlanId,
    initialSchedules,
    initialScholarshipType,
    initialScholarshipNote,
    initialIsCompetitor,
    onClose,
}: AdminPlacementModalProps) {
    const router = useRouter()
    const [plans, setPlans] = useState<PlanSummary[]>([])
    const [schedules, setSchedules] = useState<ScheduleOption[]>([])
    const [planId, setPlanId] = useState<string>('')
    const [scheduleIds, setScheduleIds] = useState<string[]>([])
    const [scholarshipType, setScholarshipType] = useState<ScholarshipType>('NONE')
    const [scholarshipNote, setScholarshipNote] = useState('')
    const [isCompetitor, setIsCompetitor] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [wasOpen, setWasOpen] = useState(open)

    if (open && !wasOpen) {
        setWasOpen(true)
        setError(null)
        setPlanId(initialPlanId ?? '')
        setScheduleIds(initialSchedules)
        setScholarshipType(initialScholarshipType)
        setScholarshipNote(initialScholarshipNote ?? '')
        setIsCompetitor(initialIsCompetitor)
        if (plans.length === 0) setIsLoading(true)
    } else if (!open && wasOpen) {
        setWasOpen(false)
    }

    useEffect(() => {
        if (!open) return
        void Promise.all([
            fetch('/api/dashboard/admin/plans').then((response) => response.json()),
            fetch('/api/dashboard/admin/classes').then((response) => response.json()),
        ]).then(([planPayload, schedulePayload]) => {
            setPlans(planPayload.plans ?? [])
            setSchedules(schedulePayload.classes ?? [])
        }).catch(() => setError('No se pudieron cargar los planes y horarios.')).finally(() => setIsLoading(false))
    }, [open])

    if (!open) return null

    function toggleSchedule(id: string) {
        setScheduleIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    }

    async function save() {
        setError(null)
        setIsSaving(true)
        try {
            const response = await fetch(`/api/dashboard/admin/students/${studentId}/placement`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    planId: planId || null,
                    scheduleIds,
                    scholarshipType,
                    scholarshipNote: scholarshipNote.trim() || null,
                    isCompetitor,
                }),
            })
            const data = await response.json().catch(() => null)
            if (!response.ok) {
                setError(data?.error ?? 'No se pudo guardar la asignación.')
                return
            }
            router.refresh()
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    const grouped = new Map<number, ScheduleOption[]>()
    for (const schedule of schedules) {
        if (!schedule.active) continue
        const list = grouped.get(schedule.dayOfWeek) ?? []
        list.push(schedule)
        grouped.set(schedule.dayOfWeek, list)
    }

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-neutral-800 bg-[#161b22] shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                    <div>
                        <h3 className="font-display text-lg font-bold text-white">Plan, horarios y beca</h3>
                        <p className="text-xs text-neutral-400">{studentName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:text-white">
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                    {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</p>}
                    {isLoading ? (
                        <p className="flex items-center gap-2 py-10 text-sm text-neutral-400">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />Cargando opciones…
                        </p>
                    ) : (
                        <>
                            <fieldset>
                                <legend className="text-xs font-bold uppercase tracking-wide text-neutral-400">Plan de mensualidad</legend>
                                <select
                                    value={planId}
                                    onChange={(event) => setPlanId(event.target.value)}
                                    className="mt-2 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                >
                                    <option value="">Sin plan asignado</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} · {plan.isUnlimited ? 'ilimitado' : `${plan.monthlyHours} h/mes`}{plan.price != null ? ` · ${plan.price}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </fieldset>

                            <fieldset>
                                <legend className="text-xs font-bold uppercase tracking-wide text-neutral-400">Horarios de referencia</legend>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {[...grouped.entries()].sort(([a], [b]) => a - b).map(([day, blocks]) => (
                                        <div key={day} className="rounded-md border border-neutral-800 bg-[#0d1117] p-3">
                                            <p className="mb-2 text-xs font-bold text-neutral-300">{DAY_LABELS[day]}</p>
                                            <div className="space-y-1.5">
                                                {blocks.map((schedule) => {
                                                    const checked = scheduleIds.includes(schedule.id)
                                                    return (
                                                        <label key={schedule.id} className="flex items-center gap-2 text-sm text-neutral-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleSchedule(schedule.id)}
                                                                className="size-4 accent-cyan-500"
                                                            />
                                                            <span>{schedule.name}</span>
                                                            <span className="ml-auto text-xs text-neutral-500">{schedule.startTime}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {grouped.size === 0 && <p className="text-sm text-neutral-500">No hay horarios activos.</p>}
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend className="text-xs font-bold uppercase tracking-wide text-neutral-400">Beca / competencia</legend>
                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                    <label className="text-sm text-neutral-300">
                                        Tipo de beca
                                        <select
                                            value={scholarshipType}
                                            onChange={(event) => setScholarshipType(event.target.value as ScholarshipType)}
                                            className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                        >
                                            {(Object.keys(SCHOLARSHIP_LABELS) as ScholarshipType[]).map((type) => (
                                                <option key={type} value={type}>{SCHOLARSHIP_LABELS[type]}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="mt-5 flex items-center gap-2 text-sm text-neutral-300">
                                        <input
                                            type="checkbox"
                                            checked={isCompetitor}
                                            onChange={(event) => setIsCompetitor(event.target.checked)}
                                            className="size-4 accent-cyan-500"
                                        />
                                        Competidor (alto rendimiento)
                                    </label>
                                    <label className="text-sm text-neutral-300 sm:col-span-2">
                                        Nota de la beca
                                        <input
                                            value={scholarshipNote}
                                            onChange={(event) => setScholarshipNote(event.target.value)}
                                            className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                            placeholder="Ej: apoyo económico por situación familiar"
                                        />
                                    </label>
                                </div>
                            </fieldset>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 px-5 py-3.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={isSaving || isLoading}
                        className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                        Guardar asignación
                    </button>
                </div>
            </div>
        </div>
    )
}