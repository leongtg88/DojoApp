'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BookOpen, Check, Loader2, Lock, Search, X } from 'lucide-react'
import type { AdminTechniqueSummary } from '@/types/dashboard'

export interface AssignedTechniqueRef {
	id: string
	approved: boolean
}

interface KataAssignmentDialogProps {
	studentId: string
	studentName: string
	isOpen: boolean
	onClose: () => void
	assignedTechniques: AssignedTechniqueRef[]
	availableTechniques: AdminTechniqueSummary[]
}

export function KataAssignmentDialog({ studentId, studentName, isOpen, onClose, assignedTechniques, availableTechniques }: KataAssignmentDialogProps) {
	const router = useRouter()
	const assignedIds = useMemo(() => assignedTechniques.map((technique) => technique.id), [assignedTechniques])
	const assignedKey = useMemo(() => [...assignedIds].sort().join('|'), [assignedIds])
	const lockedIds = useMemo(() => new Set(assignedTechniques.filter((technique) => technique.approved).map((technique) => technique.id)), [assignedTechniques])

	const [lastAssignedKey, setLastAssignedKey] = useState(assignedKey)
	const [selectedIds, setSelectedIds] = useState<string[]>(assignedIds)
	const [searchTerm, setSearchTerm] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	if (isOpen && lastAssignedKey !== assignedKey) {
		setLastAssignedKey(assignedKey)
		setSelectedIds(assignedIds)
		setNotice(null)
	}

	const filteredTechniques = useMemo(() => {
		const term = searchTerm.trim().toLocaleLowerCase('es')
		if (!term) return availableTechniques
		return availableTechniques.filter((technique) =>
			[technique.name, technique.kanji ?? '', technique.japaneseName ?? '', technique.description ?? '', technique.category].some((value) => value.toLocaleLowerCase('es').includes(term)),
		)
	}, [availableTechniques, searchTerm])

	if (!isOpen) return null

	function toggleTechnique(techniqueId: string) {
		if (lockedIds.has(techniqueId)) return
		setSelectedIds((previous) => (previous.includes(techniqueId) ? previous.filter((id) => id !== techniqueId) : [...previous, techniqueId]))
	}

	function handleSave() {
		setIsSaving(true)
		setError(null)
		setNotice(null)
		fetch(`/api/dashboard/admin/students/${studentId}/techniques`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ techniqueIds: selectedIds }),
		})
			.then(async (response) => {
				const payload = await response.json().catch(() => ({})) as { error?: string; skipped?: number }
				if (!response.ok) throw new Error(payload.error ?? 'No fue posible actualizar la asignación.')
				router.refresh()
				if (payload.skipped && payload.skipped > 0) {
					setNotice(`${payload.skipped} kata(s) aprobada(s) o evaluada(s) se conservaron en el expediente y no se pueden quitar.`)
					return
				}
				onClose()
			})
			.catch((reason: Error) => setError(reason.message))
			.finally(() => setIsSaving(false))
	}

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
			<div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-neutral-800 bg-[#161b22] shadow-2xl" onClick={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-neutral-800 bg-[#0d1117] px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-cyan-400">
							<BookOpen className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-white">Asignar katas al expediente</h3>
							<p className="text-xs text-neutral-400">Destino: {studentName}</p>
						</div>
					</div>
					<button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex shrink-0 flex-col gap-2.5 border-b border-neutral-800 p-4">
					<p className="rounded-md border border-neutral-800 bg-[#0d1117] px-3 py-2 text-[11px] leading-relaxed text-neutral-400">
						Esto actualiza el <span className="font-semibold text-neutral-200">expediente técnico</span> del alumno. Las katas <span className="font-semibold text-neutral-200">requeridas por grado</span> se editan en <span className="font-semibold text-cyan-300">Grados y katas</span>.
					</p>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
						<input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar kata por nombre, linaje o kanji..." className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2 pl-9 pr-4 text-xs text-white placeholder:text-neutral-500 focus:border-cyan-500 focus:outline-none" />
					</div>
					<div className="flex items-center justify-between px-0.5 text-xs">
						<span className="font-bold text-cyan-400">{selectedIds.length} seleccionadas de {availableTechniques.length} disponibles</span>
						{selectedIds.some((id) => !lockedIds.has(id)) && (
							<button type="button" onClick={() => setSelectedIds((previous) => previous.filter((id) => lockedIds.has(id)))} className="text-[11px] text-neutral-400 underline transition-colors hover:text-white">
								Quitar no aprobadas
							</button>
						)}
					</div>
				</div>

				<div className="flex-1 space-y-2 overflow-y-auto p-4">
					{filteredTechniques.map((technique) => {
						const isChecked = selectedIds.includes(technique.id)
						const isLocked = lockedIds.has(technique.id)

						return (
							<label key={technique.id} className={`flex items-center justify-between rounded-lg border p-3 transition-all ${isLocked ? 'cursor-not-allowed border-emerald-900/40 bg-emerald-950/10' : isChecked ? 'cursor-pointer border-cyan-500/60 bg-[#16202e]' : 'cursor-pointer border-neutral-800 bg-[#0d1117] hover:bg-neutral-800/50'}`}>
								<div className="flex min-w-0 items-center gap-3">
									<input type="checkbox" checked={isChecked} disabled={isLocked} onChange={() => toggleTechnique(technique.id)} className="size-4 shrink-0 cursor-pointer rounded accent-cyan-400 disabled:cursor-not-allowed" />
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="truncate text-xs font-bold text-white">{technique.name}</span>
											{technique.kanji && <span className="text-[11px] text-neutral-400">{technique.kanji}</span>}
										</div>
										<p className="mt-0.5 truncate text-[11px] text-neutral-400">{technique.description || `${technique.movementsCount ?? '—'} movimientos`}</p>
									</div>
								</div>
								<div className="ml-2 flex shrink-0 items-center gap-2">
									{isLocked && <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"><Lock className="size-3" />Aprobada</span>}
									<span className="rounded border border-neutral-700 bg-[#161b22] px-2 py-0.5 text-[10px] font-semibold text-neutral-300">{technique.category}</span>
								</div>
							</label>
						)
					})}
					{filteredTechniques.length === 0 && <p className="p-6 text-center text-xs text-neutral-500">No se encontraron técnicas que coincidan con la búsqueda.</p>}
					{notice && (
						<p className="flex items-start gap-2 rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-200">
							<AlertTriangle className="mt-0.5 size-4 shrink-0" />{notice}
						</p>
					)}
					{error && <p className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}
				</div>

				<div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-neutral-800 bg-[#0d1117] px-5 py-3.5">
					<button type="button" onClick={onClose} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white">
						{notice ? 'Cerrar' : 'Cancelar'}
					</button>
					<button type="button" onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-60">
						{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
						Guardar asignación
					</button>
				</div>
			</div>
		</div>
	)
}
