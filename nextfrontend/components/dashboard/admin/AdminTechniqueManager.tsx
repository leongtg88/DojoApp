'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, CheckSquare, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { AdminBeltRankSummary, AdminTechniqueSummary, TechniqueCategory } from '@/types/dashboard'

interface AdminTechniqueManagerProps {
    ranks: AdminBeltRankSummary[]
    techniques: AdminTechniqueSummary[]
}

const CATEGORY_LABELS: Record<TechniqueCategory, string> = {
    KIHON: 'Kihon',
    KATA: 'Kata',
    KUMITE: 'Kumite',
    BUNKAI: 'Bunkai',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TechniqueCategory[]

interface TechniqueForm {
    name: string
    japaneseName: string
    kanji: string
    description: string
    category: TechniqueCategory
    difficulty: string
    movementsCount: string
    embusen: string
    videoUrl: string
    rankId: string
}

const EMPTY_TECHNIQUE_FORM: TechniqueForm = {
    name: '',
    japaneseName: '',
    kanji: '',
    description: '',
    category: 'KATA',
    difficulty: '',
    movementsCount: '',
    embusen: '',
    videoUrl: '',
    rankId: '',
}

export function AdminTechniqueManager({ ranks, techniques }: AdminTechniqueManagerProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | TechniqueCategory>('ALL')
    const [editingTechnique, setEditingTechnique] = useState<AdminTechniqueSummary | null>(null)
    const [form, setForm] = useState<TechniqueForm>(EMPTY_TECHNIQUE_FORM)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const visibleTechniques = techniques.filter((technique) => {
        const matchesCategory = categoryFilter === 'ALL' || technique.category === categoryFilter
        const matchesSearch = !normalizedSearch || [technique.name, technique.japaneseName ?? '', technique.difficulty ?? '', CATEGORY_LABELS[technique.category]]
            .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))
        return matchesCategory && matchesSearch
    })

    function openCreate() {
        setEditingTechnique(null)
        setForm(EMPTY_TECHNIQUE_FORM)
        setError(null)
        setIsDialogOpen(true)
    }

    function openEdit(technique: AdminTechniqueSummary) {
        setEditingTechnique(technique)
        setForm({
            name: technique.name,
            japaneseName: technique.japaneseName ?? '',
            kanji: technique.kanji ?? '',
            description: technique.description ?? '',
            category: technique.category,
            difficulty: technique.difficulty ?? '',
            movementsCount: technique.movementsCount != null ? String(technique.movementsCount) : '',
            embusen: technique.embusen ?? '',
            videoUrl: technique.videoUrl ?? '',
            rankId: technique.rankId ?? '',
        })
        setError(null)
        setIsDialogOpen(true)
    }

    async function submitTechnique(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)
        const body = {
            name: form.name.trim(),
            japaneseName: form.japaneseName.trim() || null,
            kanji: form.kanji.trim() || null,
            description: form.description.trim() || null,
            category: form.category,
            difficulty: form.difficulty.trim() || null,
            movementsCount: form.movementsCount === '' ? null : Number(form.movementsCount),
            embusen: form.embusen.trim() || null,
            videoUrl: form.videoUrl.trim() || null,
            rankId: form.rankId || null,
        }
        const response = await fetch(
            editingTechnique ? `/api/dashboard/admin/techniques/${editingTechnique.id}` : '/api/dashboard/admin/techniques',
            {
                method: editingTechnique ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            },
        )
        setSaving(false)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible guardar la técnica.')
            return false
        }

        setIsDialogOpen(false)
        router.refresh()
        return true
    }

    async function deleteTechnique(technique: AdminTechniqueSummary) {
        if (!window.confirm(`¿Eliminar la técnica "${technique.name}"?`)) return
        setSaving(true)
        setError(null)
        const response = await fetch(`/api/dashboard/admin/techniques/${technique.id}`, { method: 'DELETE' })
        setSaving(false)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible eliminar la técnica.')
            return
        }

        router.refresh()
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Catálogo de técnicas</h1>
            <p className="mt-2 text-sm text-neutral-400">Gestión del catálogo técnico de tu escuela (kihon, katas, kumite y bunkai).</p>

            <section className="mt-6 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-neutral-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2">
                        <BookOpen aria-hidden="true" className="size-5 text-cyan-400" />
                        <div>
                            <p className="text-sm font-semibold text-white">{techniques.length} técnicas en el catálogo</p>
                            <p className="text-xs text-neutral-400">La edición afecta al plan curricular de todos los grados.</p>
                        </div>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} onClick={openCreate} type="button"><Plus aria-hidden="true" className="size-4" />Nueva técnica</button>
                </div>

                {techniques.length > 0 && (
                    <div className="flex flex-col gap-3 border-b border-neutral-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <label className="relative block sm:w-64" htmlFor="technique-search">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-cyan-400" />
                            <input className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-1.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica" type="search" value={searchTerm} />
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {([['ALL', 'Todas'], ['KATA', 'Katas'], ['KIHON', 'Kihon'], ['KUMITE', 'Kumite'], ['BUNKAI', 'Bunkai']] as const).map(([category, label]) => (
                                <button aria-pressed={categoryFilter === category} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${categoryFilter === category ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100' : 'border-neutral-700 bg-[#0d1117] text-neutral-400 hover:border-neutral-500'}`} key={category} onClick={() => setCategoryFilter(category)} type="button">{label}</button>
                            ))}
                        </div>
                    </div>
                )}

                {techniques.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-neutral-400">Aún no hay técnicas en el catálogo.</p>
                ) : visibleTechniques.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-neutral-400">No hay técnicas que coincidan con los filtros.</p>
                ) : (
                    <ul className="divide-y divide-neutral-800">
                        {visibleTechniques.map((technique) => {
                            const rank = ranks.find(({ id }) => id === technique.rankId)
                            return (
                                <li className="flex items-start justify-between gap-4 px-5 py-4" key={technique.id}>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">{technique.name}{technique.japaneseName ? <span className="ml-1.5 text-xs font-normal text-neutral-400">{technique.japaneseName}</span> : ''}</p>
                                        <p className="mt-1 text-xs text-neutral-400">{CATEGORY_LABELS[technique.category]}{technique.difficulty ? ` · ${technique.difficulty}` : ''}{technique.movementsCount != null ? ` · ${technique.movementsCount} movimientos` : ''}{technique.embusen ? ` · Embusen: ${technique.embusen}` : ''}</p>
                                        {technique.description && <p className="mt-2 text-sm text-neutral-400">{technique.description}</p>}
                                        {rank && <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-[#0d1117] px-2 py-1 text-[11px] font-semibold text-cyan-300"><span aria-hidden="true" className="inline-block h-2.5 w-3.5 rounded-sm border border-white/30" style={{ backgroundColor: rank.beltColor ?? '#3f3f46' }} />{rank.name}</p>}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <button aria-label={`Editar ${technique.name}`} className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-60" disabled={saving} onClick={() => openEdit(technique)} type="button"><Pencil aria-hidden="true" className="size-4" /></button>
                                        <button aria-label={`Eliminar ${technique.name}`} className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60" disabled={saving} onClick={() => deleteTechnique(technique)} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}

            {isDialogOpen && (
                <TechniqueDialog form={form} isNew={!editingTechnique} onChange={setForm} onClose={() => setIsDialogOpen(false)} onSubmit={submitTechnique} ranks={ranks} saving={saving} />
            )}
        </main>
    )
}

function TechniqueDialog({
    form,
    isNew,
    onChange,
    onClose,
    onSubmit,
    ranks,
    saving,
}: {
    form: TechniqueForm
    isNew: boolean
    onChange: (form: TechniqueForm) => void
    onClose: () => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<unknown>
    ranks: AdminBeltRankSummary[]
    saving: boolean
}) {
    function set<K extends keyof TechniqueForm>(key: K, value: TechniqueForm[K]) {
        onChange({ ...form, [key]: value })
    }

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
            <form className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-800 bg-[#161616] p-6 shadow-2xl" onSubmit={onSubmit}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{isNew ? 'Nueva técnica' : 'Editar técnica'}</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-white">{isNew ? 'Crear técnica' : form.name}</h3>
                    </div>
                    <button aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-5 grid gap-4">
                    <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-name">Nombre<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-name" onChange={(event) => set('name', event.target.value)} placeholder="Pinan Nidan" required value={form.name} /></label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-japanese">Nombre japonés<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-japanese" onChange={(event) => set('japaneseName', event.target.value)} placeholder="Heian Nidan" value={form.japaneseName} /></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-kanji">Kanji<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-kanji" onChange={(event) => set('kanji', event.target.value)} value={form.kanji} /></label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-category">Categoría<select className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="technique-category" onChange={(event) => set('category', event.target.value as TechniqueCategory)} value={form.category}>{CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-difficulty">Dificultad<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-difficulty" onChange={(event) => set('difficulty', event.target.value)} placeholder="Media" value={form.difficulty} /></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-movements">N.º de movimientos<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-movements" min="0" onChange={(event) => set('movementsCount', event.target.value)} type="number" value={form.movementsCount} /></label>
                        <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-embusen">Embusen<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-embusen" onChange={(event) => set('embusen', event.target.value)} placeholder="H" value={form.embusen} /></label>
                    </div>
                    <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-rank">Grado asociado<select className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="technique-rank" onChange={(event) => set('rankId', event.target.value)} value={form.rankId}><option value="">Sin grado</option>{ranks.map((rank) => <option key={rank.id} value={rank.id}>{rank.kyuDan ? `${rank.kyuDan} · ` : ''}{rank.name}</option>)}</select></label>
                    <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-video">URL de video de referencia<input className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-video" onChange={(event) => set('videoUrl', event.target.value)} placeholder="https://..." value={form.videoUrl} /></label>
                    <label className="text-xs font-semibold text-neutral-300" htmlFor="technique-desc">Descripción y requisitos<textarea className="mt-1.5 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="technique-desc" onChange={(event) => set('description', event.target.value)} placeholder="Detalle técnico de la ejecución" rows={3} value={form.description} /></label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white" onClick={onClose} type="button">Cancelar</button>
                    <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} type="submit">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <CheckSquare aria-hidden="true" className="size-4" />}{isNew ? 'Crear técnica' : 'Guardar cambios'}</button>
                </div>
            </form>
        </div>
    )
}