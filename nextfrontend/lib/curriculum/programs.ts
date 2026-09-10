// Catálogo oficial del dojo: katas y grados por programa (ADULT / YOUTH).
// Fuente única de verdad para el seed y para el autocompletado del admin.
// NOTA: una kata puede exigirse en varios grados (relación M:N).

export type Program = 'ADULT' | 'YOUTH'

export interface CurriculumKata {
  id: string
  name: string
  kanji: string
  order: number // orden pedagógico global del catálogo
}

export interface CurriculumRank {
  id: string
  order: number // 1 = blanco, 2 = amarillo...
  name: string // "Blanco", "Amarillo"...
  kyuDan: string // "10TH KYU", "SHODAN"...
  japaneseName: string // "Ju-kyu", "Shodan"...
  kanji: string // "白帯", "十級"...
  beltColor: string // colorHex
  minMonths: number | null
  maxMonths: number | null
  isMaximumRank: boolean
  katas: string[] // nombres de katas requeridas para el grado
}

export const BELT_COLORS = [
  { label: 'Blanco', value: '#FFFFFF' },
  { label: 'Blanco/Amarillo', value: '#FFFDE7' },
  { label: 'Amarillo', value: '#FFEB3B' },
  { label: 'Amarillo/Naranja', value: '#FFE082' },
  { label: 'Naranja', value: '#FF9800' },
  { label: 'Naranja/Azul', value: '#FFCC80' },
  { label: 'Azul', value: '#2196F3' },
  { label: 'Azul/Morado', value: '#90CAF9' },
  { label: 'Morado', value: '#9C27B0' },
  { label: 'Morado/Verde', value: '#CE93D8' },
  { label: 'Verde', value: '#4CAF50' },
  { label: 'Verde/Café', value: '#A5D6A7' },
  { label: 'Café', value: '#795548' },
  { label: 'Café/Negro', value: '#8D6E63' },
  { label: 'Café claro', value: '#A1887F' },
  { label: 'Café oscuro', value: '#5D4037' },
  { label: 'Negro', value: '#212121' },
] as const

export const BELT_COLOR_BY_NAME = new Map<string, string>(BELT_COLORS.map(({ label, value }) => [label, value]))

export const KATAS: CurriculumKata[] = [
  { id: 'kata-kihon-ichi', name: 'Kihon Kata Ichi', kanji: '基本形・一', order: 1 },
  { id: 'kata-kihon-ni', name: 'Kihon Kata Ni', kanji: '基本形・二', order: 2 },
  { id: 'kata-kihon-san', name: 'Kihon Kata San', kanji: '基本形・三', order: 3 },
  { id: 'kata-kihon-shi', name: 'Kihon Kata Shi', kanji: '基本形・四', order: 4 },
  { id: 'kata-kihon-go', name: 'Kihon Kata Go', kanji: '基本形・五', order: 5 },
  { id: 'kata-tenno', name: 'Tenno Kata', kanji: '天の形', order: 6 },
  { id: 'kata-chino', name: 'Chino Kata', kanji: '地の形', order: 7 },
  { id: 'kata-pinan-nidan', name: 'Pinan Nidan', kanji: 'ピナン二段', order: 8 },
  { id: 'kata-pinan-shodan', name: 'Pinan Shodan', kanji: 'ピナン初段', order: 9 },
  { id: 'kata-pinan-sandan', name: 'Pinan Sandan', kanji: 'ピナン三段', order: 10 },
  { id: 'kata-pinan-yondan', name: 'Pinan Yondan', kanji: 'ピナン四段', order: 11 },
  { id: 'kata-pinan-godan', name: 'Pinan Godan', kanji: 'ピナン五段', order: 12 },
  { id: 'kata-bassai-dai', name: 'Bassai Dai', kanji: '抜塞大', order: 13 },
  { id: 'kata-jutte', name: 'Jūtte', kanji: '十手', order: 14 },
  { id: 'kata-seienchin', name: 'Seienchin', kanji: '征遠鎮', order: 15 },
  { id: 'kata-niseishi', name: 'Niseishi', kanji: '二十四歩', order: 16 },
  { id: 'kata-jion', name: 'Jion', kanji: '慈恩', order: 17 },
  { id: 'kata-jiin', name: 'Jiin', kanji: '慈允', order: 18 },
  { id: 'kata-kosokun-dai', name: 'Kosokun Dai', kanji: '公相君大', order: 19 },
  { id: 'kata-seipai', name: 'Seipai', kanji: '十八手', order: 20 },
  { id: 'kata-kururunfa', name: 'Kururunfa', kanji: '久留頓破', order: 21 },
]

export const ADULT_RANKS: CurriculumRank[] = [
  { id: 'belt-adult-01-blanco', order: 1, name: 'Blanco', kyuDan: 'Sin grado', japaneseName: '—', kanji: '白帯', beltColor: '#FFFFFF', minMonths: 0, maxMonths: 3, isMaximumRank: false, katas: [] },
  { id: 'belt-adult-02-amarillo', order: 2, name: 'Amarillo', kyuDan: '10TH KYU', japaneseName: 'Ju-kyu', kanji: '十級', beltColor: '#FFEB3B', minMonths: 3, maxMonths: 4, isMaximumRank: false, katas: ['Kihon Kata Ichi', 'Kihon Kata Ni', 'Kihon Kata San', 'Kihon Kata Shi', 'Kihon Kata Go'] },
  { id: 'belt-adult-03-naranja', order: 3, name: 'Naranja', kyuDan: '9TH KYU', japaneseName: 'Kyu-kyu', kanji: '九級', beltColor: '#FF9800', minMonths: 6, maxMonths: 7, isMaximumRank: false, katas: ['Tenno Kata', 'Chino Kata', 'Pinan Nidan'] },
  { id: 'belt-adult-04-azul', order: 4, name: 'Azul', kyuDan: '8TH KYU', japaneseName: 'Hachi-kyu', kanji: '八級', beltColor: '#2196F3', minMonths: 9, maxMonths: 10, isMaximumRank: false, katas: ['Chino Kata', 'Pinan Nidan', 'Pinan Shodan'] },
  { id: 'belt-adult-05-morado', order: 5, name: 'Morado', kyuDan: '7TH KYU', japaneseName: 'Nana-kyu', kanji: '七級', beltColor: '#9C27B0', minMonths: 12, maxMonths: 13, isMaximumRank: false, katas: ['Pinan Shodan', 'Pinan Sandan', 'Pinan Yondan'] },
  { id: 'belt-adult-06-verde', order: 6, name: 'Verde', kyuDan: '6TH KYU', japaneseName: 'Rok-kyu', kanji: '六級', beltColor: '#4CAF50', minMonths: 15, maxMonths: 16, isMaximumRank: false, katas: ['Pinan Sandan', 'Pinan Yondan', 'Pinan Godan'] },
  { id: 'belt-adult-07-verde-claro', order: 7, name: 'Verde claro', kyuDan: '5TH KYU', japaneseName: 'Go-kyu', kanji: '五級', beltColor: '#8BC34A', minMonths: 16, maxMonths: 19, isMaximumRank: false, katas: ['Pinan Yondan', 'Pinan Godan', 'Bassai Dai'] },
  { id: 'belt-adult-08-verde-oscuro', order: 8, name: 'Verde oscuro', kyuDan: '4TH KYU', japaneseName: 'Yon-kyu', kanji: '四級', beltColor: '#388E3C', minMonths: 21, maxMonths: 23, isMaximumRank: false, katas: ['Pinan Godan', 'Bassai Dai', 'Jūtte'] },
  { id: 'belt-adult-09-cafe', order: 9, name: 'Café', kyuDan: '3RD KYU', japaneseName: 'San-kyu', kanji: '三級', beltColor: '#795548', minMonths: 24, maxMonths: 25, isMaximumRank: false, katas: ['Bassai Dai', 'Jūtte', 'Seienchin'] },
  { id: 'belt-adult-10-cafe-claro', order: 10, name: 'Café claro', kyuDan: '2ND KYU', japaneseName: 'Ni-kyu', kanji: '二級', beltColor: '#A1887F', minMonths: 27, maxMonths: 29, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Jion'] },
  { id: 'belt-adult-11-cafe-oscuro', order: 11, name: 'Café oscuro', kyuDan: '1ST KYU', japaneseName: 'Ik-kyu', kanji: '一級', beltColor: '#5D4037', minMonths: 30, maxMonths: 31, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Jiin'] },
  { id: 'belt-adult-12-negro', order: 12, name: 'Negro', kyuDan: 'SHODAN', japaneseName: '1st Dan', kanji: '初段', beltColor: '#212121', minMonths: 36, maxMonths: 43, isMaximumRank: true, katas: ['Kosokun Dai', 'Bassai Dai', 'Seienchin'] },
]

export const YOUTH_RANKS: CurriculumRank[] = [
  { id: 'belt-youth-01-blanco', order: 1, name: 'Blanco', kyuDan: 'Sin grado', japaneseName: '—', kanji: '白帯', beltColor: '#FFFFFF', minMonths: 0, maxMonths: 3, isMaximumRank: false, katas: [] },
  { id: 'belt-youth-02-blanco-amarillo', order: 2, name: 'Blanco/Amarillo', kyuDan: '10TH KYU HO', japaneseName: 'Ju-kyu-ho', kanji: '十級補', beltColor: '#FFFDE7', minMonths: 3, maxMonths: 4, isMaximumRank: false, katas: ['Kihon Kata Ichi', 'Kihon Kata Ni', 'Kihon Kata San', 'Kihon Kata Shi', 'Kihon Kata Go'] },
  { id: 'belt-youth-03-amarillo', order: 3, name: 'Amarillo', kyuDan: '10TH KYU', japaneseName: 'Ju-kyu', kanji: '十級', beltColor: '#FFEB3B', minMonths: 6, maxMonths: 7, isMaximumRank: false, katas: ['Tenno Kata', 'Chino Kata'] },
  { id: 'belt-youth-04-amarillo-naranja', order: 4, name: 'Amarillo/Naranja', kyuDan: '9TH KYU HO', japaneseName: 'Kyu-kyu-ho', kanji: '九級補', beltColor: '#FFE082', minMonths: 9, maxMonths: 10, isMaximumRank: false, katas: ['Tenno Kata', 'Chino Kata', 'Pinan Nidan'] },
  { id: 'belt-youth-05-naranja', order: 5, name: 'Naranja', kyuDan: '9TH KYU', japaneseName: 'Kyu-kyu', kanji: '九級', beltColor: '#FF9800', minMonths: 12, maxMonths: 13, isMaximumRank: false, katas: ['Chino Kata', 'Pinan Nidan', 'Pinan Shodan'] },
  { id: 'belt-youth-06-naranja-azul', order: 6, name: 'Naranja/Azul', kyuDan: '8TH KYU HO', japaneseName: 'Hachi-kyu-ho', kanji: '八級補', beltColor: '#FFCC80', minMonths: 15, maxMonths: 16, isMaximumRank: false, katas: ['Pinan Nidan', 'Pinan Shodan', 'Pinan Sandan'] },
  { id: 'belt-youth-07-azul', order: 7, name: 'Azul', kyuDan: '8TH KYU', japaneseName: 'Hachi-kyu', kanji: '八級', beltColor: '#2196F3', minMonths: 18, maxMonths: 19, isMaximumRank: false, katas: ['Pinan Shodan', 'Pinan Sandan', 'Pinan Yondan'] },
  { id: 'belt-youth-08-azul-morado', order: 8, name: 'Azul/Morado', kyuDan: '7TH KYU HO', japaneseName: 'Nana-kyu-ho', kanji: '七級補', beltColor: '#90CAF9', minMonths: 21, maxMonths: 22, isMaximumRank: false, katas: ['Pinan Sandan', 'Pinan Yondan', 'Pinan Godan'] },
  { id: 'belt-youth-09-morado', order: 9, name: 'Morado', kyuDan: '7TH KYU', japaneseName: 'Nana-kyu', kanji: '七級', beltColor: '#9C27B0', minMonths: 24, maxMonths: 25, isMaximumRank: false, katas: ['Pinan Yondan', 'Pinan Godan', 'Bassai Dai'] },
  { id: 'belt-youth-10-morado-verde', order: 10, name: 'Morado/Verde', kyuDan: '6TH KYU HO', japaneseName: 'Rok-kyu-ho', kanji: '六級補', beltColor: '#CE93D8', minMonths: 27, maxMonths: 28, isMaximumRank: false, katas: ['Pinan Godan', 'Bassai Dai', 'Jūtte', 'Niseishi'] },
  { id: 'belt-youth-11-verde', order: 11, name: 'Verde', kyuDan: '6TH KYU', japaneseName: 'Rok-kyu', kanji: '六級', beltColor: '#4CAF50', minMonths: 30, maxMonths: 31, isMaximumRank: false, katas: ['Bassai Dai', 'Jūtte', 'Seienchin', 'Niseishi'] },
  { id: 'belt-youth-12-verde-cafe', order: 12, name: 'Verde/Café', kyuDan: '5TH KYU HO', japaneseName: 'Go-kyu-ho', kanji: '五級補', beltColor: '#A5D6A7', minMonths: 33, maxMonths: 34, isMaximumRank: false, katas: ['Bassai Dai', 'Jūtte', 'Jion', 'Seienchin'] },
  { id: 'belt-youth-13-cafe', order: 13, name: 'Café', kyuDan: '5TH KYU', japaneseName: 'Go-kyu', kanji: '五級', beltColor: '#795548', minMonths: 36, maxMonths: 37, isMaximumRank: false, katas: ['Bassai Dai', 'Jion', 'Jiin', 'Seienchin'] },
  { id: 'belt-youth-14-cafe-negro', order: 14, name: 'Café/Negro', kyuDan: '4TH KYU HO', japaneseName: 'Yon-kyu-ho', kanji: '四級補', beltColor: '#8D6E63', minMonths: 39, maxMonths: 40, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Jiin', 'Kosokun Dai'] },
  { id: 'belt-youth-15-cafe-oscuro', order: 15, name: 'Café oscuro', kyuDan: '3RD KYU', japaneseName: 'San-kyu', kanji: '三級', beltColor: '#5D4037', minMonths: 42, maxMonths: 43, isMaximumRank: false, katas: ['Kosokun Dai', 'Bassai Dai', 'Seienchin', 'Seipai'] },
  { id: 'belt-youth-16-cafe-oscuro-2', order: 16, name: 'Café oscuro 2', kyuDan: '2ND KYU', japaneseName: 'Ni-kyu', kanji: '二級', beltColor: '#4E342E', minMonths: 43, maxMonths: 44, isMaximumRank: false, katas: ['Kosokun Dai', 'Bassai Dai', 'Seienchin', 'Seipai', 'Kururunfa'] },
  { id: 'belt-youth-17-cafe-oscuro-3', order: 17, name: 'Café oscuro 3', kyuDan: '1ST KYU', japaneseName: 'Ik-kyu', kanji: '一級', beltColor: '#3E2723', minMonths: 44, maxMonths: null, isMaximumRank: false, katas: [] },
  { id: 'belt-youth-18-negro', order: 18, name: 'Negro', kyuDan: 'SHODAN HO', japaneseName: '—', kanji: '初段補', beltColor: '#212121', minMonths: null, maxMonths: null, isMaximumRank: true, katas: [] },
]

export const RANKS_BY_PROGRAM: Record<Program, CurriculumRank[]> = {
  ADULT: ADULT_RANKS,
  YOUTH: YOUTH_RANKS,
}