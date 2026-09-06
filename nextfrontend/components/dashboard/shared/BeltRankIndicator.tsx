'use client'

export interface BeltRankIndicatorData {
	name?: string | null
	kyuDan?: string | null
	beltColor?: string | null
	beltSecondaryColor?: string | null
	isMaximumRank?: boolean
}

interface BeltRankIndicatorProps {
	rank?: BeltRankIndicatorData | null
	name?: string
	kyuDan?: string
	color?: string
	secondaryColor?: string
	size?: 'sm' | 'md' | 'lg'
	showDetails?: boolean
	className?: string
	id?: string
}

export function BeltRankIndicator({
	rank,
	name,
	kyuDan,
	color,
	secondaryColor,
	size = 'md',
	showDetails = false,
	className = '',
	id,
}: BeltRankIndicatorProps) {
	const displayColor = color || rank?.beltColor || '#FACC15'
	const displaySecColor = secondaryColor || rank?.beltSecondaryColor || '#CA8A04'
	const displayName = name || rank?.name || 'Cinturón'
	const displayKyuDan = kyuDan || rank?.kyuDan || ''
	const isDan = rank?.isMaximumRank || displayKyuDan.toLowerCase().includes('dan')

	const heightClasses = {
		sm: 'h-2.5 w-10',
		md: 'h-3.5 w-12',
		lg: 'h-7 w-full',
	}

	if (size === 'lg') {
		return (
			<div
				id={id}
				className={`relative w-full h-7 rounded-lg overflow-hidden flex items-center justify-between px-3 ${className}`}
				style={{ backgroundColor: displayColor }}
			>
				<div className="absolute inset-y-0 left-0 right-0 h-1 my-auto opacity-35" style={{ backgroundColor: isDan ? '#B8B070' : displaySecColor }} />
				<div className="relative z-10 flex items-center justify-between w-full">
					<span className="font-bold text-xs tracking-wider uppercase" style={{ color: isDan ? '#FFFFFF' : '#18181B' }}>
						{displayKyuDan} {displayName}
					</span>
					<div className="h-5 w-3.5 bg-[#18181B] rounded-[2px] flex items-center justify-center border border-black/20">
						<span className="h-3 w-1 rounded-[1px]" style={{ backgroundColor: isDan ? '#B8B070' : displayColor }} />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div id={id} className={`inline-flex items-center gap-2 ${className}`}>
			<div
				className={`relative rounded-[2px] overflow-hidden flex items-center justify-end px-0.5 border border-black/10 ${heightClasses[size]}`}
				style={{ backgroundColor: displayColor }}
			>
				<div className="absolute inset-y-0 left-0 right-0 h-0.5 my-auto opacity-40" style={{ backgroundColor: displaySecColor }} />
				<div className="relative z-10 w-1.5 h-full bg-[#18181B] flex items-center justify-center">
					<span className="w-0.5 h-2 rounded-[1px]" style={{ backgroundColor: isDan ? '#B8B070' : displayColor }} />
				</div>
			</div>
			{showDetails && (
				<div className="flex flex-col">
					<span className="text-xs font-bold text-white leading-tight">{displayName}</span>
					{displayKyuDan && <span className="text-[11px] text-neutral-400 font-semibold">{displayKyuDan}</span>}
				</div>
			)}
		</div>
	)
}