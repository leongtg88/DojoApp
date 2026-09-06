'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, CheckSquare, Clock, GraduationCap, ListChecks, Loader2, MoveDown, MoveUp, Pencil, Plus, Rows3, ShieldCheck, Square, Trash2, Users, X } from 'lucide-react'
import { RankCatalog } from '../shared/RankCatalog'
import type { AdminBeltRankSummary, AdminTechniqueSummary, TechniqueCategory } from '@/types/dashboard'

interface AdminCurriculumCatalogProps {
    ranks: AdminBeltRankSummary[]
    techniques: AdminTechniqueSummary[]
}

const CATEGORY_LABELS: Record<TechniqueCategory, string> = {
    KIHON: 'Kihon',
    KATA: 'Kata',
    KUMITE: 'Kumite',
    BUNKAI: 'Bunkai',
}

interface RankForm {
    name: string
    kyuDan: string
    japaneseName: string
    kanji: string
    beltColor: string
    estimatedDurationMonths: string
    isMaximumRank: boolean
    description: string
}

const EMPTY_RANK_FORM: RankForm = {
    name: '',
    kyuDan: '',
    japaneseName: '',
    kanji: '',
    beltColor: '',
    estimatedDurationMonths: '',
    isMaximumRank: false,
    description: '',
}

export function AdminCurriculumCatalog({ ranks: initialRanks, techniques: catalog }: AdminCurriculumCatalogProps) {
    const router = useRouter()
    const [ranks] = useState(initialRanks)
    const [selectedRankId, setSelectedRankId] = useState(initialRanks[0]?.id ?? '')
    const [editingRank, setEditingRank] = useState<AdminBeltRankSummary | null>(null)
    const [rankForm, setRankForm] = useState<RankForm>(EMPTY_RANK_FORM)
    const [isRankDialogOpen, setIsRankDialogOpen] = useState(false)
    const [isKataDialogOpen, setIsKataDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const selectedRank = ranks.find(({ id }) => id === selectedRankId) ?? ranks[0]
    const totalTechniques = ranks.reduce((total, rank) => total + rank.techniqueCount, 0)

    function openCreateRank() {
        setEditingRank(null)
        setRankForm(EMPTY_RANK_FORM)
        setError(null)
        setIsRankDialogOpen(true)
    }

    function openEditRank(rank: AdminBeltRankSummary) {
        setEditingRank(rank)
        setRankForm({
            name: rank.name,
            kyuDan: rank.kyuDan ?? '',
            japaneseName: rank.japaneseName ?? '',
            kanji: rank.kanji ?? '',
            beltColor: rank.beltColor ?? '',
            estimatedDurationMonths: rank.estimatedDurationMonths != null ? String(rank.estimatedDurationMonths) : '',
            isMaximumRank: rank.isMaximumRank,
            description: rank.description ?? '',
        })
        setError(null)
        setIsRankDialogOpen(true)
    }

    async function submitRank(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)
        const body = {
            name: rankForm.name.trim(),
            kyuDan: rankForm.kyuDan.trim() || null,
            japaneseName: rankForm.japaneseName.trim() || null,
            kanji: rankForm.kanji.trim() || null,
            beltColor: rankForm.beltColor.trim() || null,
            estimatedDurationMonths: rankForm.estimatedDurationMonths === '' ? null : Number(rankForm.estimatedDurationMonths),
            isMaximumRank: rankForm.isMaximumRank,
            description: rankForm.description.trim() || null,
        }
        const response = await fetch(
            editingRank ? `/api/dashboard/admin/belt-ranks/${editingRank.id}` : '/api/dashboard/admin/belt-ranks',
            {
                method: editingRank ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            },
        )
        setSaving(false)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible guardar el grado.')
            return
        }

        setIsRankDialogOpen(false)
        router.refresh()
    }

    async function deleteRank(rank: AdminBeltRankSummary) {
        if (!window.confirm(`¿Eliminar el grado "${rank.name}"? Esta acción no se puede deshacer.`)) return
        setSaving(true)
        setError(null)
        const response = await fetch(`/api/dashboard/admin/belt-ranks/${rank.id}`, { method: 'DELETE' })
        setSaving(false)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible eliminar el grado.')
            return
        }

        if (selectedRankId === rank.id) setSelectedRankId('')
        router.refresh()
    }

    async function saveKatas(rankId: string, techniqueIds: string[]) {
        setSaving(true)
        setError(null)
        const response = await fetch(`/api/dashboard/admin/belt-ranks/${rankId}/katas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ techniqueIds }),
        })
        setSaving(false)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible guardar las técnicas.')
            return false
        }

        router.refresh()
        return true
    }

    function reorderTechnique(techniqueId: string, direction: 'up' | 'down') {
        if (!selectedRank) return
        const list = selectedRank.techniques
        const index = list.findIndex(({ id }) => id === techniqueId)
        const swapWith = direction === 'up' ? index - 1 : index + 1
        if (index < 0 || swapWith < 0 || swapWith >= list.length) return
        const next = [...list]
        ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
        void saveKatas(selectedRank.id, next.map(({ id }) => id))
    }

    const assignedIds = new Set(selectedRank?.techniques.map(({ id }) => id) ?? [])
    const unassignedTechniques = catalog.filter(({ id }) => !assignedIds.has(id))

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Grados y técnicas</h1>
            <p className="mt-2 text-sm text-neutral-400">Catálogo curricular configurado para tu escuela.</p>

            {ranks.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
                    <GraduationCap aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
                    <p className="mt-3 text-sm font-semibold text-white">No hay grados configurados todavía.</p>
                    <button className="mt-4 inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400" onClick={openCreateRank} type="button"><Plus aria-hidden="true" className="size-4" />Crear primer grado</button>
                </section>
            ) : (
                <>
                    <section className="mt-7 grid gap-3 sm:grid-cols-2">
                        <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm"><Rows3 aria-hidden="true" className="size-5 text-cyan-400" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Grados configurados</p><p className="mt-1 text-3xl font-bold text-white">{ranks.length}</p></article>
                        <article className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm"><BookOpen aria-hidden="true" className="size-5 text-emerald-400" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">Técnicas asociadas</p><p className="mt-1 text-3xl font-bold text-white">{totalTechniques}</p></article>
                    </section>

                    <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-4 shadow-sm">
                        <RankCatalog
                            onAddRank={openCreateRank}
                            onDeleteRank={(rankId) => {
                                const rank = ranks.find(({ id }) => id === rankId)
                                if (rank) void deleteRank(rank)
                            }}
                            onEditRank={openEditRank}
                            onSelectRank={setSelectedRankId}
                            ranks={ranks}
                            selectedRankId={selectedRankId}
                        />
                    </section>

                    {selectedRank && (
                        <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-3">
                                    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-md border border-white/10" style={{ backgroundColor: selectedRank.beltColor ?? '#3f3f46' }}><GraduationCap className="size-6 text-[#10131a]" /></span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Grado seleccionado</p>
                                        <h2 className="mt-1 font-display text-xl font-bold text-white">{selectedRank.name}</h2>
                                        <p className="mt-1 text-sm text-neutral-400">{selectedRank.kyuDan ?? `Posición ${selectedRank.order}`}{selectedRank.isMaximumRank ? ' · Grado máximo' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm font-bold text-cyan-200"><ListChecks aria-hidden="true" className="size-4 text-cyan-400" />{selectedRank.techniqueCount} técnicas</span>
                                    <button className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-60" disabled={saving} onClick={() => openEditRank(selectedRank)} type="button"><Pencil aria-hidden="true" className="size-3.5" />Editar</button>
                                    <button className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60" disabled={saving} onClick={() => deleteRank(selectedRank)} type="button"><Trash2 aria-hidden="true" className="size-3.5" />Eliminar</button>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <article className="rounded-lg border border-neutral-800 bg-[#0d1117] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Permanencia mínima</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white"><Clock aria-hidden="true" className="size-4 text-amber-400" />{selectedRank.estimatedDurationMonths != null ? `${selectedRank.estimatedDurationMonths} meses` : 'Sin límite'}</p>
                                </article>
                                <article className="rounded-lg border border-neutral-800 bg-[#0d1117] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Asistencia requerida</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white"><ShieldCheck aria-hidden="true" className="size-4 text-emerald-400" />{selectedRank.minAttendancePercent != null ? `${selectedRank.minAttendancePercent}%` : 'Sin requisito'}</p>
                                </article>
                                <article className="rounded-lg border border-neutral-800 bg-[#0d1117] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Técnicas requeridas</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white"><BookOpen aria-hidden="true" className="size-4 text-cyan-400" />{selectedRank.techniqueCount}</p>
                                </article>
                                <article className="rounded-lg border border-neutral-800 bg-[#0d1117] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Alumnos en grado</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white"><Users aria-hidden="true" className="size-4 text-violet-400" />{selectedRank.studentCount}</p>
                                </article>
                            </div>

                            <div className="mt-5 border-t border-neutral-800 pt-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-neutral-300">Técnicas del plan ({selectedRank.techniques.length})</p>
                                    <button className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} onClick={() => setIsKataDialogOpen(true)} type="button"><Plus aria-hidden="true" className="size-3.5" />Asignar técnicas</button>
                                </div>
                                {selectedRank.techniques.length === 0 ? (
                                    <p className="mt-4 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] p-4 text-sm text-neutral-400">Este grado aún no tiene técnicas asociadas. Pulsa «Asignar técnicas» para añadirlas.</p>
                                ) : (
                                    <ul className="mt-4 divide-y divide-neutral-800 rounded-md border border-neutral-800 bg-[#0d1117]">
                                        {selectedRank.techniques.map((technique, index) => (
                                            <li className="flex items-center justify-between gap-3 px-4 py-3" key={technique.id}>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-white">{technique.name}{technique.japaneseName ? <span className="ml-1.5 text-xs font-normal text-neutral-400">{technique.japaneseName}</span> : ''}</p>
                                                    <p className="mt-0.5 text-xs text-neutral-400">{CATEGORY_LABELS[technique.category]}{technique.difficulty ? ` · ${technique.difficulty}` : ''}{technique.movementsCount != null ? ` · ${technique.movementsCount} movimientos` : ''}</p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <button aria-label={`Mover ${technique.name} hacia arriba`} className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={index === 0 || saving} onClick={() => reorderTechnique(technique.id, 'up')} type="button"><MoveUp aria-hidden="true" className="size-4" /></button>
                                                    <button aria-label={`Mover ${technique.name} hacia abajo`} className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={index === selectedRank.techniques.length - 1 || saving} onClick={() => reorderTechnique(technique.id, 'down')} type="button"><MoveDown aria-hidden="true" className="size-4" /></button>
                                                    <button aria-label={`Quitar ${technique.name} del grado`} className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60" disabled={saving} onClick={async () => {
                                                        const remaining = selectedRank.techniques.filter(({ id }) => id !== technique.id)
                                                        await saveKatas(selectedRank.id, remaining.map(({ id }) => id))
                                                    }} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    )}
                </>
            )}

            {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}

            {isRankDialogOpen && (
                <RankDialog form={rankForm} isNew={!editingRank} onChange={setRankForm} onClose={() => setIsRankDialogOpen(false)} onSubmit={submitRank} saving={saving} />
            )}

            {isKataDialogOpen && selectedRank && (
                <AssignKatasDialog
                    assignedTechniques={selectedRank.techniques}
                    catalogSize={catalog.length}
                    onClose={() => setIsKataDialogOpen(false)}
                    onSave={(techniqueIds) => saveKatas(selectedRank.id, techniqueIds)}
                    saving={saving}
                    unassignedTechniques={unassignedTechniques}
                />
            )}
        </main>
    )
}

function RankDialog({
    form,
    isNew,
    onChange,
    onClose,
    onSubmit,
    saving,
}: {
    form: RankForm
    isNew: boolean
    onChange: (form: RankForm) => void
    onClose: () => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
    saving: boolean
}) {
    function set<K extends keyof RankForm>(key: K, value: RankForm[K]) {
        onChange({ ...form, [key]: value })
    }

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
            <form className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-800 bg-[#161616] p-6 shadow-2xl" onSubmit={onSubmit}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{isNew ? 'Nuevo grado' : 'Editar grado'}</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-white">{isNew ? 'Crear grado' : form.name}</h3>
                    </div>
                    <button aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-5 grid gap-4">
                    <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-name">Nombre (ej. Cinturón Blanco)<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-name" onChange={(event) => set('name', event.target.value)} placeholder="Cinturón Blanco" required value={form.name} /></label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-kyu">Grado (Kyū/Dan)<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-kyu" onChange={(event) => set('kyuDan', event.target.value)} placeholder="10º Kyū" value={form.kyuDan} /></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-duration">Duración estimada (meses)<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-duration" min="0" onChange={(event) => set('estimatedDurationMonths', event.target.value)} type="number" value={form.estimatedDurationMonths} /></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-japanese">Nombre japonés<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-japanese" onChange={(event) => set('japaneseName', event.target.value)} placeholder="Hachikyū" value={form.japaneseName} /></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-kanji">Kanji<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-kanji" onChange={(event) => set('kanji', event.target.value)} placeholder="八級" value={form.kanji} /></label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-color">Color de cinturón (CSS)<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-color" onChange={(event) => set('beltColor', event.target.value)} placeholder="#ffffff" value={form.beltColor} /></label>
                        <div className="flex items-end"><span aria-hidden="true" className="mb-1.5 inline-block h-7 w-14 rounded-sm border border-white/30" style={{ backgroundColor: form.beltColor || '#3f3f46' }} /></div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-300" htmlFor="rank-max"><input checked={form.isMaximumRank} className="size-4 accent-cyan-500" id="rank-max" onChange={(event) => set('isMaximumRank', event.target.checked)} type="checkbox" />Grado máximo del escalafón</label>
                    <label className="text-xs font-semibold text-neutral-300" htmlFor="rank-desc">Descripción<textarea className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="rank-desc" onChange={(event) => set('description', event.target.value)} placeholder="Requisitos y notas del grado" rows={3} value={form.description} /></label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white" onClick={onClose} type="button">Cancelar</button>
                    <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} type="submit">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <CheckSquare aria-hidden="true" className="size-4" />}{isNew ? 'Crear grado' : 'Guardar cambios'}</button>
                </div>
            </form>
        </div>
    )
}

function AssignKatasDialog({
    assignedTechniques,
    catalogSize,
    onClose,
    onSave,
    saving,
    unassignedTechniques,
}: {
    assignedTechniques: AdminTechniqueSummary[]
    catalogSize: number
    onClose: () => void
    onSave: (techniqueIds: string[]) => Promise<boolean>
    saving: boolean
    unassignedTechniques: AdminTechniqueSummary[]
}) {
    const [selected, setSelected] = useState<Set<string>>(() => new Set(assignedTechniques.map(({ id }) => id)))
    const allCatalog = [...unassignedTechniques, ...assignedTechniques]
    const allSelected = allCatalog.length > 0 && selected.size === allCatalog.length

    function toggle(id: string) {
        setSelected((previous) => {
            const next = new Set(previous)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-800 bg-[#161616] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Asignación curricular</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-white">Selecciona las técnicas del grado</h3>
                    </div>
                    <button aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200" onClick={() => setSelected(allSelected ? new Set() : new Set(allCatalog.map(({ id }) => id)))} type="button">{allSelected ? <Square aria-hidden="true" className="size-3.5" /> : <CheckSquare aria-hidden="true" className="size-3.5" />}{allSelected ? 'Quitar todas' : 'Seleccionar todas'}</button>
                    <span className="ml-auto text-xs text-neutral-400">{selected.size} de {allCatalog.length} seleccionadas</span>
                </div>

                {catalogSize === 0 ? (
                    <p className="mt-5 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] p-4 text-sm text-neutral-400">No hay técnicas en el catálogo todavía. Crea técnicas para poder asignarlas a los grados.</p>
                ) : (
                    <ul className="mt-4 max-h-72 divide-y divide-neutral-800 overflow-y-auto rounded-md border border-neutral-800 bg-[#0d1117]">
                        {allCatalog.map((technique) => (
                            <li key={technique.id}>
                                <button className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-800" onClick={() => toggle(technique.id)} type="button">
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-white">{technique.name}</span>
                                        <span className="block text-xs text-neutral-400">{CATEGORY_LABELS[technique.category]}{technique.difficulty ? ` · ${technique.difficulty}` : ''}</span>
                                    </span>
                                    {selected.has(technique.id) ? <CheckSquare aria-hidden="true" className="size-5 shrink-0 text-cyan-400" /> : <Square aria-hidden="true" className="size-5 shrink-0 text-neutral-600" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white" onClick={onClose} type="button">Cancelar</button>
                    <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} onClick={() => onSave([...selected])} type="button">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <CheckSquare aria-hidden="true" className="size-4" />}Guardar técnicas</button>
                </div>
            </div>
        </div>
    )
}
