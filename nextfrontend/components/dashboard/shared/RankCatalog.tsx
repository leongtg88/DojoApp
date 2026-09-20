'use client'

import { useEffect, useRef, useState } from 'react'
import { Reorder } from 'motion/react'
import { BeltRankIndicator } from './BeltRankIndicator'
import { CheckCircle2, Edit2, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { AdminBeltRankSummary } from '@/types/dashboard'

type Program = 'ADULT' | 'YOUTH'

interface RankCatalogProps {
	ranks: AdminBeltRankSummary[]
	selectedRankId: string
	onSelectRank: (rankId: string) => void
	onEditRank?: (rank: AdminBeltRankSummary) => void
	onDeleteRank?: (rankId: string) => void
	onAddRank?: () => void
	onReorderRanks?: (program: Program, orderedIds: string[]) => void
	canReorder?: boolean
	className?: string
	id?: string
}

const PROGRAM_GROUPS: { program: Program; label: string }[] = [
	{ program: 'ADULT', label: 'Adultos' },
	{ program: 'YOUTH', label: 'Niños' },
]

function sortByOrder(list: AdminBeltRankSummary[]) {
	return [...list].sort((a, b) => a.order - b.order)
}

function buildGroups(ranks: AdminBeltRankSummary[]): Record<Program, AdminBeltRankSummary[]> {
	return {
		ADULT: sortByOrder(ranks.filter((rank) => rank.program === 'ADULT')),
		YOUTH: sortByOrder(ranks.filter((rank) => rank.program === 'YOUTH')),
	}
}

export function RankCatalog({
	ranks,
	selectedRankId,
	onSelectRank,
	onEditRank,
	onDeleteRank,
	onAddRank,
	onReorderRanks,
	canReorder = false,
	className = '',
	id,
}: RankCatalogProps) {
	const ranksSignature = ranks.map((rank) => `${rank.id}:${rank.order}`).join('|')
	const [groups, setGroups] = useState<Record<Program, AdminBeltRankSummary[]>>(() => buildGroups(ranks))
	const [syncedSignature, setSyncedSignature] = useState(ranksSignature)

	if (syncedSignature !== ranksSignature) {
		setSyncedSignature(ranksSignature)
		setGroups(buildGroups(ranks))
	}

	function handleReorder(program: Program, next: AdminBeltRankSummary[]) {
		setGroups((previous) => ({ ...previous, [program]: next }))
		onReorderRanks?.(program, next.map((rank) => rank.id))
	}

	return (
		<div id={id} className={`space-y-4 ${className}`}>
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-ink-3">Escalafón Oficial de Cinturones</span>
					<span className="text-xs text-ink-4">({ranks.length} grados configurados)</span>
				</div>
				{onAddRank && (
					<button
						type="button"
						onClick={onAddRank}
						className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-text transition-colors"
					>
						<Plus className="h-3.5 w-3.5" />
						<span>Nuevo grado</span>
					</button>
				)}
			</div>

			{PROGRAM_GROUPS.map(({ program, label }) => {
				const list = groups[program]
				if (list.length === 0) return null

				return (
					<div className="space-y-2" key={program}>
						<p className="px-1 text-[10px] font-bold uppercase tracking-wider text-ink-4">
							{label} <span className="font-medium normal-case text-ink-4">({list.length})</span>
						</p>
						<RankRow
							canReorder={canReorder}
							list={list}
							onDeleteRank={onDeleteRank}
							onEditRank={onEditRank}
							onReorder={(next) => handleReorder(program, next)}
							onSelectRank={onSelectRank}
							selectedRankId={selectedRankId}
						/>
					</div>
				)
			})}
		</div>
	)
}

function RankRow({
	canReorder,
	list,
	onDeleteRank,
	onEditRank,
	onReorder,
	onSelectRank,
	selectedRankId,
}: {
	canReorder: boolean
	list: AdminBeltRankSummary[]
	onDeleteRank?: (rankId: string) => void
	onEditRank?: (rank: AdminBeltRankSummary) => void
	onReorder: (next: AdminBeltRankSummary[]) => void
	onSelectRank: (rankId: string) => void
	selectedRankId: string
}) {
	const scrollRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const element = scrollRef.current
		if (!element) return
		const node: HTMLDivElement = element

		function handleWheel(event: WheelEvent) {
			if (event.deltaY === 0) return
			if (node.scrollWidth <= node.clientWidth) return
			event.preventDefault()
			node.scrollLeft += event.deltaY
		}

		node.addEventListener('wheel', handleWheel, { passive: false })
		return () => node.removeEventListener('wheel', handleWheel)
	}, [])

	return (
		<div ref={scrollRef} className="overflow-x-auto overscroll-x-contain pb-2 pt-1">
			<Reorder.Group as="div" axis="x" className="flex items-stretch gap-3" onReorder={onReorder} values={list}>
				{list.map((rank) => {
					const isSelected = rank.id === selectedRankId

					return (
						<Reorder.Item
							as="div"
							className={`flex w-48 shrink-0 flex-col justify-between rounded-xl border p-3.5 text-left transition-colors ${canReorder ? 'cursor-grab active:cursor-grabbing' : ''} ${
								isSelected
									? 'border-cyan-500 bg-surface-2 shadow-md ring-1 ring-cyan-500/30'
									: 'border-edge bg-surface-2 opacity-90 shadow-sm hover:opacity-100 hover:bg-surface-3'
							}`}
							dragListener={canReorder}
							key={rank.id}
							onClick={() => onSelectRank(rank.id)}
							value={rank}
						>
							<div className="mb-3 flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<BeltRankIndicator rank={rank} size="sm" />
									<span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-ink-3'}`}>{rank.kyuDan}</span>
								</div>
								{canReorder ? (
									<GripVertical aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-4" />
								) : isSelected ? (
									<CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
								) : null}
							</div>

							<div>
								<div className="flex items-center justify-between">
									<h4 className="truncate text-xs font-bold text-ink">{rank.name.replace('Cinturón ', '')}</h4>
									{isSelected && (
										<span className="rounded border border-cyan-900/40 bg-cyan-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
											Activo
										</span>
									)}
								</div>
								<p className="mt-1 truncate text-[11px] text-ink-3">
									{rank.estimatedDurationMonths ? `${rank.estimatedDurationMonths}m · ` : '0m · '}
									{rank.isMaximumRank ? 'Grado máximo' : rank.japaneseName || 'Iniciación'}
								</p>
							</div>

							{(onEditRank || onDeleteRank) && (
								<div className="mt-2 flex items-center justify-end gap-1 border-t border-edge pt-2">
									{onEditRank && (
										<button
											type="button"
											title="Editar grado"
											onClick={(event) => {
												event.stopPropagation()
												onEditRank(rank)
											}}
											className="rounded p-1 text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
										>
											<Edit2 className="h-3 w-3" />
										</button>
									)}
									{onDeleteRank && !rank.isMaximumRank && (
										<button
											type="button"
											title="Eliminar grado"
											onClick={(event) => {
												event.stopPropagation()
												onDeleteRank(rank.id)
											}}
											className="rounded p-1 text-ink-3 transition-colors hover:bg-red-950/50 hover:text-danger-text"
										>
											<Trash2 className="h-3 w-3" />
										</button>
									)}
								</div>
							)}
						</Reorder.Item>
					)
				})}
			</Reorder.Group>
		</div>
	)
}
