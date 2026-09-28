import type { KihonCategory } from '@/types/dashboard'

export const KIHON_CATEGORY_LABELS: Record<KihonCategory, string> = {
  DACHI: 'Posiciones (Dachi)',
  TSUKI_WAZA: 'Técnicas de puño (Tsuki Waza)',
  UCHI_WAZA: 'Golpeo de mano (Uchi Waza)',
  GERI_WAZA: 'Técnicas de pierna (Geri Waza)',
  UKE_WAZA: 'Bloqueos (Uke Waza)',
  RENZOKU_WAZA: 'Combinadas (Renzoku Waza)',
  IDO_KIHON: 'Kihon en movimiento (Ido Kihon)',
}

export const KIHON_CATEGORY_SHORT_LABELS: Record<KihonCategory, string> = {
  DACHI: 'Dachi',
  TSUKI_WAZA: 'Tsuki Waza',
  UCHI_WAZA: 'Uchi Waza',
  GERI_WAZA: 'Geri Waza',
  UKE_WAZA: 'Uke Waza',
  RENZOKU_WAZA: 'Renzoku Waza',
  IDO_KIHON: 'Ido Kihon',
}

export const KIHON_CATEGORIES = Object.keys(KIHON_CATEGORY_LABELS) as KihonCategory[]
