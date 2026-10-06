'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, Check, Loader2, Search, X } from 'lucide-react'
import { TECHNIQUE_CATEGORY_LABELS } from '@/lib/dashboard/technique-format'
import { KIHON_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kihon-categories'
import { KUMITE_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kumite-categories'
import type { AdminStudentSummary } from '@/types/dashboard'

interface KataOption {
	id: string
	name: string
	kanji: string | null
	japaneseName: string | null
	category: string
	kihonCategory: string | null
	kumiteCategory: string | null
}

function techniqueCategoryLine(technique: KataOption): string {
	const label = TECHNIQUE_CATEGORY_LABELS[technique.category as keyof typeof TECHNIQUE_CATEGORY_LABELS] ?? technique.category
	if (technique.category === 'KIHON' && technique.kihonCategory) return `${label} · ${KIHON_CATEGORY_SHORT_LABELS[technique.kihonCategory as keyof typeof KIHON_CATEGORY_SHORT_LABELS]}`
	if (technique.category === 'KUMITE' && technique.kumiteCategory) return `${label} · ${KUMITE_CATEGORY_SHORT_LABELS[technique.kumiteCategory as keyof typeof KUMITE_CATEGORY_SHORT_LABELS]}`
	return label
}

type TargetType = 'ALL' | 'GRADE' | 'BRANCH' | 'CLASS'

interface AdminBulkKataAssignmentProps {
	students: AdminStudentSummary[]
	onClose: () => void
	onAssigned: (summary: { studentsProcessed: number; linksAdded: number }) => void
}

const TARGET_TYPE_OPTIONS: { value: TargetType; label: string }[] = [
	{ value: 'ALL', label: 'Todos los alumnos activos' },
	{ value: 'GRADE', label: 'Por grado' },
	{ value: 'BRANCH', label: 'Por sucursal' },
	{ value: 'CLASS', label: 'Por clase' },
]

export function AdminBulkKataAssignment({ students, onClose, onAssigned }: AdminBulkKataAssignmentProps) {
	const [katas, setKatas] = useState<KataOption[]>([])
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [targetType, setTargetType] = useState<TargetType>('ALL')
	const [targetValue, setTargetValue] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const grades = useMemo(() => [...new Set(students.map((student) => student.currentRank).filter((value): value is string => Boolean(value)))].sort(), [students])
	const branches = useMemo(() => [...new Set(students.map((student) => student.branchName))].sort(), [students])
	const classes = useMemo(() => [...new Set(students.flatMap((student) => student.activeClassNames))].sort(), [students])

	useEffect(() => {
		let cancelled = false
		fetch('/api/dashboard/admin/techniques')
			.then((response) => response.json())
			.then((payload: { techniques?: KataOption[] }) => {
				if (!cancelled) setKatas(payload.techniques ?? [])
			})
			.catch(() => {
				if (!cancelled) setError('No fue posible cargar el catálogo de técnicas.')
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	const targetStudents = useMemo(() => {
		const active = students.filter((student) => student.status === 'ACTIVE')
		if (targetType === 'GRADE') return active.filter((student) => student.currentRank === targetValue)
		if (targetType === 'BRANCH') return active.filter((student) => student.branchName === targetValue)
		if (targetType === 'CLASS') return active.filter((student) => student.activeClassNames.includes(targetValue))
		return active
	}, [students, targetType, targetValue])

	const preview = useMemo(() => {
		let studentsWithNew = 0
		let totalMissing = 0
		for (const student of targetStudents) {
			const owned = new Set(student.techniques.map((technique) => technique.id))
			const missing = selectedIds.filter((id) => !owned.has(id)).length
			if (missing > 0) studentsWithNew += 1
			totalMissing += missing
		}
		return { studentsWithNew, totalMissing }
	}, [targetStudents, selectedIds])

	const filteredKatas = useMemo(() => {
		const term = searchTerm.trim().toLocaleLowerCase('es')
		if (!term) return katas
		return katas.filter((kata) => [kata.name, kata.kanji ?? '', kata.japaneseName ?? ''].some((value) => value.toLocaleLowerCase('es').includes(term)))
	}, [katas, searchTerm])

	const targetOptions = targetType === 'GRADE' ? grades : targetType === 'BRANCH' ? branches : targetType === 'CLASS' ? classes : []
	const targetReady = targetType === 'ALL' || targetValue !== ''
	const canSubmit = selectedIds.length > 0 && targetReady && preview.totalMissing > 0 && !isSaving

	function toggleKata(kataId: string) {
		setSelectedIds((previous) => (previous.includes(kataId) ? previous.filter((id) => id !== kataId) : [...previous, kataId]))
	}

	async function handleAssign() {
		setIsSaving(true)
		setError(null)
		try {
			const response = await fetch('/api/dashboard/admin/students/assign-techniques', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ techniqueIds: selectedIds, target: { type: targetType, value: targetType === 'ALL' ? undefined : targetValue } }),
			})
			const payload = await response.json().catch(() => ({})) as { error?: string; studentsProcessed?: number; linksAdded?: number }
			if (!response.ok) throw new Error(payload.error ?? 'No fue posible asignar las técnicas.')
			onAssigned({ studentsProcessed: payload.studentsProcessed ?? 0, linksAdded: payload.linksAdded ?? 0 })
		} catch (reason: unknown) {
			setError(reason instanceof Error ? reason.message : 'No fue posible asignar las técnicas.')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
			<div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-edge bg-surface-1 px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-accent">
							<BookOpenCheck className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-ink">Asignar técnicas a un grupo</h3>
							<p className="text-xs text-ink-3">Suma técnicas al expediente de varios alumnos a la vez.</p>
						</div>
					</div>
					<button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex shrink-0 flex-col gap-3 border-b border-edge p-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="text-xs font-semibold text-ink-2" htmlFor="bulk-kata-target-type">
							Destino
							<select id="bulk-kata-target-type" value={targetType} onChange={(event) => { setTargetType(event.target.value as TargetType); setTargetValue('') }} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink">
								{TARGET_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</select>
						</label>
						{targetType !== 'ALL' && (
							<label className="text-xs font-semibold text-ink-2" htmlFor="bulk-kata-target-value">
								{targetType === 'GRADE' ? 'Grado' : targetType === 'BRANCH' ? 'Sucursal' : 'Clase'}
								<select id="bulk-kata-target-value" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink">
									<option value="">Selecciona…</option>
									{targetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
								</select>
							</label>
						)}
					</div>
					<p className="rounded-md border border-edge bg-surface-1 px-3 py-2 text-[11px] text-ink-3">
						Son <span className="font-bold text-ink">{targetStudents.length}</span> alumnos activos en el destino. Al confirmar se <span className="font-semibold text-ink">agregan</span> las técnicas que falten; no se elimina ninguna.
					</p>
				</div>

				<div className="flex shrink-0 flex-col gap-2.5 border-b border-edge p-4">
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
						<input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica por nombre o kanji..." className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-4 text-xs text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none" />
					</div>
					<div className="flex items-center justify-between text-xs">
						<span className="font-bold text-accent">{selectedIds.length} seleccionadas de {katas.length}</span>
						{selectedIds.length > 0 && (
							<button type="button" onClick={() => setSelectedIds([])} className="text-[11px] text-ink-3 underline transition-colors hover:text-ink">Limpiar selección</button>
						)}
					</div>
				</div>

				<div className="flex-1 space-y-2 overflow-y-auto p-4">
					{isLoading && <p className="flex items-center justify-center gap-2 py-6 text-xs text-ink-3"><Loader2 className="h-4 w-4 animate-spin" />Cargando catálogo…</p>}
					{!isLoading && filteredKatas.map((kata) => {
						const isChecked = selectedIds.includes(kata.id)
						return (
							<label key={kata.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${isChecked ? 'border-cyan-500/60 bg-surface-3' : 'border-edge bg-surface-1 hover:bg-surface-3/50'}`}>
								<div className="flex min-w-0 items-center gap-3">
									<input type="checkbox" checked={isChecked} onChange={() => toggleKata(kata.id)} className="size-4 shrink-0 cursor-pointer rounded accent-cyan-400" />
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="truncate text-xs font-bold text-ink">{kata.name}</span>
											{kata.kanji && <span className="text-[11px] text-ink-3">{kata.kanji}</span>}
										</div>
										<p className="mt-0.5 truncate text-[11px] text-ink-3">{techniqueCategoryLine(kata)}{kata.japaneseName ? ` · ${kata.japaneseName}` : ''}</p>
									</div>
								</div>
							</label>
						)
					})}
					{!isLoading && filteredKatas.length === 0 && <p className="p-6 text-center text-xs text-ink-4">No se encontraron técnicas que coincidan con la búsqueda.</p>}
					{error && <p className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-danger-text">{error}</p>}
				</div>

				<div className="flex shrink-0 flex-col gap-3 border-t border-edge bg-surface-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-ink-3">
						{preview.totalMissing > 0
							? <><span className="font-bold text-ink">{preview.studentsWithNew}</span> alumno(s) · <span className="font-bold text-ink">{preview.totalMissing}</span> técnica(s) nuevas</>
							: 'Selecciona técnicas y un destino para ver la vista previa.'}
					</p>
					<div className="flex items-center justify-end gap-2.5">
						<button type="button" onClick={onClose} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink">Cancelar</button>
						<button type="button" onClick={handleAssign} disabled={!canSubmit} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-50">
							{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
							Asignar técnicas
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
