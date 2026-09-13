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
  beltSecondaryColor?: string // franja/color secundario
  description?: string // notas del grado (edad mínima, requisitos...)
  minMonths: number | null
  maxMonths: number | null
  isMaximumRank: boolean
  katas: string[] // nombres de katas requeridas para el grado
}

export const BELT_COLORS = [
  { label: 'Blanco', value: '#FFFFFF' },
  { label: 'Amarillo-Blanca', value: '#FFFDE7' },
  { label: 'Amarillo', value: '#FFEB3B' },
  { label: 'Naranja-Blanca', value: '#FFE082' },
  { label: 'Naranja', value: '#FF9800' },
  { label: 'Azul-Blanca', value: '#FFCC80' },
  { label: 'Azul', value: '#2196F3' },
  { label: 'Morado-Blanca', value: '#90CAF9' },
  { label: 'Morado', value: '#9C27B0' },
  { label: 'Verde-Blanca', value: '#CE93D8' },
  { label: 'Verde', value: '#4CAF50' },
  { label: 'Verde claro', value: '#8BC34A' },
  { label: 'Verde oscuro', value: '#388E3C' },
  { label: 'Café-Blanca', value: '#A5D6A7' },
  { label: 'Café', value: '#795548' },
  { label: 'Café claro', value: '#A1887F' },
  { label: 'Café oscuro / Marrón', value: '#5D4037' },
  { label: 'Verde-Negro', value: '#8D6E63' },
  { label: 'Marrón-Blanca', value: '#4E342E' },
  { label: 'Marrón-Negro', value: '#3E2723' },
  { label: 'Negro', value: '#212121' },
] as const

export const BELT_COLOR_BY_NAME = new Map<string, string>(BELT_COLORS.map(({ label, value }) => [label, value]))

export const KATAS: CurriculumKata[] = [
  { id: 'kata-kihon-ichi', name: 'Kihon Kata Ichi', kanji: '基本形・一', order: 1 },
  { id: 'kata-kihon-ni', name: 'Kihon Kata Ni', kanji: '基本形・二', order: 2 },
  { id: 'kata-kihon-san', name: 'Kihon Kata San', kanji: '基本形・三', order: 3 },
  { id: 'kata-kihon-shi', name: 'Kihon Kata Yon', kanji: '基本形・四', order: 4 },
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
  // ===== Cinturón negro en adelante (Shodan Ho → Kyudan) =====
  { id: 'kata-sanchin', name: 'Sanchin', kanji: '三戦', order: 22 },
  { id: 'kata-bassai-sho', name: 'Bassai Sho', kanji: '拔塞小', order: 23 },
  { id: 'kata-kosokun-sho', name: 'Kosokun Sho', kanji: '公相君小', order: 24 },
  { id: 'kata-matsukaze', name: 'Matsukaze', kanji: '松風', order: 25 },
  { id: 'kata-matsumura-rohai', name: 'Matsumura Rohai', kanji: '松村ローハイ', order: 26 },
  { id: 'kata-heiku', name: 'Heiku', kanji: '黑虎', order: 27 },
  { id: 'kata-sanseiru', name: 'Sanseiru', kanji: '三十六', order: 28 },
  { id: 'kata-chinto', name: 'Chinto', kanji: '鎮東', order: 29 },
  { id: 'kata-nipaipo', name: 'Nipaipo', kanji: '二十八歩', order: 30 },
  { id: 'kata-rohai-nidan', name: 'Rohai Nidan', kanji: '鷺牌二段', order: 31 },
  { id: 'kata-tensho', name: 'Tensho', kanji: '転掌', order: 32 },
  { id: 'kata-paiku', name: 'Paiku', kanji: '白虎', order: 33 },
  { id: 'kata-annanko', name: 'Annanko', kanji: '安南光', order: 34 },
  { id: 'kata-gojushiho', name: 'Gojushiho', kanji: '五十四歩', order: 35 },
  { id: 'kata-tomari-no-bassai', name: 'Tomari no Bassai', kanji: '泊の拔塞', order: 36 },
  { id: 'kata-seisan', name: 'Seisan', kanji: '十三', order: 37 },
  { id: 'kata-shiho-kosokun', name: 'Shiho Kosokun', kanji: '四方公相君', order: 38 },
  { id: 'kata-saifa', name: 'Saifa', kanji: '碎破', order: 39 },
  { id: 'kata-shisochin', name: 'Shisochin', kanji: '四向戦', order: 40 },
  { id: 'kata-juroku', name: 'Juroku', kanji: '十六', order: 41 },
  { id: 'kata-anan', name: 'Anan', kanji: '安南', order: 42 },
  { id: 'kata-suparinpei', name: 'Suparinpei', kanji: '壱百零八手', order: 43 },
  { id: 'kata-unshu', name: 'Unshu', kanji: '雲手', order: 44 },
  { id: 'kata-arakaki-sochin', name: 'Arakaki Sochin', kanji: '新垣壮鎮', order: 45 },
  { id: 'kata-shinpa', name: 'Shinpa', kanji: '心波', order: 46 },
  { id: 'kata-chibana-no-kusanku', name: 'Chibana no Kusanku', kanji: '知花の公相君', order: 47 },
  { id: 'kata-anan-dai', name: 'Anan Dai', kanji: 'アーナン大', order: 48 },
  { id: 'kata-pachu', name: 'Pachu', kanji: '巴球', order: 49 },
  { id: 'kata-ohan', name: 'Ohan', kanji: 'オーハン', order: 50 },
  { id: 'kata-chatanyara-kusanku', name: 'Chatanyara Kusanku', kanji: 'チャタンヤラクーサンクー', order: 51 },
  { id: 'kata-wanshu', name: 'Wanshu', kanji: '汪輯', order: 52 },
  { id: 'kata-naihanchin-shodan', name: 'Naihanchin Shodan', kanji: 'ナイハンチ初段', order: 53 },
  { id: 'kata-pappuren', name: 'Pappuren', kanji: 'パープレン', order: 54 },
  { id: 'kata-ohan-dai', name: 'Ohan Dai', kanji: 'オーハン大', order: 55 },
  { id: 'kata-myojo', name: 'Myojo', kanji: '明浄', order: 56 },
  { id: 'kata-chinte', name: 'Chinte', kanji: '珍手', order: 57 },
  { id: 'kata-ishimine-no-bassai', name: 'Ishimine no Bassai', kanji: '石嶺の拔塞', order: 58 },
  { id: 'kata-naihanchin-nidan', name: 'Naihanchin Nidan', kanji: 'ナイハンチ二段', order: 59 },
  { id: 'kata-hakkaku', name: 'Hakkaku', kanji: '白鶴', order: 60 },
  { id: 'kata-nepai', name: 'Nepai', kanji: '二八', order: 61 },
  { id: 'kata-seiryu', name: 'Seiryu', kanji: '青柳', order: 62 },
  { id: 'kata-oyadomari-no-bassai', name: 'Oyadomari no Bassai', kanji: '親泊の拔塞', order: 63 },
  { id: 'kata-naihanchin-sandan', name: 'Naihanchin Sandan', kanji: 'ナイハンチ三段', order: 64 },
  { id: 'kata-happo-sho', name: 'Happo Sho', kanji: '八歩掌', order: 65 },
  { id: 'kata-hakutsuru', name: 'Hakutsuru', kanji: '白鶴', order: 66 },
  { id: 'kata-haffa', name: 'Haffa', kanji: 'ハッファ', order: 67 },
]

export const ADULT_RANKS: CurriculumRank[] = [
  { id: 'belt-adult-01-blanco', order: 1, name: 'Blanco', kyuDan: '11TH KYU', japaneseName: '—', kanji: '白帯', beltColor: '#FFFFFF', minMonths: 0, maxMonths: 3, isMaximumRank: false, katas: [] },
  { id: 'belt-adult-02-amarillo', order: 2, name: 'Amarillo', kyuDan: '10TH KYU', japaneseName: 'Ju-kyu', kanji: '十級', beltColor: '#FFEB3B', minMonths: 3, maxMonths: 4, isMaximumRank: false, katas: ['Kihon Kata Ichi', 'Kihon Kata Ni', 'Kihon Kata San', 'Kihon Kata Yon', 'Kihon Kata Go'] },
  { id: 'belt-adult-03-naranja', order: 3, name: 'Naranja', kyuDan: '9TH KYU', japaneseName: 'Kyu-kyu', kanji: '九級', beltColor: '#FF9800', minMonths: 6, maxMonths: 7, isMaximumRank: false, katas: ['Tenno Kata', 'Chino Kata', 'Pinan Nidan'] },
  { id: 'belt-adult-04-azul', order: 4, name: 'Azul', kyuDan: '8TH KYU', japaneseName: 'Hachi-kyu', kanji: '八級', beltColor: '#2196F3', minMonths: 9, maxMonths: 10, isMaximumRank: false, katas: ['Chino Kata', 'Pinan Nidan', 'Pinan Shodan'] },
  { id: 'belt-adult-05-morado', order: 5, name: 'Morado', kyuDan: '7TH KYU', japaneseName: 'Nana-kyu', kanji: '七級', beltColor: '#9C27B0', minMonths: 12, maxMonths: 13, isMaximumRank: false, katas: ['Pinan Shodan', 'Pinan Sandan', 'Pinan Yondan'] },
  { id: 'belt-adult-06-verde', order: 6, name: 'Verde', kyuDan: '6TH KYU', japaneseName: 'Rok-kyu', kanji: '六級', beltColor: '#4CAF50', minMonths: 15, maxMonths: 16, isMaximumRank: false, katas: ['Pinan Sandan', 'Pinan Yondan', 'Pinan Godan'] },
  { id: 'belt-adult-07-verde-claro', order: 7, name: 'Verde claro', kyuDan: '5TH KYU', japaneseName: 'Go-kyu', kanji: '五級', beltColor: '#8BC34A', minMonths: 16, maxMonths: 19, isMaximumRank: false, katas: ['Pinan Yondan', 'Pinan Godan', 'Bassai Dai'] },
  { id: 'belt-adult-08-verde-oscuro', order: 8, name: 'Verde oscuro', kyuDan: '4TH KYU', japaneseName: 'Yon-kyu', kanji: '四級', beltColor: '#388E3C', minMonths: 21, maxMonths: 23, isMaximumRank: false, katas: ['Pinan Godan', 'Bassai Dai', 'Jūtte'] },
  { id: 'belt-adult-09-cafe', order: 9, name: 'Café', kyuDan: '3RD KYU', japaneseName: 'San-kyu', kanji: '三級', beltColor: '#795548', minMonths: 24, maxMonths: 25, isMaximumRank: false, katas: ['Bassai Dai', 'Jūtte', 'Seienchin'] },
  { id: 'belt-adult-10-cafe-claro', order: 10, name: 'Café claro', kyuDan: '2ND KYU', japaneseName: 'Ni-kyu', kanji: '二級', beltColor: '#A1887F', minMonths: 27, maxMonths: 29, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Jion'] },
  { id: 'belt-adult-11-cafe-oscuro', order: 11, name: 'Café oscuro', kyuDan: '1ST KYU', japaneseName: 'Ik-kyu', kanji: '一級', beltColor: '#5D4037', minMonths: 30, maxMonths: 31, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Jiin'] },
  { id: 'belt-adult-12-negro', order: 12, name: 'Shodan', kyuDan: 'SHODAN (1ST DAN)', japaneseName: '1st Dan', kanji: '初段', beltColor: '#212121', description: '1er Dan. Edad mínima 18 años. 12 meses mínimos o a discreción del Sensei.', minMonths: 12, maxMonths: null, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Kosokun Dai', 'Niseishi', 'Kururunfa', 'Seipai', 'Sanchin'] },
  { id: 'belt-adult-13-nidan', order: 13, name: 'Nidan', kyuDan: 'NIDAN (2ND DAN)', japaneseName: '2nd Dan', kanji: '弐段', beltColor: '#212121', description: '2do Dan. Edad mínima 20 años. 24 meses mínimos o a discreción del Sensei.', minMonths: 24, maxMonths: null, isMaximumRank: false, katas: ['Bassai Sho', 'Kosokun Sho', 'Matsukaze', 'Matsumura Rohai', 'Heiku', 'Sanseiru'] },
  { id: 'belt-adult-14-sandan', order: 14, name: 'Sandan', kyuDan: 'SANDAN (3RD DAN)', japaneseName: '3rd Dan', kanji: '参段', beltColor: '#212121', description: '3er Dan. Edad mínima 23 años. 36 meses mínimos o a discreción del Sensei.', minMonths: 36, maxMonths: null, isMaximumRank: false, katas: ['Chinto', 'Nipaipo', 'Rohai Nidan', 'Tensho', 'Paiku', 'Annanko'] },
  { id: 'belt-adult-15-yondan', order: 15, name: 'Yondan', kyuDan: 'YONDAN (4TH DAN)', japaneseName: '4th Dan', kanji: '四段', beltColor: '#212121', description: '4to Dan. Edad mínima 27 años. 48 meses mínimos o a discreción del Sensei.', minMonths: 48, maxMonths: null, isMaximumRank: false, katas: ['Gojushiho', 'Tomari no Bassai', 'Seisan', 'Shiho Kosokun', 'Saifa', 'Shisochin'] },
  { id: 'belt-adult-16-godan', order: 16, name: 'Godan', kyuDan: 'GODAN (5TH DAN)', japaneseName: '5th Dan', kanji: '五段', beltColor: '#212121', description: '5to Dan. Edad mínima 32 años. 60 meses mínimos o a discreción del Sensei.', minMonths: 60, maxMonths: null, isMaximumRank: false, katas: ['Juroku', 'Anan', 'Suparinpei', 'Unshu', 'Arakaki Sochin', 'Shinpa'] },
  { id: 'belt-adult-17-rokkudan', order: 17, name: 'Rokkudan', kyuDan: 'ROKKUDAN (6TH DAN)', japaneseName: '6th Dan', kanji: '六段', beltColor: '#212121', description: '6to Dan. Edad mínima 48 años. 72 meses mínimos o a discreción del Sensei.', minMonths: 72, maxMonths: null, isMaximumRank: false, katas: ['Chibana no Kusanku', 'Anan Dai', 'Pachu', 'Ohan', 'Chatanyara Kusanku', 'Wanshu', 'Naihanchin Shodan'] },
  { id: 'belt-adult-18-nanadan', order: 18, name: 'Nanadan', kyuDan: 'NANADAN (7TH DAN)', japaneseName: '7th Dan', kanji: '七段', beltColor: '#212121', description: '7mo Dan. Edad mínima 55 años. 84 meses mínimos o a discreción del Sensei.', minMonths: 84, maxMonths: null, isMaximumRank: false, katas: ['Pappuren', 'Ohan Dai', 'Myojo', 'Chinte', 'Ishimine no Bassai', 'Naihanchin Nidan'] },
  { id: 'belt-adult-19-hachidan', order: 19, name: 'Hachidan', kyuDan: 'HACHIDAN (8TH DAN)', japaneseName: '8th Dan', kanji: '八段', beltColor: '#212121', description: '8vo Dan. Edad mínima 63 años. 96 meses mínimos o a discreción del Sensei.', minMonths: 96, maxMonths: null, isMaximumRank: false, katas: ['Hakkaku', 'Nepai', 'Seiryu', 'Oyadomari no Bassai', 'Naihanchin Sandan'] },
  { id: 'belt-adult-20-kyudan', order: 20, name: 'Kyudan', kyuDan: 'KYUDAN (9TH DAN)', japaneseName: '9th Dan', kanji: '九段', beltColor: '#212121', description: '9no Dan. Edad mínima 72 años. 108 meses mínimos o a discreción del Sensei.', minMonths: 108, maxMonths: null, isMaximumRank: true, katas: ['Happo Sho', 'Hakutsuru', 'Haffa'] },
]

export const YOUTH_RANKS: CurriculumRank[] = [
  { id: 'belt-youth-01-blanco', order: 1, name: 'Blanco', kyuDan: '11TH KYU', japaneseName: '—', kanji: '白帯', beltColor: '#FFFFFF', minMonths: 0, maxMonths: 3, isMaximumRank: false, katas: [] },
  { id: 'belt-youth-02-blanco-amarillo', order: 2, name: 'Amarillo-Blanca', kyuDan: '10TH KYU HO', japaneseName: 'Ju-kyu-ho', kanji: '十級補', beltColor: '#FFFDE7', minMonths: 3, maxMonths: 4, isMaximumRank: false, katas: ['Kihon Kata Ichi', 'Kihon Kata Ni', 'Kihon Kata San', 'Kihon Kata Yon', 'Kihon Kata Go'] },
  { id: 'belt-youth-03-amarillo', order: 3, name: 'Amarillo', kyuDan: '10TH KYU', japaneseName: 'Ju-kyu', kanji: '十級', beltColor: '#FFEB3B', minMonths: 6, maxMonths: 7, isMaximumRank: false, katas: ['Tenno Kata', 'Chino Kata'] },
  { id: 'belt-youth-04-amarillo-naranja', order: 4, name: 'Naranja-Blanca', kyuDan: '9TH KYU HO', japaneseName: 'Kyu-kyu-ho', kanji: '九級補', beltColor: '#FFE082', minMonths: 9, maxMonths: 10, isMaximumRank: false, katas: ['Tenno Kata', 'Chino Kata', 'Pinan Nidan'] },
  { id: 'belt-youth-05-naranja', order: 5, name: 'Naranja', kyuDan: '9TH KYU', japaneseName: 'Kyu-kyu', kanji: '九級', beltColor: '#FF9800', minMonths: 12, maxMonths: 13, isMaximumRank: false, katas: ['Chino Kata', 'Pinan Nidan', 'Pinan Shodan'] },
  { id: 'belt-youth-06-naranja-azul', order: 6, name: 'Azul-Blanca', kyuDan: '8TH KYU HO', japaneseName: 'Hachi-kyu-ho', kanji: '八級補', beltColor: '#FFCC80', minMonths: 15, maxMonths: 16, isMaximumRank: false, katas: ['Pinan Nidan', 'Pinan Shodan', 'Pinan Sandan'] },
  { id: 'belt-youth-07-azul', order: 7, name: 'Azul', kyuDan: '8TH KYU', japaneseName: 'Hachi-kyu', kanji: '八級', beltColor: '#2196F3', minMonths: 18, maxMonths: 19, isMaximumRank: false, katas: ['Pinan Shodan', 'Pinan Sandan', 'Pinan Yondan'] },
  { id: 'belt-youth-08-azul-morado', order: 8, name: 'Morado-Blanca', kyuDan: '7TH KYU HO', japaneseName: 'Nana-kyu-ho', kanji: '七級補', beltColor: '#90CAF9', minMonths: 21, maxMonths: 22, isMaximumRank: false, katas: ['Pinan Sandan', 'Pinan Yondan', 'Pinan Godan'] },
  { id: 'belt-youth-09-morado', order: 9, name: 'Morado', kyuDan: '7TH KYU', japaneseName: 'Nana-kyu', kanji: '七級', beltColor: '#9C27B0', minMonths: 24, maxMonths: 25, isMaximumRank: false, katas: ['Pinan Yondan', 'Pinan Godan', 'Bassai Dai'] },
  { id: 'belt-youth-10-morado-verde', order: 10, name: 'Verde-Blanca', kyuDan: '6TH KYU HO', japaneseName: 'Rok-kyu-ho', kanji: '六級補', beltColor: '#CE93D8', minMonths: 27, maxMonths: 28, isMaximumRank: false, katas: ['Pinan Godan', 'Bassai Dai', 'Jūtte', 'Niseishi'] },
  { id: 'belt-youth-11-verde', order: 11, name: 'Verde', kyuDan: '6TH KYU', japaneseName: 'Rok-kyu', kanji: '六級', beltColor: '#4CAF50', minMonths: 30, maxMonths: 31, isMaximumRank: false, katas: ['Bassai Dai', 'Jūtte', 'Seienchin', 'Niseishi'] },
  { id: 'belt-youth-12-verde-cafe', order: 12, name: 'Café-Blanca', kyuDan: '5TH KYU HO', japaneseName: 'Go-kyu-ho', kanji: '五級補', beltColor: '#A5D6A7', minMonths: 33, maxMonths: 34, isMaximumRank: false, katas: ['Bassai Dai', 'Jūtte', 'Jion', 'Seienchin'] },
  { id: 'belt-youth-13-cafe', order: 13, name: 'Café', kyuDan: '5TH KYU', japaneseName: 'Go-kyu', kanji: '五級', beltColor: '#795548', minMonths: 36, maxMonths: 37, isMaximumRank: false, katas: ['Bassai Dai', 'Jion', 'Jiin', 'Seienchin'] },
  { id: 'belt-youth-14-cafe-negro', order: 14, name: 'Verde-Negro', kyuDan: '4TH KYU HO', japaneseName: 'Yon-kyu-ho', kanji: '四級補', beltColor: '#8D6E63', minMonths: 39, maxMonths: 40, isMaximumRank: false, katas: ['Bassai Dai', 'Seienchin', 'Jiin', 'Kosokun Dai'] },
  { id: 'belt-youth-15-cafe-oscuro', order: 15, name: 'Marrón', kyuDan: '3RD KYU', japaneseName: 'San-kyu', kanji: '三級', beltColor: '#5D4037', minMonths: 42, maxMonths: 43, isMaximumRank: false, katas: ['Kosokun Dai', 'Bassai Dai', 'Seienchin', 'Seipai'] },
  { id: 'belt-youth-16-cafe-oscuro-2', order: 16, name: 'Marrón-Blanca', kyuDan: '2ND KYU', japaneseName: 'Ni-kyu', kanji: '二級', beltColor: '#4E342E', minMonths: 43, maxMonths: 44, isMaximumRank: false, katas: ['Kosokun Dai', 'Bassai Dai', 'Seienchin', 'Seipai', 'Kururunfa'] },
  { id: 'belt-youth-17-cafe-oscuro-3', order: 17, name: 'Marrón-Negro', kyuDan: '1ST KYU', japaneseName: 'Ik-kyu', kanji: '一級', beltColor: '#3E2723', minMonths: 44, maxMonths: null, isMaximumRank: false, katas: [] },
  { id: 'belt-youth-18-negro', order: 18, name: 'Shodan Ho', kyuDan: 'SHODAN HO', japaneseName: '—', kanji: '初段補', beltColor: '#212121', beltSecondaryColor: '#FFFFFF', description: 'Grado juvenil (17 años o menos). Mínimo 3.5 años o a discreción del Sensei.', minMonths: 42, maxMonths: null, isMaximumRank: true, katas: ['Bassai Dai', 'Seienchin', 'Kosokun Dai', 'Niseishi', 'Seipai', 'Kururunfa'] },
]

export const RANKS_BY_PROGRAM: Record<Program, CurriculumRank[]> = {
  ADULT: ADULT_RANKS,
  YOUTH: YOUTH_RANKS,
}