'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, CheckSquare, Loader2, Pencil, Plus, Search, Shield, Swords, Trash2, X } from 'lucide-react'
import { TECHNIQUE_CATEGORIES, TECHNIQUE_CATEGORY_LABELS, techniqueMetaLine } from '@/lib/dashboard/technique-format'
import { buildProgramKataLevels } from '@/lib/dashboard/kata-level'
import { KataBeltChip } from '../shared/KataBeltChip'
import type { Program } from '@/lib/curriculum/programs'
import type { AdminBeltRankSummary, AdminTechniqueSummary, TechniqueCategory } from '@/types/dashboard'

interface AdminTechniqueManagerProps {
    ranks: AdminBeltRankSummary[]
    techniques: AdminTechniqueSummary[]
}

interface TechniqueForm {
    name: string
    japaneseName: string
    kanji: string
    description: string
    category: TechniqueCategory | ''
    difficulty: string
    movementsCount: string
    embusen: string
    videoUrl: string
    repetitionsCount: string
    stance: string
    level: string
    kumiteType: string
    distance: string
    role: string
    applicationType: string
    originKataId: string
}

const CATEGORY_DESCRIPTIONS: Record<TechniqueCategory, string> = {
    KIHON: 'Fundamentos y técnicas básicas: repeticiones, posiciones y niveles.',
    KATA: 'Formas con secuencia de movimientos y embusen definido.',
    KUMITE: 'Combate: tipo, distancia, pasos y roles de los practicantes.',
    BUNKAI: 'Aplicación práctica de una kata, con secuencias y kata de origen.',
}

function emptyTechniqueForm(category: TechniqueCategory | '' = ''): TechniqueForm {
    return {
        name: '',
        japaneseName: '',
        kanji: '',
        description: '',
        category,
        difficulty: '',
        movementsCount: '',
        embusen: '',
        videoUrl: '',
        repetitionsCount: '',
        stance: '',
        level: '',
        kumiteType: '',
        distance: '',
        role: '',
        applicationType: '',
        originKataId: '',
    }
}

export function AdminTechniqueManager({ ranks, techniques }: AdminTechniqueManagerProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | TechniqueCategory>('ALL')
    const [programFilter, setProgramFilter] = useState<Program>('YOUTH')
    const [editingTechnique, setEditingTechnique] = useState<AdminTechniqueSummary | null>(null)
    const [form, setForm] = useState<TechniqueForm>(emptyTechniqueForm())
    const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const kataOptions = techniques.filter(({ category }) => category === 'KATA')
    const programLevels = buildProgramKataLevels(ranks, programFilter)
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
    const visibleTechniques = techniques
        .filter((technique) => {
            const matchesCategory = categoryFilter === 'ALL' || technique.category === categoryFilter
            const matchesSearch = !normalizedSearch || [technique.name, technique.japaneseName ?? '', technique.difficulty ?? '', TECHNIQUE_CATEGORY_LABELS[technique.category]]
                .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))
            if (!matchesCategory || !matchesSearch) return false
            if (technique.category === 'KATA' && !programLevels.has(technique.id)) return false
            return true
        })
        .sort((a, b) => {
            const levelA = a.category === 'KATA' ? programLevels.get(a.id) : undefined
            const levelB = b.category === 'KATA' ? programLevels.get(b.id) : undefined
            const rankA = levelA ? levelA.gradeOrder * 1000 + levelA.position : 100000 + a.order
            const rankB = levelB ? levelB.gradeOrder * 1000 + levelB.position : 100000 + b.order
            return rankA - rankB || a.name.localeCompare(b.name)
        })

    function openCategoryPicker() {
        setError(null)
        setIsCategoryPickerOpen(true)
    }

    function chooseCategory(category: TechniqueCategory) {
        setEditingTechnique(null)
        setForm(emptyTechniqueForm(category))
        setIsCategoryPickerOpen(false)
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
            repetitionsCount: technique.repetitionsCount != null ? String(technique.repetitionsCount) : '',
            stance: technique.stance ?? '',
            level: technique.level ?? '',
            kumiteType: technique.kumiteType ?? '',
            distance: technique.distance ?? '',
            role: technique.role ?? '',
            applicationType: technique.applicationType ?? '',
            originKataId: technique.originKataId ?? '',
        })
        setError(null)
        setIsDialogOpen(true)
    }

    async function submitTechnique(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!form.category) return false
        setSaving(true)
        setError(null)
        const body = {
            name: form.name.trim(),
            japaneseName: form.japaneseName.trim() || null,
            kanji: form.category === 'KATA' ? form.kanji.trim() || null : null,
            description: form.description.trim() || null,
            category: form.category,
            difficulty: form.difficulty.trim() || null,
            movementsCount: form.movementsCount === '' ? null : Number(form.movementsCount),
            embusen: form.category === 'KATA' ? form.embusen.trim() || null : null,
            videoUrl: form.videoUrl.trim() || null,
            repetitionsCount: form.category === 'KIHON' && form.repetitionsCount !== '' ? Number(form.repetitionsCount) : null,
            stance: form.category === 'KIHON' ? form.stance.trim() || null : null,
            level: form.category === 'KIHON' ? form.level.trim() || null : null,
            kumiteType: form.category === 'KUMITE' ? form.kumiteType.trim() || null : null,
            distance: form.category === 'KUMITE' ? form.distance.trim() || null : null,
            role: form.category === 'KUMITE' ? form.role.trim() || null : null,
            applicationType: form.category === 'BUNKAI' ? form.applicationType.trim() || null : null,
            originKataId: form.category === 'BUNKAI' ? form.originKataId || null : null,
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
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Catálogo de técnicas</h1>
            <p className="mt-2 text-sm text-ink-3">Gestión del catálogo técnico de tu escuela (kihon, katas, kumite y bunkai).</p>

            <section className="mt-6 rounded-lg border border-edge bg-surface-2 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-edge p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2">
                        <BookOpen aria-hidden="true" className="size-5 text-accent" />
                        <div>
                            <p className="text-sm font-semibold text-ink">{techniques.length} técnicas en el catálogo</p>
                            <p className="text-xs text-ink-3">La edición afecta al plan curricular de todos los grados.</p>
                        </div>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} onClick={openCategoryPicker} type="button"><Plus aria-hidden="true" className="size-4" />Nueva técnica</button>
                </div>

                {techniques.length > 0 && (
                    <div className="flex flex-col gap-3 border-b border-edge p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <label className="relative block sm:w-64" htmlFor="technique-search">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-accent" />
                            <input className="w-full rounded-md border border-edge-strong bg-surface-1 py-1.5 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica" type="search" value={searchTerm} />
                        </label>
                        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
                            <div className="flex shrink-0 items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                                {([['YOUTH', 'Niños'], ['ADULT', 'Adultos']] as const).map(([value, label]) => (
                                    <button aria-pressed={programFilter === value} className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${programFilter === value ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={value} onClick={() => setProgramFilter(value)} type="button">{label}</button>
                                ))}
                            </div>
                            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-surface-3" />
                            {([['ALL', 'Todas'], ['KATA', 'Katas'], ['KIHON', 'Kihon'], ['KUMITE', 'Kumite'], ['BUNKAI', 'Bunkai']] as const).map(([category, label]) => (
                                <button aria-pressed={categoryFilter === category} className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${categoryFilter === category ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-1 text-ink-3 hover:border-edge-strong'}`} key={category} onClick={() => setCategoryFilter(category)} type="button">{label}</button>
                            ))}
                        </div>
                    </div>
                )}

                {techniques.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-ink-3">Aún no hay técnicas en el catálogo.</p>
                ) : visibleTechniques.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-ink-3">No hay técnicas que coincidan con los filtros.</p>
                ) : (
                    <ul className="divide-y divide-edge">
                        {visibleTechniques.map((technique) => {
                            const rank = technique.rankIds.length > 0 ? ranks.find(({ id }) => id === technique.rankIds[0]) : undefined
                            const level = technique.category === 'KATA' ? programLevels.get(technique.id) : undefined
                            return (
                                <li className="flex items-start justify-between gap-4 px-5 py-4" key={technique.id}>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-ink">{technique.name}{technique.japaneseName ? <span className="ml-1.5 text-xs font-normal text-ink-3">{technique.japaneseName}</span> : ''}</p>
                                        <p className="mt-1 text-xs text-ink-3">{techniqueMetaLine(technique)}</p>
                                        {technique.description && <p className="mt-2 text-sm text-ink-3">{technique.description}</p>}
                                        {level ? (
                                            <KataBeltChip beltColor={level.beltColor} beltSecondaryColor={level.beltSecondaryColor} className="mt-2" level={level.level} />
                                        ) : rank ? (
                                            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-2 py-1 text-[11px] font-semibold text-accent"><span aria-hidden="true" className="inline-block h-2.5 w-3.5 rounded-sm border border-white/30" style={{ backgroundColor: rank.beltColor ?? '#3f3f46' }} />{rank.name}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <button aria-label={`Editar ${technique.name}`} className="rounded p-1.5 text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-60" disabled={saving} onClick={() => openEdit(technique)} type="button"><Pencil aria-hidden="true" className="size-4" /></button>
                                        <button aria-label={`Eliminar ${technique.name}`} className="rounded p-1.5 text-ink-4 transition-colors hover:bg-red-500/10 hover:text-danger-text disabled:opacity-60" disabled={saving} onClick={() => deleteTechnique(technique)} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            {error && <p className="mt-4 text-sm font-medium text-danger-text">{error}</p>}

            {isCategoryPickerOpen && (
                <CategoryPickerDialog onClose={() => setIsCategoryPickerOpen(false)} onSelect={chooseCategory} />
            )}

            {isDialogOpen && form.category && (
                <TechniqueDialog
                    form={form}
                    isNew={!editingTechnique}
                    kataOptions={kataOptions}
                    onChange={setForm}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={submitTechnique}
                    saving={saving}
                />
            )}
        </main>
    )
}

function CategoryPickerDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (category: TechniqueCategory) => void }) {
    const icons: Record<TechniqueCategory, React.ReactNode> = {
        KIHON: <Shield aria-hidden="true" className="size-6 text-accent" />,
        KATA: <BookOpen aria-hidden="true" className="size-6 text-ok-text" />,
        KUMITE: <Swords aria-hidden="true" className="size-6 text-danger-text" />,
        BUNKAI: <BookOpen aria-hidden="true" className="size-6 text-violet-400" />,
    }

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-edge bg-surface-2 p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Nueva técnica</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-ink">¿Qué tipo de técnica vas a crear?</h3>
                    </div>
                    <button aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-5 grid gap-3">
                    {TECHNIQUE_CATEGORIES.map((category) => (
                        <button className="flex items-start gap-3 rounded-lg border border-edge-strong bg-surface-1 p-4 text-left transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/5" key={category} onClick={() => onSelect(category)} type="button">
                            <span className="mt-0.5 shrink-0">{icons[category]}</span>
                            <span className="min-w-0">
                                <span className="block text-sm font-bold text-ink">{TECHNIQUE_CATEGORY_LABELS[category]}</span>
                                <span className="mt-0.5 block text-xs text-ink-3">{CATEGORY_DESCRIPTIONS[category]}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function TechniqueDialog({
    form,
    isNew,
    kataOptions,
    onChange,
    onClose,
    onSubmit,
    saving,
}: {
    form: TechniqueForm
    isNew: boolean
    kataOptions: AdminTechniqueSummary[]
    onChange: (form: TechniqueForm) => void
    onClose: () => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<unknown>
    saving: boolean
}) {
    const category = form.category as TechniqueCategory

    function set<K extends keyof TechniqueForm>(key: K, value: TechniqueForm[K]) {
        onChange({ ...form, [key]: value })
    }

    function changeCategory(nextCategory: TechniqueCategory) {
        onChange({ ...emptyTechniqueForm(nextCategory), name: form.name, japaneseName: form.japaneseName, videoUrl: form.videoUrl, description: form.description })
    }

    return (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
            <form className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-edge bg-surface-2 p-6 shadow-2xl" onSubmit={onSubmit}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{isNew ? `Nueva técnica · ${TECHNIQUE_CATEGORY_LABELS[category]}` : `Editar técnica · ${TECHNIQUE_CATEGORY_LABELS[category]}`}</p>
                        <h3 className="mt-1 font-display text-lg font-bold text-ink">{isNew ? `Crear ${TECHNIQUE_CATEGORY_LABELS[category]}` : form.name}</h3>
                    </div>
                    <button aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button>
                </div>

                <div className="mt-5 grid gap-4">
                    <label className="text-xs font-semibold text-ink-2" htmlFor="technique-name">Nombre<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-name" onChange={(event) => set('name', event.target.value)} placeholder={category === 'KIHON' ? 'Age Uke' : category === 'KUMITE' ? 'Kihon Ippon Kumite - Jodan' : category === 'BUNKAI' ? 'Bunkai de Pinan Nidan - Secuencia 1' : 'Pinan Nidan'} required value={form.name} /></label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-ink-2" htmlFor="technique-japanese">Nombre japonés<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-japanese" onChange={(event) => set('japaneseName', event.target.value)} placeholder={category === 'KUMITE' ? 'Kihon Ippon Kumite' : 'Heian Nidan'} value={form.japaneseName} /></label>
                        <label className="text-xs font-semibold text-ink-2" htmlFor="technique-category">Tipo de técnica<select className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="technique-category" onChange={(event) => changeCategory(event.target.value as TechniqueCategory)} value={category}>{TECHNIQUE_CATEGORIES.map((option) => <option key={option} value={option}>{TECHNIQUE_CATEGORY_LABELS[option]}</option>)}</select></label>
                    </div>

                    {category === 'KATA' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-kanji">Kanji<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-kanji" onChange={(event) => set('kanji', event.target.value)} value={form.kanji} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-difficulty">Dificultad<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-difficulty" onChange={(event) => set('difficulty', event.target.value)} placeholder="Media" value={form.difficulty} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-movements">N.º de movimientos<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-movements" min="0" onChange={(event) => set('movementsCount', event.target.value)} type="number" value={form.movementsCount} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-embusen">Embusen<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-embusen" onChange={(event) => set('embusen', event.target.value)} placeholder="H" value={form.embusen} /></label>
                        </div>
                    )}

                    {category === 'KIHON' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-difficulty">Dificultad<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-difficulty" onChange={(event) => set('difficulty', event.target.value)} placeholder="Baja" value={form.difficulty} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-repetitions">N.º de repeticiones<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-repetitions" min="0" onChange={(event) => set('repetitionsCount', event.target.value)} placeholder="10" type="number" value={form.repetitionsCount} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-stance">Posición / Guardia<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-stance" onChange={(event) => set('stance', event.target.value)} placeholder="Zenkutsu Dachi" value={form.stance} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-level">Nivel<select className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="technique-level" onChange={(event) => set('level', event.target.value)} value={form.level}><option value="">Sin especificar</option><option value="Jodan">Jodan</option><option value="Chudan">Chudan</option><option value="Gedan">Gedan</option></select></label>
                        </div>
                    )}

                    {category === 'KUMITE' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-kumite-type">Tipo de kumite<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-kumite-type" onChange={(event) => set('kumiteType', event.target.value)} placeholder="Kihon Ippon, Jiyu Ippon, Shiai..." value={form.kumiteType} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-difficulty">Dificultad<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-difficulty" onChange={(event) => set('difficulty', event.target.value)} placeholder="Media" value={form.difficulty} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-movements">N.º de pasos / técnicas<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-movements" min="0" onChange={(event) => set('movementsCount', event.target.value)} type="number" value={form.movementsCount} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-distance">Distancia<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-distance" onChange={(event) => set('distance', event.target.value)} placeholder="Toma, Chika Ma, Ma..." value={form.distance} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-role">Rol<select className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="technique-role" onChange={(event) => set('role', event.target.value)} value={form.role}><option value="">Sin especificar</option><option value="Aka">Aka (Rojo)</option><option value="Ao">Ao (Azul)</option><option value="Tori">Tori (Ejecutor)</option><option value="Uke">Uke (Receptor)</option></select></label>
                        </div>
                    )}

                    {category === 'BUNKAI' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-application">Tipo de aplicación<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-application" onChange={(event) => set('applicationType', event.target.value)} placeholder="Defensa personal, Proyección..." value={form.applicationType} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-difficulty">Dificultad<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-difficulty" onChange={(event) => set('difficulty', event.target.value)} placeholder="Media" value={form.difficulty} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-movements">N.º de movimientos / secuencias<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-movements" min="0" onChange={(event) => set('movementsCount', event.target.value)} type="number" value={form.movementsCount} /></label>
                            <label className="text-xs font-semibold text-ink-2" htmlFor="technique-origin-kata">Kata de origen<select className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" id="technique-origin-kata" onChange={(event) => set('originKataId', event.target.value)} value={form.originKataId}><option value="">Sin kata de origen</option>{kataOptions.map((kata) => <option key={kata.id} value={kata.id}>{kata.name}</option>)}</select></label>
                        </div>
                    )}

                    <label className="text-xs font-semibold text-ink-2" htmlFor="technique-video">URL de video de referencia<input className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-video" onChange={(event) => set('videoUrl', event.target.value)} placeholder="https://..." value={form.videoUrl} /></label>
                    <label className="text-xs font-semibold text-ink-2" htmlFor="technique-desc">Descripción y requisitos<textarea className="mt-1.5 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm font-normal text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="technique-desc" onChange={(event) => set('description', event.target.value)} placeholder={category === 'KUMITE' ? 'El atacante avanza con Oi Zuki Jodan, el defensor retrocede con Age Uke y contraataca...' : 'Detalle técnico de la ejecución'} rows={3} value={form.description} /></label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button className="rounded-md border border-edge-strong px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:border-edge-strong hover:text-ink" onClick={onClose} type="button">Cancelar</button>
                    <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} type="submit">{saving ? <Loader2 aria-label="Guardando" className="size-4 animate-spin" /> : <CheckSquare aria-hidden="true" className="size-4" />}{isNew ? 'Crear técnica' : 'Guardar cambios'}</button>
                </div>
            </form>
        </div>
    )
}
