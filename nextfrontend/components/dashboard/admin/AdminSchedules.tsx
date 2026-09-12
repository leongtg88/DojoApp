'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarPlus, Check, Loader2, Pencil, Plus, Power, Save, Search, Users, X } from 'lucide-react'
import { DAY_LABELS } from '@/lib/dashboard/balance'
import type { AdminScheduleSummary, AdminStudentSummary, ScheduleAudience } from '@/types/dashboard'

interface AdminSchedulesProps {
    schedules: AdminScheduleSummary[]
    students: AdminStudentSummary[]
}

type ScheduleFormState = {
    name: string
    description: string
    audience: ScheduleAudience
    dayOfWeek: number
    startTime: string
    endTime: string
}

const emptyForm: ScheduleFormState = {
    name: '',
    description: '',
    audience: 'MIXED',
    dayOfWeek: 1,
    startTime: '19:00',
    endTime: '20:30',
}

const AUDIENCE_LABELS: Record<ScheduleAudience, string> = {
    ADULTS: 'Adultos',
    CHILDREN: 'Niños',
    MIXED: 'Mixta',
}

export function AdminSchedules({ schedules, students }: AdminSchedulesProps) {
    const router = useRouter()
    const [editing, setEditing] = useState<AdminScheduleSummary | null>(null)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState<ScheduleFormState>(emptyForm)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Modal de inscripción
    const [enrollingIn, setEnrollingIn] = useState<AdminScheduleSummary | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')

    const groupedByName = new Map<string, AdminScheduleSummary[]>()
    for (const schedule of schedules) {
        const list = groupedByName.get(schedule.name) ?? []
        list.push(schedule)
        groupedByName.set(schedule.name, list)
    }

    function openCreate() {
        setCreating(true)
        setEditing(null)
        setForm(emptyForm)
        setError(null)
    }

    function openEdit(schedule: AdminScheduleSummary) {
        setEditing(schedule)
        setCreating(false)
        setForm({
            name: schedule.name,
            description: schedule.description ?? '',
            audience: schedule.audience,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
        })
        setError(null)
    }

    async function saveSchedule() {
        setError(null)
        if (!form.name.trim()) {
            setError('El nombre del horario es obligatorio.')
            return
        }
        setIsSaving(true)
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                audience: form.audience,
                dayOfWeek: form.dayOfWeek,
                startTime: form.startTime,
                endTime: form.endTime,
            }
            const response = editing
                ? await fetch(`/api/dashboard/admin/classes/${editing.id}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                : await fetch('/api/dashboard/admin/classes', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            const data = await response.json().catch(() => null)
            if (!response.ok) {
                setError(data?.error ?? 'No se pudo guardar el horario.')
                return
            }
            setCreating(false)
            setEditing(null)
            router.refresh()
        } finally {
            setIsSaving(false)
        }
    }

    async function toggleActive(schedule: AdminScheduleSummary) {
        await fetch(`/api/dashboard/admin/classes/${schedule.id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ active: !schedule.active }),
        })
        router.refresh()
    }

    async function deleteSchedule(schedule: AdminScheduleSummary) {
        if (!window.confirm(`¿Eliminar el horario "${schedule.name}"?`)) return
        const response = await fetch(`/api/dashboard/admin/classes/${schedule.id}`, { method: 'DELETE' })
        const data = await response.json().catch(() => null)
        if (!response.ok || data?.deactivated === false) {
            window.alert(data?.message ?? 'No se pudo eliminar el horario.')
        }
        router.refresh()
    }

    function openEnroll(schedule: AdminScheduleSummary) {
        setEnrollingIn(schedule)
        setSelected(new Set())
        setSearch('')
    }

    async function saveEnroll() {
        if (!enrollingIn) return
        await fetch(`/api/dashboard/admin/classes/${enrollingIn.id}/enroll`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ studentIds: [...selected] }),
        })
        setEnrollingIn(null)
        router.refresh()
    }

    const normalizedSearch = search.trim().toLocaleLowerCase('es')
    const filteredStudents = students.filter((student) =>
        `${student.firstName} ${student.lastName}`.toLocaleLowerCase('es').includes(normalizedSearch)
    )
    const currentEnrolledIds = new Set(
        enrollingIn
            ? students.filter((student) => student.activeClassNames.includes(enrollingIn.name)).map((student) => student.id)
            : [],
    )

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
                    <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Horarios</h1>
                    <p className="mt-2 max-w-xl text-sm text-neutral-400">
                        Los horarios se agrupan por nombre en la vista semanal. Cada día con su propio bloque.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
                >
                    <Plus className="size-4" aria-hidden="true" />
                    Nuevo horario
                </button>
            </div>

            {error && (
                <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
            )}

            {(creating || editing) && (
                <section className="mt-6 rounded-lg border border-neutral-800 bg-[#161b22] p-5">
                    <h2 className="font-display text-lg font-bold text-white">{editing ? 'Editar horario' : 'Nuevo horario'}</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="text-sm text-neutral-300 lg:col-span-3">
                            Nombre del bloque
                            <input
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                placeholder="Ej: Adultos Noche (mismo nombre para Lunes y Miércoles)"
                            />
                        </label>
                        <label className="text-sm text-neutral-300">
                            Audiencia
                            <select
                                value={form.audience}
                                onChange={(event) => setForm({ ...form, audience: event.target.value as ScheduleAudience })}
                                className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                            >
                                <option value="ADULTS">Adultos</option>
                                <option value="CHILDREN">Niños</option>
                                <option value="MIXED">Mixta</option>
                            </select>
                        </label>
                        <label className="text-sm text-neutral-300">
                            Día
                            <select
                                value={form.dayOfWeek}
                                onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })}
                                className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                            >
                                {DAY_LABELS.map((label, index) => (
                                    <option key={label} value={index}>{label}</option>
                                ))}
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="text-sm text-neutral-300">
                                Inicio
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                                    className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                />
                            </label>
                            <label className="text-sm text-neutral-300">
                                Fin
                                <input
                                    type="time"
                                    value={form.endTime}
                                    onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                                    className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                />
                            </label>
                        </div>
                        <label className="text-sm text-neutral-300 lg:col-span-3">
                            Descripción
                            <input
                                value={form.description}
                                onChange={(event) => setForm({ ...form, description: event.target.value })}
                                className="mt-1 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                            />
                        </label>
                    </div>
                    <div className="mt-5 flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={saveSchedule}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                            Guardar
                        </button>
                        <button
                            type="button"
                            onClick={() => { setCreating(false); setEditing(null); setError(null) }}
                            className="flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
                        >
                            <X className="size-4" aria-hidden="true" />
                            Cancelar
                        </button>
                    </div>
                </section>
            )}

            <section className="mt-7 grid gap-4 lg:grid-cols-2">
                {[...groupedByName.entries()].map(([name, blocks]) => {
                    const sortedBlocks = blocks.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    const activeCount = blocks.filter((block) => block.active).length
                    const totalEnrolled = blocks.reduce((sum, block) => sum + (block.activeStudentCount ?? 0), 0)
                    return (
                        <article key={name} className={`rounded-lg border bg-[#161b22] p-5 ${activeCount === 0 ? 'border-neutral-800/40 opacity-70' : 'border-neutral-800'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-display text-lg font-bold text-white">{name}</h3>
                                    <p className="mt-1 text-xs text-neutral-400">
                                        <span className="mr-1.5 inline-block rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                                            {blocks[0] ? AUDIENCE_LABELS[blocks[0].audience] : '—'}
                                        </span>
                                        {totalEnrolled} alumnos inscritos
                                    </p>
                                </div>
                            </div>
                            <ul className="mt-4 space-y-2">
                                {sortedBlocks.map((schedule) => (
                                    <li key={schedule.id} className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-[#0d1117] px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <CalendarPlus className="size-4 text-cyan-400" aria-hidden="true" />
                                            <div>
                                                <p className="text-sm font-semibold text-white">{DAY_LABELS[schedule.dayOfWeek]}</p>
                                                <p className="text-xs text-neutral-400">
                                                    {schedule.startTime} – {schedule.endTime}
                                                    {schedule.instructorName ? ` · ${schedule.instructorName}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openEnroll(schedule)}
                                                title="Inscribir alumnos"
                                                className="flex size-7 items-center justify-center rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                                            >
                                                <Users className="size-3.5" aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(schedule)}
                                                title="Editar"
                                                className="flex size-7 items-center justify-center rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                                            >
                                                <Pencil className="size-3.5" aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(schedule)}
                                                title={schedule.active ? 'Desactivar' : 'Activar'}
                                                className={`flex size-7 items-center justify-center rounded-md border ${
                                                    schedule.active
                                                        ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                                                        : 'border-emerald-500/40 text-emerald-400'
                                                }`}
                                            >
                                                {schedule.active ? <Power className="size-3.5" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteSchedule(schedule)}
                                                title="Eliminar"
                                                className="flex size-7 items-center justify-center rounded-md border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                            >
                                                <X className="size-3.5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    )
                })}
            </section>

            {enrollingIn && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEnrollingIn(null)}>
                    <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-neutral-800 bg-[#161b22] shadow-xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                            <h3 className="font-display text-lg font-bold text-white">Inscribir alumnos · {enrollingIn.name}</h3>
                            <button type="button" onClick={() => setEnrollingIn(null)} className="rounded-md p-1 text-neutral-400 hover:text-white">
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="border-b border-neutral-800 px-5 py-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar alumno..."
                                    className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                        <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                            {filteredStudents.map((student) => {
                                const isIn = currentEnrolledIds.has(student.id)
                                const isChecked = selected.has(student.id)
                                return (
                                    <li key={student.id}>
                                        <label className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isIn ? 'cursor-default text-neutral-500' : 'cursor-pointer text-neutral-200 hover:bg-neutral-800'}`}>
                                            <input
                                                type="checkbox"
                                                disabled={isIn}
                                                checked={isChecked || isIn}
                                                onChange={(event) => {
                                                    const next = new Set(selected)
                                                    if (event.target.checked) next.add(student.id)
                                                    else next.delete(student.id)
                                                    setSelected(next)
                                                }}
                                                className="size-4 accent-cyan-500"
                                            />
                                            <span className="font-medium">{student.firstName} {student.lastName}</span>
                                            <span className="ml-auto text-xs text-neutral-500">{student.currentRank ?? 'Sin grado'}</span>
                                        </label>
                                    </li>
                                )
                            })}
                            {filteredStudents.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">Sin resultados.</li>}
                        </ul>
                        <div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 px-5 py-3.5">
                            <button
                                type="button"
                                onClick={() => setEnrollingIn(null)}
                                className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveEnroll}
                                disabled={selected.size === 0}
                                className="flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50"
                            >
                                <Check className="size-4" aria-hidden="true" />
                                Inscribir ({selected.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}