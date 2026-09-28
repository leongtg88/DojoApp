import type { KumiteCategory } from '@/types/dashboard'

export const KUMITE_CATEGORY_LABELS: Record<KumiteCategory, string> = {
  GOHON_KUMITE: 'Gohon Kumite (5 pasos)',
  SANBON_KUMITE: 'Sanbon Kumite (3 pasos)',
  IPPON_KUMITE: 'Ippon Kumite (1 paso)',
  JIYU_IPPON_KUMITE: 'Jiyu Ippon Kumite',
  JIYU_KUMITE: 'Jiyu Kumite (libre)',
  SHIAI_KUMITE: 'Shiai Kumite (competición)',
}

export const KUMITE_CATEGORY_SHORT_LABELS: Record<KumiteCategory, string> = {
  GOHON_KUMITE: 'Gohon',
  SANBON_KUMITE: 'Sanbon',
  IPPON_KUMITE: 'Ippon',
  JIYU_IPPON_KUMITE: 'Jiyu Ippon',
  JIYU_KUMITE: 'Jiyu',
  SHIAI_KUMITE: 'Shiai',
}

export const KUMITE_CATEGORIES = Object.keys(KUMITE_CATEGORY_LABELS) as KumiteCategory[]
