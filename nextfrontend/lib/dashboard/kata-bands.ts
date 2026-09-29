import type { Program } from '@/lib/curriculum/programs'

export type KataBand = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO'

export interface KataBandDefinition {
	band: KataBand
	label: string
	maxOrder: number
}

/**
 * Tramos de progresión por programa. El `maxOrder` es el order de grado máximo
 * (inclusive) que entra en el tramo; el resto cae en el tramo siguiente. El
 * último tramo absorbe todo. Compartido por el registro de repeticiones del
 * alumno y el catálogo de técnicas del admin para que los tramos coincidan.
 */
export const KATA_BANDS: Record<Program, KataBandDefinition[]> = {
	YOUTH: [
		{ band: 'PRINCIPIANTE', label: 'Principiante · 11th Kyu – 9th Kyu', maxOrder: 5 },
		{ band: 'INTERMEDIO', label: 'Intermedio · 8th Kyu – 4th Kyu', maxOrder: 12 },
		{ band: 'AVANZADO', label: 'Avanzado · 3rd Kyu – Cinturón Negro', maxOrder: Number.MAX_SAFE_INTEGER },
	],
	ADULT: [
		{ band: 'PRINCIPIANTE', label: 'Principiante · 11th Kyu – 9th Kyu', maxOrder: 3 },
		{ band: 'INTERMEDIO', label: 'Intermedio · 8th Kyu – 4th Kyu', maxOrder: 8 },
		{ band: 'AVANZADO', label: 'Avanzado · 3rd Kyu – Cinturón Negro', maxOrder: Number.MAX_SAFE_INTEGER },
	],
}

export function bandForOrder(program: Program, order: number): KataBand {
	return KATA_BANDS[program].find((entry) => order <= entry.maxOrder)?.band ?? 'AVANZADO'
}

export interface BandBeltChip {
	key: string
	beltColor: string
}

/** Colores de cinturón distintos (sólidos) presentes en un tramo, sin repetir y
 *  ordenados por el grado de introducción. */
export function beltChipsForLevels(levels: Array<{ gradeOrder: number; beltColor: string | null }>): BandBeltChip[] {
	const byOrder = new Map<number, BandBeltChip>()
	const seenColors = new Set<string>()
	for (const level of levels) {
		const color = (level.beltColor ?? '#3f3f46').toUpperCase()
		if (seenColors.has(color)) continue
		seenColors.add(color)
		byOrder.set(level.gradeOrder, { key: color, beltColor: level.beltColor ?? '#3f3f46' })
	}
	return [...byOrder.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1])
}
