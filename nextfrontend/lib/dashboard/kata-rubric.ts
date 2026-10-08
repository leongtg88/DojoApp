/**
 * Criterios oficiales de evaluación de kata, agrupados en dos bloques
 * ponderados: Desempeño Técnico (70%) y Desempeño Atlético (30%).
 * El total se calcula como la media simple de cada bloque aplicada a su peso.
 */

export interface KataCriterion {
  key: string
  label: string
  description: string
}

export interface KataRubricBlock {
  key: string
  label: string
  /** Peso del bloque sobre el total (0–1). */
  weight: number
  criteria: KataCriterion[]
}

export const KATA_RUBRIC: KataRubricBlock[] = [
  {
    key: 'TECNICO',
    label: 'Desempeño Técnico',
    weight: 0.7,
    criteria: [
      { key: 'POSTURAS', label: 'Posturas (Stances)', description: 'Estabilidad y corrección.' },
      { key: 'TECNICAS', label: 'Técnicas', description: 'Precisión y efectividad de los movimientos.' },
      { key: 'TRANSICIONES', label: 'Movimientos de transición', description: 'Fluidez y control al pasar de una técnica a otra.' },
      { key: 'TIMING', label: 'Timing', description: 'Sincronización y ritmo.' },
      { key: 'KOKYU', label: 'Respiración (Kokyu)', description: 'Uso adecuado de la respiración.' },
      { key: 'KIME', label: 'Foco (Kime)', description: 'Concentración de energía en el momento del impacto.' },
      { key: 'CONFORMIDAD', label: 'Conformidad (Ryu-Ha)', description: 'Consistencia con el estilo y el kihon del kata.' },
    ],
  },
  {
    key: 'ATLETICO',
    label: 'Desempeño Atlético',
    weight: 0.3,
    criteria: [
      { key: 'FUERZA', label: 'Fuerza', description: 'Potencia y aplicación de la energía.' },
      { key: 'VELOCIDAD', label: 'Velocidad', description: 'Rapidez en la ejecución de las técnicas.' },
      { key: 'EQUILIBRIO', label: 'Equilibrio', description: 'Control corporal y estabilidad durante todo el kata.' },
    ],
  },
]

export const KATA_CRITERION_KEYS = [
  'POSTURAS',
  'TECNICAS',
  'TRANSICIONES',
  'TIMING',
  'KOKYU',
  'KIME',
  'CONFORMIDAD',
  'FUERZA',
  'VELOCIDAD',
  'EQUILIBRIO',
] as const

export type KataCriterionKey = (typeof KATA_CRITERION_KEYS)[number]

export type KataCriteriaScores = Partial<Record<KataCriterionKey, number>>

export const MIN_KATA_CRITERION_SCORE = 0
export const MAX_KATA_CRITERION_SCORE = 10

function isValidScore(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_KATA_CRITERION_SCORE &&
    value <= MAX_KATA_CRITERION_SCORE
  )
}

/** ¿Están los 10 sub-criterios completos y dentro de rango? */
export function isCompleteKataCriteria(
  scores: Partial<Record<string, number>> | null | undefined,
): scores is Record<KataCriterionKey, number> {
  if (!scores) return false
  return KATA_CRITERION_KEYS.every((key) => isValidScore(scores[key]))
}

/** Media sin ponderar de un bloque (0–10) o `null` si falta algún criterio. */
export function blockAverage(
  block: KataRubricBlock,
  scores: Partial<Record<string, number>>,
): number | null {
  const values = block.criteria.map(({ key }) => scores[key])
  if (!values.every(isValidScore)) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

/** Total ponderado de la kata (0–10), redondeado a 1 decimal. */
export function averageKataCriteria(scores: Partial<Record<string, number>>): number {
  let total = 0
  for (const block of KATA_RUBRIC) {
    const values = block.criteria.map(({ key }) => scores[key]).filter(isValidScore)
    const blockMean = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    total += block.weight * blockMean
  }
  return Math.round(total * 10) / 10
}

/** Normaliza el `criteria` (JSON de la BD) a un record de notas válidas. */
export function parseKataCriteria(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value as Record<string, unknown>).filter(([, score]) => isValidScore(score))
  if (entries.length === 0) return null
  return Object.fromEntries(entries) as Record<string, number>
}
