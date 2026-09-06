'use client'

import { BeltRankIndicator } from './BeltRankIndicator'
import { CheckCircle2, Edit2, Plus, Trash2 } from 'lucide-react'
import type { AdminBeltRankSummary } from '@/types/dashboard'

interface RankCatalogProps {
	ranks: AdminBeltRankSummary[]
	selectedRankId: string
	onSelectRank: (rankId: string) => void
	onEditRank?: (rank: AdminBeltRankSummary) => void
	onDeleteRank?: (rankId: string) => void
	onAddRank?: () => void
	className?: string
	id?: string
}

export function RankCatalog({
	ranks,
	selectedRankId,
	onSelectRank,
	onEditRank,
	onDeleteRank,
	onAddRank,
	className = '',
	id,
}: RankCatalogProps) {
	const sortedRanks = [...ranks].sort((a, b) => a.order - b.order)

	return (
		<div id={id} className={`space-y-2 ${className}`}>
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Escalafón Oficial de Cinturones</span>
					<span className="text-xs text-neutral-500">({sortedRanks.length} grados configurados)</span>
				</div>
				{onAddRank && (
					<button
						type="button"
						onClick={onAddRank}
						className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-200 transition-colors"
					>
						<Plus className="h-3.5 w-3.5" />
						<span>Nuevo grado</span>
					</button>
				)}
			</div>

			<div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1">
				{sortedRanks.map((rank) => {
					const isSelected = rank.id === selectedRankId

					return (
						<div
							key={rank.id}
							className={`flex w-48 shrink-0 flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
								isSelected
									? 'border-cyan-500 bg-[#161b22] shadow-md ring-1 ring-cyan-500/30'
									: 'border-neutral-800 bg-[#161b22] opacity-90 shadow-sm hover:opacity-100 hover:bg-[#1b2130]'
							}`}
							onClick={() => onSelectRank(rank.id)}
						>
							<div className="mb-3 flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<BeltRankIndicator rank={rank} size="sm" />
									<span className={`text-xs font-bold ${isSelected ? 'text-cyan-400' : 'text-neutral-400'}`}>{rank.kyuDan}</span>
								</div>
								{isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />}
							</div>

							<div>
								<div className="flex items-center justify-between">
									<h4 className="truncate text-xs font-bold text-white">{rank.name.replace('Cinturón ', '')}</h4>
									{isSelected && (
										<span className="rounded border border-cyan-900/40 bg-cyan-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
											Activo
										</span>
									)}
								</div>
								<p className="mt-1 truncate text-[11px] text-neutral-400">
									{rank.estimatedDurationMonths ? `${rank.estimatedDurationMonths}m · ` : '0m · '}
									{rank.isMaximumRank ? 'Grado máximo' : rank.japaneseName || 'Iniciación'}
								</p>
							</div>

							{(onEditRank || onDeleteRank) && (
								<div className="mt-2 flex items-center justify-end gap-1 border-t border-neutral-800 pt-2">
									{onEditRank && (
										<button
											type="button"
											title="Editar grado"
											onClick={(event) => {
												event.stopPropagation()
												onEditRank(rank)
											}}
											className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
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
											className="rounded p-1 text-neutral-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
										>
											<Trash2 className="h-3 w-3" />
										</button>
									)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}