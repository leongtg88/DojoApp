import type { KumiteCategory } from '@/lib/generated/prisma'

export interface CurriculumKumite {
  id: string
  name: string
  kumiteCategory: KumiteCategory
  kumiteType?: string
  movementsCount?: number
  role?: string
  distance?: string
  description?: string
  order: number
}

/**
 * Catálogo oficial de Kumite (Shito-Ryu Inoue Ha) organizado en categorías.
 * Referencia del script `prisma/sync-kumite.ts`, que lo sincroniza como técnicas
 * globales (schoolId = null). No vincula técnicas a grados.
 */
export const KUMITE_CATEGORIES_ORDER: KumiteCategory[] = [
  'GOHON_KUMITE',
  'SANBON_KUMITE',
  'IPPON_KUMITE',
  'JIYU_IPPON_KUMITE',
  'JIYU_KUMITE',
  'SHIAI_KUMITE',
]

export const KUMITE_TECHNIQUES: CurriculumKumite[] = [
  // ==================== Gohon Kumite (5 pasos) ====================
  { id: 'kumite-gohon-jodan', name: 'Gohon Kumite — Jodan', kumiteCategory: 'GOHON_KUMITE', movementsCount: 5, description: 'Ataque de Oi Zuki Jodan en cinco pasos; defensa Age Uke y contraataque Gyaku Zuki.', order: 1 },
  { id: 'kumite-gohon-chudan', name: 'Gohon Kumite — Chudan', kumiteCategory: 'GOHON_KUMITE', movementsCount: 5, description: 'Ataque de Oi Zuki Chudan en cinco pasos; defensa Soto Uke y contraataque Gyaku Zuki.', order: 2 },

  // ==================== Sanbon Kumite (3 pasos) ====================
  { id: 'kumite-sanbon-1', name: 'Sanbon Kumite 1', kumiteCategory: 'SANBON_KUMITE', movementsCount: 3, description: 'Tres ataques preestablecidos: Jodan, Chudan y Mae Geri.', order: 3 },
  { id: 'kumite-sanbon-2', name: 'Sanbon Kumite 2', kumiteCategory: 'SANBON_KUMITE', movementsCount: 3, description: 'Variante de tres ataques con bloqueos y contraataque.', order: 4 },

  // ==================== Ippon Kumite (1 paso) ====================
  { id: 'kumite-ippon-jodan', name: 'Ippon Kumite — Jodan', kumiteCategory: 'IPPON_KUMITE', movementsCount: 1, description: 'Ataque único Jodan; defensa Age Uke y contraataque.', order: 5 },
  { id: 'kumite-ippon-chudan', name: 'Ippon Kumite — Chudan', kumiteCategory: 'IPPON_KUMITE', movementsCount: 1, description: 'Ataque único Chudan; defensa Soto Uke y contraataque Gyaku Zuki.', order: 6 },
  { id: 'kumite-ippon-mae-geri', name: 'Ippon Kumite — Mae Geri', kumiteCategory: 'IPPON_KUMITE', movementsCount: 1, description: 'Ataque de patada frontal; defensa Gedan Barai y contraataque.', order: 7 },
  { id: 'kumite-ippon-yoko-geri', name: 'Ippon Kumite — Yoko Geri', kumiteCategory: 'IPPON_KUMITE', movementsCount: 1, description: 'Ataque de patada lateral; bloqueo y contraataque.', order: 8 },
  { id: 'kumite-ippon-mawashi-geri', name: 'Ippon Kumite — Mawashi Geri', kumiteCategory: 'IPPON_KUMITE', movementsCount: 1, description: 'Ataque de patada circular; bloqueo y contraataque.', order: 9 },
  { id: 'kumite-ippon-ushiro-geri', name: 'Ippon Kumite — Ushiro Geri', kumiteCategory: 'IPPON_KUMITE', movementsCount: 1, description: 'Ataque de patada hacia atrás; bloqueo y contraataque.', order: 10 },

  // ==================== Jiyu Ippon Kumite ====================
  { id: 'kumite-jiyu-ippon-jodan', name: 'Jiyu Ippon Kumite — Jodan', kumiteCategory: 'JIYU_IPPON_KUMITE', movementsCount: 1, description: 'Ataque libre Jodan con aviso; defensa y contraataque.', order: 11 },
  { id: 'kumite-jiyu-ippon-chudan', name: 'Jiyu Ippon Kumite — Chudan', kumiteCategory: 'JIYU_IPPON_KUMITE', movementsCount: 1, description: 'Ataque libre Chudan con aviso; defensa y contraataque.', order: 12 },
  { id: 'kumite-jiyu-ippon-mae-geri', name: 'Jiyu Ippon Kumite — Mae Geri', kumiteCategory: 'JIYU_IPPON_KUMITE', movementsCount: 1, description: 'Ataque libre de Mae Geri con aviso; defensa y contraataque.', order: 13 },

  // ==================== Jiyu Kumite ====================
  { id: 'kumite-jiyu-basico', name: 'Jiyu Kumite — Básico', kumiteCategory: 'JIYU_KUMITE', description: 'Combate libre controlado, sin contacto pleno.', order: 14 },

  // ==================== Shiai Kumite ====================
  { id: 'kumite-shiai-wkf', name: 'Shiai Kumite — Reglamento WKF', kumiteCategory: 'SHIAI_KUMITE', description: 'Competición reglada bajo normativa WKF.', order: 15 },
]
