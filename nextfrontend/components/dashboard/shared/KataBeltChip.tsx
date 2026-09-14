'use client'

interface KataBeltChipProps {
	level?: string | null
	beltColor?: string | null
	beltSecondaryColor?: string | null
	className?: string
}

export function KataBeltChip({ level, beltColor, beltSecondaryColor, className = '' }: KataBeltChipProps) {
	if (!level) return null

	const color = beltColor ?? '#3f3f46'
	const isDark = level === 'Negro' || color.toUpperCase() === '#212121'

	return (
		<span className={`inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-[#0d1117] px-2 py-1 text-[11px] font-semibold text-neutral-200 ${className}`}>
			<span
				aria-hidden="true"
				className="relative inline-block h-2.5 w-3.5 overflow-hidden rounded-sm border border-white/30"
				style={{ backgroundColor: color, boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.5)' : undefined }}
			>
				{beltSecondaryColor && <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2" style={{ backgroundColor: beltSecondaryColor }} />}
			</span>
			{level}
		</span>
	)
}
