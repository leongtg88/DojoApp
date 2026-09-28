import type { KihonCategory } from '@/lib/generated/prisma'

export interface CurriculumKihon {
  id: string
  name: string
  japaneseName?: string
  kanji?: string
  kihonCategory: KihonCategory
  level?: string
  stance?: string
  repetitionsCount?: number
  description?: string
  order: number
}

/**
 * Catálogo oficial de Kihon (Shito-Ryu Inoue Ha) organizado en categorías.
 * Es la referencia del script `prisma/sync-kihon.ts`, que lo sincroniza como
 * técnicas globales (schoolId = null). No vincula técnicas a grados: eso se
 * configura por escuela desde «Grados y técnicas → Asignar técnicas».
 *
 * Repeticiones por defecto: 10 para todas las categorías; Renzoku Waza queda
 * sin valor porque cada combinación define su propia carga.
 */
export const KIHON_CATEGORIES_ORDER: KihonCategory[] = [
  'DACHI',
  'TSUKI_WAZA',
  'UCHI_WAZA',
  'GERI_WAZA',
  'UKE_WAZA',
  'RENZOKU_WAZA',
  'IDO_KIHON',
]

const REPETITIONS_DEFAULT = 10

export const KIHON_TECHNIQUES: CurriculumKihon[] = [
  // ==================== Posiciones (Dachi) ====================
  { id: 'kihon-heisoku-dachi', name: 'Heisoku Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Pies juntos, posición cerrada (saludo).', order: 1 },
  { id: 'kihon-musubi-dachi', name: 'Musubi Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Pies juntos, punteras abiertas.', order: 2 },
  { id: 'kihon-heiko-dachi', name: 'Heiko Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición paralela.', order: 3 },
  { id: 'kihon-soto-hachiji-dachi', name: 'Soto Hachiji Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición natural con pies en «V».', order: 4 },
  { id: 'kihon-moto-dachi', name: 'Moto Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición fundamental de trabajo.', order: 5 },
  { id: 'kihon-zenkutsu-dachi', name: 'Zenkutsu Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición adelantada o de ataque.', order: 6 },
  { id: 'kihon-kokutsu-dachi', name: 'Kokutsu Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición atrasada o de defensa.', order: 7 },
  { id: 'kihon-shiko-dachi', name: 'Shiko Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición del sumo (piernas muy abiertas).', order: 8 },
  { id: 'kihon-neko-ashi-dachi', name: 'Neko Ashi Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición del gato.', order: 9 },
  { id: 'kihon-sanchin-dachi', name: 'Sanchin Dachi', kihonCategory: 'DACHI', repetitionsCount: REPETITIONS_DEFAULT, description: 'Posición de los tres conflictos.', order: 10 },

  // ==================== Técnicas de puño (Tsuki Waza) ====================
  { id: 'kihon-tsuki', name: 'Tsuki', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo fundamental.', order: 11 },
  { id: 'kihon-oi-tsuki', name: 'Oi Tsuki', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo en persecución con paso.', order: 12 },
  { id: 'kihon-gyaku-tsuki', name: 'Gyaku Tsuki', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo contrario (brazo opuesto a la pierna adelantada).', order: 13 },
  { id: 'kihon-jodan-tsuki', name: 'Jodan Tsuki', kihonCategory: 'TSUKI_WAZA', level: 'Jodan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo a nivel alto (cara).', order: 14 },
  { id: 'kihon-chudan-tsuki', name: 'Chudan Tsuki', kihonCategory: 'TSUKI_WAZA', level: 'Chudan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo a nivel medio (abdomen).', order: 15 },
  { id: 'kihon-tate-tsuki', name: 'Tate Tsuki', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo vertical con el puño.', order: 16 },
  { id: 'kihon-uraken-tsuki', name: 'Uraken Tsuki', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo invertido con el dorso del puño.', order: 17 },
  { id: 'kihon-yama-tsuki', name: 'Yama Tsuki', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Doble puñetazo simultáneo a dos niveles.', order: 18 },
  { id: 'kihon-age-tsuki', name: 'Age Tsuki', kihonCategory: 'TSUKI_WAZA', level: 'Jodan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Puñetazo ascendente.', order: 19 },
  { id: 'kihon-nukite', name: 'Nukite', kihonCategory: 'TSUKI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Mano en lanza.', order: 20 },

  // ==================== Técnicas de golpeo con mano (Uchi Waza) ====================
  { id: 'kihon-shuto-uchi', name: 'Shuto Uchi', kihonCategory: 'UCHI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe con el canto de la mano (espada).', order: 21 },
  { id: 'kihon-uraken-uchi', name: 'Uraken Uchi', kihonCategory: 'UCHI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe circular con el dorso del puño.', order: 22 },
  { id: 'kihon-kentsui-uchi', name: 'Kentsui Uchi', kihonCategory: 'UCHI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe con el puño en martillo.', order: 23 },
  { id: 'kihon-hiji-ate', name: 'Hiji Ate', kihonCategory: 'UCHI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe con el codo en múltiples direcciones: mae, yoko, otoshi.', order: 24 },
  { id: 'kihon-shotei-uchi', name: 'Shotei Uchi', kihonCategory: 'UCHI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe con la base de la palma.', order: 25 },
  { id: 'kihon-urashuto-uchi', name: 'Urashuto Uchi', kihonCategory: 'UCHI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe con el borde interno de la mano (ridge hand).', order: 26 },

  // ==================== Técnicas de pierna (Geri Waza) ====================
  { id: 'kihon-mae-geri', name: 'Mae Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Patada frontal con la bola del pie o el empeine.', order: 27 },
  { id: 'kihon-yoko-geri', name: 'Yoko Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Patada lateral: Keage ascendente o Kekomi penetrante.', order: 28 },
  { id: 'kihon-mawashi-geri', name: 'Mawashi Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Patada circular.', order: 29 },
  { id: 'kihon-ushiro-geri', name: 'Ushiro Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Patada hacia atrás.', order: 30 },
  { id: 'kihon-hiza-geri', name: 'Hiza Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Golpe con la rodilla.', order: 31 },
  { id: 'kihon-kantsetzu-geri', name: 'Kantsetzu Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Patada con el canto externo del pie.', order: 32 },
  { id: 'kihon-ura-mawashi-geri', name: 'Ura Mawashi Geri', kihonCategory: 'GERI_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Patada circular invertida (gancho).', order: 33 },

  // ==================== Bloqueos / Defensas (Uke Waza) ====================
  { id: 'kihon-gedan-barai', name: 'Gedan Barai', kihonCategory: 'UKE_WAZA', level: 'Gedan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo descendente (nivel bajo).', order: 34 },
  { id: 'kihon-jodan-age-uke', name: 'Jodan Age Uke', kihonCategory: 'UKE_WAZA', level: 'Jodan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo ascendente (nivel alto).', order: 35 },
  { id: 'kihon-chudan-yoko-uke', name: 'Chudan Yoko Uke', kihonCategory: 'UKE_WAZA', level: 'Chudan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo lateral a nivel medio con el antebrazo.', order: 36 },
  { id: 'kihon-chudan-uchi-uke', name: 'Chudan Uchi Uke', kihonCategory: 'UKE_WAZA', level: 'Chudan', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo con el borde interno del antebrazo.', order: 37 },
  { id: 'kihon-shuto-uke', name: 'Shuto Uke', kihonCategory: 'UKE_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo con el canto de la mano.', order: 38 },
  { id: 'kihon-koken-uke', name: 'Koken Uke', kihonCategory: 'UKE_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo con el dorso de la muñeca doblada; también se usa como golpe.', order: 39 },
  { id: 'kihon-ude-uke', name: 'Ude Uke', kihonCategory: 'UKE_WAZA', repetitionsCount: REPETITIONS_DEFAULT, description: 'Bloqueo con el antebrazo.', order: 40 },

  // ==================== Técnicas combinadas (Renzoku Waza) ====================
  { id: 'kihon-renzoku-mae-te-zuki-gyaku-zuki', name: 'Mae Te Zuki → Gyaku Zuki', kihonCategory: 'RENZOKU_WAZA', description: 'Puño adelantado + puño contrario.', order: 41 },
  { id: 'kihon-renzoku-gedan-barai-gyaku-zuki', name: 'Gedan Barai → Gyaku Zuki', kihonCategory: 'RENZOKU_WAZA', description: 'Bloqueo bajo + contraataque.', order: 42 },
  { id: 'kihon-renzoku-yoko-uke-gyaku-zuki', name: 'Yoko Uke → Gyaku Zuki', kihonCategory: 'RENZOKU_WAZA', description: 'Bloqueo lateral + contraataque.', order: 43 },
  { id: 'kihon-renzoku-age-uke-gyaku-zuki', name: 'Age Uke → Gyaku Zuki', kihonCategory: 'RENZOKU_WAZA', description: 'Bloqueo alto + contraataque.', order: 44 },
  { id: 'kihon-renzoku-geri-combo-1', name: 'Mae Geri → Mawashi Geri → Yoko Geri → Gyaku Tsuki', kihonCategory: 'RENZOKU_WAZA', description: 'Tres patadas encadenadas + puñetazo.', order: 45 },
  { id: 'kihon-renzoku-geri-combo-2', name: 'Mae Geri → Hiji Ate → Gedan Barai → Gyaku Tsuki', kihonCategory: 'RENZOKU_WAZA', description: 'Patada + codo + bloqueo + puñetazo.', order: 46 },
  { id: 'kihon-renzoku-geri-combo-3', name: 'Mae Geri → Mawashi Geri → Ushiro Geri → Yoko Uke → Tsugi Ashi → Yoko Geri → Gyaku Tsuki', kihonCategory: 'RENZOKU_WAZA', description: 'Combinación avanzada de tres patadas, desplazamiento y contraataque.', order: 47 },

  // ==================== Kihon en movimiento (Ido Kihon) ====================
  // Técnicas de kihon ejecutadas en desplazamiento, avanzando y retrocediendo.
  // Sin repeticiones por defecto: se ajustan según lo que requiera el ejercicio.
  { id: 'kihon-ido-oi-zuki', name: 'Oi Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Puñetazo en persecución avanzando y retrocediendo en Zenkutsu Dachi.', order: 48 },
  { id: 'kihon-ido-sanbon-zuki', name: 'Sanbon Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Tres puñetazos consecutivos avanzando.', order: 49 },
  { id: 'kihon-ido-age-uke-gyaku-zuki', name: 'Age Uke → Gyaku Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Bloqueo alto y contraataque avanzando y retrocediendo.', order: 50 },
  { id: 'kihon-ido-soto-uke-gyaku-zuki', name: 'Soto Uke → Gyaku Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Bloqueo exterior y contraataque avanzando y retrocediendo.', order: 51 },
  { id: 'kihon-ido-uchi-uke-gyaku-zuki', name: 'Uchi Uke → Gyaku Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Bloqueo interior y contraataque avanzando y retrocediendo.', order: 52 },
  { id: 'kihon-ido-gedan-barai-gyaku-zuki', name: 'Gedan Barai → Gyaku Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Bloqueo bajo y contraataque avanzando y retrocediendo.', order: 53 },
  { id: 'kihon-ido-shuto-uke-nukite', name: 'Shuto Uke → Nukite (Ido)', kihonCategory: 'IDO_KIHON', description: 'Bloqueo con el canto de la mano y mano en lanza avanzando.', order: 54 },
  { id: 'kihon-ido-mae-geri', name: 'Mae Geri (Ido)', kihonCategory: 'IDO_KIHON', description: 'Patada frontal avanzando y retrocediendo.', order: 55 },
  { id: 'kihon-ido-yoko-geri-keage', name: 'Yoko Geri Keage (Ido)', kihonCategory: 'IDO_KIHON', description: 'Patada lateral ascendente en desplazamiento lateral.', order: 56 },
  { id: 'kihon-ido-yoko-geri-kekomi', name: 'Yoko Geri Kekomi (Ido)', kihonCategory: 'IDO_KIHON', description: 'Patada lateral penetrante en desplazamiento lateral.', order: 57 },
  { id: 'kihon-ido-mawashi-geri', name: 'Mawashi Geri (Ido)', kihonCategory: 'IDO_KIHON', description: 'Patada circular avanzando.', order: 58 },
  { id: 'kihon-ido-mae-geri-oi-zuki-gyaku-zuki', name: 'Mae Geri → Oi Zuki → Gyaku Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Combinación de patada y doble puñetazo avanzando y retrocediendo.', order: 59 },
  { id: 'kihon-ido-age-uke-mae-geri-gyaku-zuki', name: 'Age Uke → Mae Geri → Gyaku Zuki (Ido)', kihonCategory: 'IDO_KIHON', description: 'Combinación de bloqueo alto, patada frontal y contraataque avanzando y retrocediendo.', order: 60 },
]
