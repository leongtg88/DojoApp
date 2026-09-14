import { baseBeltLevelForColor, type Program } from '@/lib/curriculum/programs'
import type { AdminBeltRankSummary } from '@/types/dashboard'

export interface KataLevelInfo {
	gradeOrder: number
	position: number
	level: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	rankName: string
}

/** Deriva el nivel (grado de introducción) de cada kata dentro de un programa,
 *  a partir de los grados con sus técnicas ya ordenadas por posición. */
export function buildProgramKataLevels(ranks: AdminBeltRankSummary[], program: Program): Map<string, KataLevelInfo> {
	const map = new Map<string, KataLevelInfo>()
	const sorted = [...ranks].filter((rank) => rank.program === program).sort((a, b) => a.order - b.order)

	for (const rank of sorted) {
		rank.techniques.forEach((technique, position) => {
			if (map.has(technique.id)) return
			map.set(technique.id, {
				gradeOrder: rank.order,
				position,
				level: baseBeltLevelForColor(rank.beltColor),
				beltColor: rank.beltColor,
				beltSecondaryColor: rank.beltSecondaryColor,
				rankName: rank.name,
			})
		})
	}

	return map
}

export interface BeltRankKataLike {
	order: number
	beltRank: {
		program: Program
		order: number
		name: string
		beltColor: string | null
		beltSecondaryColor: string | null
	}
}

/** Versión para queries del servidor: deriva el grado de introducción de una kata
 *  dentro del programa indicado a partir de sus BeltRankKata. */
export function introLevelFromBeltRankKatas(entries: BeltRankKataLike[], program: Program): KataLevelInfo | null {
	const candidates = entries.filter((entry) => entry.beltRank.program === program)
	if (candidates.length === 0) return null

	const intro = candidates.reduce((min, entry) => {
		if (entry.beltRank.order < min.beltRank.order) return entry
		if (entry.beltRank.order === min.beltRank.order && entry.order < min.order) return entry
		return min
	})

	return {
		gradeOrder: intro.beltRank.order,
		position: intro.order,
		level: baseBeltLevelForColor(intro.beltRank.beltColor),
		beltColor: intro.beltRank.beltColor,
		beltSecondaryColor: intro.beltRank.beltSecondaryColor,
		rankName: intro.beltRank.name,
	}
}
