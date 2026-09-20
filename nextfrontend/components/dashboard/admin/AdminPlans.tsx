'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Loader2, Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react'
import type { PlanSummary } from '@/types/dashboard'

interface AdminPlansProps {
    plans: PlanSummary[]
}

type PlanFormState = {
    name: string
    description: string
    monthlyHours: string
    price: string
    isUnlimited: boolean
}

const emptyForm: PlanFormState = {
    name: '',
    description: '',
    monthlyHours: '8',
    price: '',
    isUnlimited: false,
}

function formatPrice(price: number | null): string {
    return price == null ? '—' : new Intl.NumberFormat('es-DO').format(price)
}

export function AdminPlans({ plans }: AdminPlansProps) {
    const router = useRouter()
    const [editing, setEditing] = useState<PlanSummary | null>(null)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState<PlanFormState>(emptyForm)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function openCreate() {
        setCreating(true)
        setEditing(null)
        setForm(emptyForm)
        setError(null)
    }

    function openEdit(plan: PlanSummary) {
        setEditing(plan)
        setCreating(false)
        setForm({
            name: plan.name,
            description: plan.description ?? '',
            monthlyHours: String(plan.monthlyHours),
            price: plan.price == null ? '' : String(plan.price),
            isUnlimited: plan.isUnlimited,
        })
        setError(null)
    }

    async function savePlan() {
        setError(null)
        if (!form.name.trim()) {
            setError('El nombre del plan es obligatorio.')
            return
        }
        setIsSaving(true)
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                monthlyHours: Number(form.monthlyHours) || 0,
                price: form.price === '' ? null : Number(form.price),
                isUnlimited: form.isUnlimited,
            }
            const response = editing
                ? await fetch(`/api/dashboard/admin/plans/${editing.id}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                : await fetch('/api/dashboard/admin/plans', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            const data = await response.json().catch(() => null)
            if (!response.ok) {
                setError(data?.error ?? 'No se pudo guardar el plan.')
                return
            }
            setCreating(false)
            setEditing(null)
            router.refresh()
        } finally {
            setIsSaving(false)
        }
    }

    async function toggleActive(plan: PlanSummary) {
        await fetch(`/api/dashboard/admin/plans/${plan.id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ active: !plan.active }),
        })
        router.refresh()
    }

    async function deletePlan(plan: PlanSummary) {
        if (!window.confirm(`¿Eliminar el plan "${plan.name}"?`)) return
        const response = await fetch(`/api/dashboard/admin/plans/${plan.id}`, { method: 'DELETE' })
        const data = await response.json().catch(() => null)
        if (!response.ok) {
            window.alert(data?.error ?? 'No se pudo eliminar el plan.')
            return
        }
        router.refresh()
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
                    <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Planes y mensualidades</h1>
                    <p className="mt-2 max-w-xl text-sm text-ink-3">
                        Los planes definen las horas mensuales de referencia para calcular el balance de cada alumno.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
                >
                    <Plus className="size-4" aria-hidden="true" />
                    Nuevo plan
                </button>
            </div>

            {error && (
                <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-danger-text">{error}</p>
            )}

            {(creating || editing) && (
                <section className="mt-6 rounded-lg border border-edge bg-surface-2 p-5">
                    <h2 className="font-display text-lg font-bold text-ink">{editing ? 'Editar plan' : 'Nuevo plan'}</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm text-ink-2">
                            Nombre
                            <input
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                className="mt-1 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                                placeholder="Ej: Básico"
                            />
                        </label>
                        <label className="text-sm text-ink-2">
                            Horas mensuales
                            <input
                                type="number"
                                min="0"
                                max="500"
                                value={form.monthlyHours}
                                onChange={(event) => setForm({ ...form, monthlyHours: event.target.value })}
                                className="mt-1 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                            />
                        </label>
                        <label className="text-sm text-ink-2">
                            Precio (valor numérico)
                            <input
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={(event) => setForm({ ...form, price: event.target.value })}
                                className="mt-1 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                                placeholder="Ej: 2500"
                            />
                        </label>
                        <label className="mt-5 flex items-center gap-2 text-sm text-ink-2">
                            <input
                                type="checkbox"
                                checked={form.isUnlimited}
                                onChange={(event) => setForm({ ...form, isUnlimited: event.target.checked })}
                                className="size-4 accent-cyan-500"
                            />
                            Plan ilimitado (sin tope de horas)
                        </label>
                        <label className="text-sm text-ink-2 sm:col-span-2">
                            Descripción
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm({ ...form, description: event.target.value })}
                                rows={2}
                                className="mt-1 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                            />
                        </label>
                    </div>
                    <div className="mt-5 flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={savePlan}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                            Guardar
                        </button>
                        <button
                            type="button"
                            onClick={() => { setCreating(false); setEditing(null); setError(null) }}
                            className="flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3"
                        >
                            <X className="size-4" aria-hidden="true" />
                            Cancelar
                        </button>
                    </div>
                </section>
            )}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <article key={plan.id} className={`rounded-lg border bg-surface-2 p-5 ${plan.active ? 'border-edge' : 'border-edge/40 opacity-70'}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-display text-lg font-bold text-ink">{plan.name}</h3>
                                {plan.description && <p className="mt-1 text-xs text-ink-3">{plan.description}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleActive(plan)}
                                title={plan.active ? 'Desactivar plan' : 'Activar plan'}
                                className={`flex size-7 items-center justify-center rounded-md border transition-colors ${
                                    plan.active
                                        ? 'border-emerald-500/40 text-ok-text hover:bg-emerald-500/10'
                                        : 'border-edge-strong text-ink-4 hover:bg-surface-3'
                                }`}
                            >
                                {plan.active ? <Power className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                            </button>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-md bg-surface-1 px-3 py-2">
                                <dt className="text-[11px] uppercase tracking-wide text-ink-4">Horas/mes</dt>
                                <dd className="text-base font-bold text-ink">{plan.isUnlimited ? '∞' : plan.monthlyHours}</dd>
                            </div>
                            <div className="rounded-md bg-surface-1 px-3 py-2">
                                <dt className="text-[11px] uppercase tracking-wide text-ink-4">Precio</dt>
                                <dd className="text-base font-bold text-ink">{formatPrice(plan.price)}</dd>
                            </div>
                        </dl>
                        <p className="mt-3 text-xs text-ink-3">
                            {plan.studentCount != null ? `${plan.studentCount} alumnos asignados` : ''}
                        </p>
                        <div className="mt-4 flex items-center gap-2 border-t border-edge pt-3">
                            <button
                                type="button"
                                onClick={() => openEdit(plan)}
                                className="flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-3 hover:text-ink"
                            >
                                <Pencil className="size-3.5" aria-hidden="true" />
                                Editar
                            </button>
                            {plan.studentCount === 0 && (
                                <button
                                    type="button"
                                    onClick={() => deletePlan(plan)}
                                    className="flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-danger-text hover:bg-rose-500/20"
                                >
                                    <Trash2 className="size-3.5" aria-hidden="true" />
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </article>
                ))}
            </section>
        </main>
    )
}