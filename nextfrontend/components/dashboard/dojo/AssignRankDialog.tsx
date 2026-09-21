'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownUp, Award, Check, Info, Loader2, X } from 'lucide-react'
import { BeltRankIndicator } from '../shared/BeltRankIndicator'
import type { AdminBeltRankSummary } from '@/types/dashboard'

interface AssignRankStudent {
	id: string
	name: string
	memberNumber: string | null
	currentRank: string | null
}

interface AssignRankDialogProps {
	student: AssignRankStudent
	currentRankOrder: number | null
	ranks: AdminBeltRankSummary[]
	isOpen: boolean
	onClose: () => void
}

type Direction = 'ascenso' | 'descenso' | 'sin-cambio'

export function AssignRankDialog({ student, currentRankOrder, ranks, isOpen, onClose }: AssignRankDialogProps) {
	const router = useRouter()
	const currentRank = ranks.find((rank) => rank.order === currentRankOrder)
	const program = currentRank?.program ?? ranks[0]?.program ?? null
	const programRanks = program ? ranks.filter((rank) => rank.program === program) : ranks
	const sortedRanks = [...programRanks].sort((a, b) => a.order - b.order)
	const currentRankId = sortedRanks.find((rank) => rank.order === currentRankOrder)?.id ?? ''
	const [beltRankId, setBeltRankId] = useState(currentRankId)
	const [promotedAt, setPromotedAt] = useState(new Date().toISOString().slice(0, 10))
	const [examinerName, setExaminerName] = useState('')
	const [notes, setNotes] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const openKey = `${student.id}:${currentRankOrder ?? ''}`
	const [lastOpenKey, setLastOpenKey] = useState(openKey)

	if (isOpen && lastOpenKey !== openKey) {
		setLastOpenKey(openKey)
		setBeltRankId(currentRankId)
		setPromotedAt(new Date().toISOString().slice(0, 10))
		setExaminerName('')
		setNotes('')
		setError(null)
	}

	if (!isOpen) return null

	const chosenRank = sortedRanks.find((rank) => rank.id === beltRankId)
	const direction: Direction = chosenRank && currentRankOrder !== null
		? chosenRank.order > currentRankOrder
			? 'ascenso'
			: chosenRank.order < currentRankOrder
				? 'descenso'
				: 'sin-cambio'
		: 'sin-cambio'

	function handleConfirm() {
		if (!beltRankId) {
			setError('Selecciona un grado a otorgar.')
			return
		}
		setError(null)
		setIsSaving(true)
		fetch(`/api/dashboard/admin/students/${student.id}/promotions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				beltRankId,
				promotedAt,
				examinerName: examinerName.trim() || null,
				notes: notes.trim() || null,
			}),
		})
			.then(async (response) => {
				const payload = await response.json().catch(() => ({}))
				if (!response.ok) throw new Error(payload.error ?? 'No fue posible registrar el cambio de grado.')
				router.refresh()
				onClose()
			})
			.catch((reason: Error) => setError(reason.message))
			.finally(() => setIsSaving(false))
	}

	const nextTargetRank = chosenRank ? sortedRanks.find((rank) => rank.order === chosenRank.order + 1) : null

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
			<div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-edge bg-surface-1 px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-accent">
							<Award className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-ink">Asignar nuevo grado</h3>
							<p className="text-xs text-ink-3">{student.name} · {student.memberNumber ?? 'Sin matrícula'}</p>
						</div>
					</div>
					<button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex-1 space-y-4 overflow-y-auto p-5">
					<div className="flex items-center justify-between rounded-lg border border-edge bg-surface-1 p-3">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Grado actual en expediente</p>
							<p className="mt-0.5 text-xs font-bold text-ink">{student.currentRank ?? 'Sin grado asignado'}</p>
						</div>
						{currentRank && <BeltRankIndicator rank={currentRank} size="sm" />}
					</div>

					<label className="block text-sm font-semibold text-ink" htmlFor="assign-rank-select">
						Seleccionar grado
						<select id="assign-rank-select" value={beltRankId} onChange={(event) => setBeltRankId(event.target.value)} className="mt-1.5 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink">
							{programRanks.length === 0 && <option value="">No hay grados disponibles</option>}
							{programRanks.map((rank) => (
								<option key={rank.id} value={rank.id}>{rank.kyuDan ? `${rank.kyuDan} · ` : ''}{rank.name}{rank.order === currentRankOrder ? ' (Actual)' : rank.order === (currentRankOrder ?? 0) + 1 ? ' (Siguiente en syllabus)' : ''}</option>
							))}
						</select>
					</label>

					<div className="grid gap-3 sm:grid-cols-2">
						<label className="block text-sm font-semibold text-ink" htmlFor="assign-rank-date">
							Fecha de examen
							<input id="assign-rank-date" type="date" value={promotedAt} onChange={(event) => setPromotedAt(event.target.value)} className="mt-1.5 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" />
						</label>
						<label className="block text-sm font-semibold text-ink" htmlFor="assign-rank-examiner">
							Sensei examinador
							<input id="assign-rank-examiner" value={examinerName} onChange={(event) => setExaminerName(event.target.value)} placeholder="Ej: Sensei Roberto Castillo" className="mt-1.5 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" />
						</label>
					</div>

					<label className="block text-sm font-semibold text-ink" htmlFor="assign-rank-notes">
						Notas
						<textarea id="assign-rank-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink" />
					</label>

					<div className="flex gap-2.5 rounded-lg border border-amber-900/30 bg-amber-950/20 p-3.5">
						<Info className="mt-0.5 h-5 w-5 shrink-0 text-warn-text" />
						<div className="space-y-1 text-xs leading-relaxed text-ink-2">
							<strong className="block font-bold text-warn-text">Efecto reglamentario en el avance:</strong>
							{direction === 'descenso' ? (
								<p>
									Al confirmar el <strong className="text-ink">descenso</strong> a <strong className="text-ink">{chosenRank?.name} ({chosenRank?.kyuDan ?? '—'})</strong>, el grado del alumno quedará por debajo de su nivel actual y su próxima meta pasará a ser{' '}
									<strong className="text-ink">{chosenRank && nextTargetRank ? `${nextTargetRank.name} (${nextTargetRank.kyuDan ?? '—'})` : 'el siguiente grado del syllabus'}</strong>. Las katas ya dominadas se conservan en su expediente.
								</p>
							) : direction === 'ascenso' ? (
								<p>
									Al confirmar el ascenso a <strong className="text-ink">{chosenRank?.name} ({chosenRank?.kyuDan ?? '—'})</strong>, el progreso del alumno se actualizará. Su siguiente meta pasará a ser{' '}
									<strong className="text-ink">{nextTargetRank ? `${nextTargetRank.name} (${nextTargetRank.kyuDan ?? '—'})` : 'el grado máximo final'}</strong>.
									Las nuevas katas oficiales se vinculan automáticamente a su expediente.
								</p>
							) : (
								<p>Se registrará el grado seleccionado sin cambiar la posición actual del alumno en el syllabus.</p>
							)}
						</div>
					</div>

					{error && <p className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-danger-text">{error}</p>}
				</div>

				<div className="flex items-center justify-end gap-2.5 border-t border-edge bg-surface-1 px-5 py-3.5">
					<button type="button" onClick={onClose} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink">
						Cancelar
					</button>
					<button type="button" onClick={handleConfirm} disabled={isSaving || programRanks.length === 0} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-60">
						{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : direction === 'ascenso' ? <Check className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />}
						{direction === 'ascenso' ? 'Confirmar ascenso' : direction === 'descenso' ? 'Confirmar descenso' : 'Confirmar grado'}
					</button>
				</div>
			</div>
		</div>
	)
}