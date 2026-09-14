import type { AdminTechniqueSummary, TechniqueCategory } from '@/types/dashboard'

export const TECHNIQUE_CATEGORY_LABELS: Record<TechniqueCategory, string> = {
  KIHON: 'Kihon',
  KATA: 'Kata',
  KUMITE: 'Kumite',
  BUNKAI: 'Bunkai',
}

export const TECHNIQUE_CATEGORIES = Object.keys(TECHNIQUE_CATEGORY_LABELS) as TechniqueCategory[]

export function techniqueMetaLine(technique: AdminTechniqueSummary): string {
  const parts: string[] = [TECHNIQUE_CATEGORY_LABELS[technique.category]]

  switch (technique.category) {
    case 'KIHON':
      if (technique.difficulty) parts.push(technique.difficulty)
      if (technique.repetitionsCount != null) parts.push(`${technique.repetitionsCount} repeticiones`)
      if (technique.stance) parts.push(technique.stance)
      if (technique.level) parts.push(technique.level)
      break
    case 'KUMITE':
      if (technique.kumiteType) parts.push(technique.kumiteType)
      if (technique.difficulty) parts.push(technique.difficulty)
      if (technique.movementsCount != null) parts.push(`${technique.movementsCount} pasos/técnicas`)
      if (technique.distance) parts.push(technique.distance)
      if (technique.role) parts.push(technique.role)
      break
    case 'BUNKAI':
      if (technique.applicationType) parts.push(technique.applicationType)
      if (technique.difficulty) parts.push(technique.difficulty)
      if (technique.movementsCount != null) parts.push(`${technique.movementsCount} secuencias`)
      if (technique.originKataName) parts.push(`de ${technique.originKataName}`)
      break
    default:
      if (technique.difficulty) parts.push(technique.difficulty)
      if (technique.movementsCount != null) parts.push(`${technique.movementsCount} movimientos`)
      if (technique.embusen) parts.push(`Embusen: ${technique.embusen}`)
  }

  return parts.join(' · ')
}
