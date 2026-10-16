import type { KihonCategory, KumiteCategory, TechniqueCategory } from '@/types/dashboard'
import { KIHON_CATEGORIES, KIHON_CATEGORY_LABELS } from './kihon-categories'
import { KUMITE_CATEGORIES, KUMITE_CATEGORY_LABELS } from './kumite-categories'

const KIHON_ACCENT = 'bg-[#00617f]'
const KUMITE_ACCENT = 'bg-[#dc2626]'
const CATEGORY_ACCENTS: Record<'KATA' | 'BUNKAI', string> = {
  KATA: 'bg-[#666028]',
  BUNKAI: 'bg-[#b8b070]',
}

export interface CategorizedTechnique {
  category: TechniqueCategory
  kihonCategory: KihonCategory | null
  kumiteCategory: KumiteCategory | null
  /** Orden pedagógico dentro del grado (opcional). Se usa para listar por grado. */
  order?: number
}

export interface TechniqueSection<T> {
  key: string
  label: string
  accent: string
  items: T[]
}

/**
 * Ordena por orden pedagógico del grado y, a falta de él, conserva el orden de
 * entrada (sort estable). Evita que el listado quede alfabético cuando las
 * técnicas tienen `order` (p. ej. el registro de repeticiones).
 */
function byGradeOrder<T extends CategorizedTechnique>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/**
 * Agrupa técnicas por categoría. Dentro de Kihon y Kumite agrupa por
 * sub-categoría; el resto por categoría superior. Compartido por el syllabus del
 * alumno y el registro de repeticiones de asistencia para que la clasificación
 * sea consistente en toda la app.
 */
export function buildTechniqueSections<T extends CategorizedTechnique>(techniques: T[]): TechniqueSection<T>[] {
  const sections: TechniqueSection<T>[] = []

  const kihon = techniques.filter(({ category }) => category === 'KIHON')
  for (const subCategory of KIHON_CATEGORIES) {
    const items = kihon.filter((technique) => technique.kihonCategory === subCategory)
    if (items.length > 0) {
      sections.push({ key: `KIHON:${subCategory}`, label: KIHON_CATEGORY_LABELS[subCategory], accent: KIHON_ACCENT, items: byGradeOrder(items) })
    }
  }
  const uncategorizedKihon = kihon.filter((technique) => !technique.kihonCategory)
  if (uncategorizedKihon.length > 0) {
    sections.push({ key: 'KIHON:__none__', label: 'Kihon (sin categoría)', accent: KIHON_ACCENT, items: byGradeOrder(uncategorizedKihon) })
  }

  const kumite = techniques.filter(({ category }) => category === 'KUMITE')
  for (const subCategory of KUMITE_CATEGORIES) {
    const items = kumite.filter((technique) => technique.kumiteCategory === subCategory)
    if (items.length > 0) {
      sections.push({ key: `KUMITE:${subCategory}`, label: KUMITE_CATEGORY_LABELS[subCategory], accent: KUMITE_ACCENT, items: byGradeOrder(items) })
    }
  }
  const uncategorizedKumite = kumite.filter((technique) => !technique.kumiteCategory)
  if (uncategorizedKumite.length > 0) {
    sections.push({ key: 'KUMITE:__none__', label: 'Kumite (sin categoría)', accent: KUMITE_ACCENT, items: byGradeOrder(uncategorizedKumite) })
  }

  const kata = techniques.filter(({ category }) => category === 'KATA')
  if (kata.length > 0) {
    sections.push({ key: 'KATA', label: 'Kata', accent: CATEGORY_ACCENTS.KATA, items: byGradeOrder(kata) })
  }
  const bunkai = techniques.filter(({ category }) => category === 'BUNKAI')
  if (bunkai.length > 0) {
    sections.push({ key: 'BUNKAI', label: 'Bunkai', accent: CATEGORY_ACCENTS.BUNKAI, items: byGradeOrder(bunkai) })
  }

  return sections
}
