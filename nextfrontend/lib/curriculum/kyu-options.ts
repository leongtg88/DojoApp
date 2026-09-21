export interface KyuOption {
  value: string
  label: string
}

// Niveles previos de karate que puede declarar un aspirante en el formulario
// de inscripción. Se usa para preseleccionar su grado al convertir el
// expediente (además del cinturón blanco por defecto).
export const KYU_OPTIONS: readonly KyuOption[] = [
  { value: '11TH KYU', label: '11º Kyu (Blanco)' },
  { value: '10TH KYU', label: '10º Kyu (Amarillo)' },
  { value: '9TH KYU', label: '9º Kyu (Naranja)' },
  { value: '8TH KYU', label: '8º Kyu (Azul)' },
  { value: '7TH KYU', label: '7º Kyu (Morado)' },
  { value: '6TH KYU', label: '6º Kyu (Verde)' },
  { value: '5TH KYU', label: '5º Kyu (Verde-Blanca)' },
  { value: '4TH KYU', label: '4º Kyu (Verde-Negra)' },
  { value: '3RD KYU', label: '3º Kyu (Marrón)' },
  { value: '2ND KYU', label: '2º Kyu (Marrón-Blanca)' },
  { value: '1ST KYU', label: '1º Kyu (Marrón-Negra)' },
  { value: 'SHODAN', label: '1º Dan (Negro)' },
  { value: 'NIDAN', label: '2º Dan' },
  { value: 'SANDAN', label: '3º Dan' },
  { value: 'YONDAN', label: '4º Dan' },
  { value: 'GODAN', label: '5º Dan' },
  { value: 'ROKKUDAN', label: '6º Dan' },
  { value: 'NANADAN', label: '7º Dan' },
  { value: 'HACHIDAN', label: '8º Dan' },
  { value: 'KYUDAN', label: '9º Dan' },
]

const KYU_VALUES = new Set(KYU_OPTIONS.map((option) => option.value))

export function isValidKyuValue(value: unknown): value is string {
  return typeof value === 'string' && KYU_VALUES.has(value)
}

export function kyuLabel(value: string): string {
  return KYU_OPTIONS.find((option) => option.value === value)?.label ?? value
}

// Normaliza un valor kyuDan para compararlo de forma tolerante entre el
// catálogo de grados y lo declarado en el formulario:
// - ignora mayúsculas, espacios, guiones y paréntesis
// - elimina el sufijo "HO" (grados de transición juveniles)
//   Ej: "10TH KYU" y "10TH KYU HO" → "10THKYU"
export function normalizeKyuDan(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/HO$/, '')
}

// Igual que normalizeKyuDan pero conserva el sufijo "HO" para distinguir un
// grado de transición juvenil de su grado completo (10TH KYU HO vs 10TH KYU).
export function normalizeKyuDanStrict(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

// Devuelve true si `declared` (valor del formulario, p. ej. "1ST DAN" o
// "SHODAN") coincide con `catalog` (kyuDan de un BeltRank, p. ej.
// "SHODAN (1ST DAN)").
export function kyuMatches(declared: string, catalog: string): boolean {
  const a = normalizeKyuDan(declared)
  const b = normalizeKyuDan(catalog)
  if (!a || !b) return false
  if (a === b) return true
  // Cubre los Dan escritos como "SHODAN (1ST DAN)" frente a "1ST DAN".
  return a.includes(b) || b.includes(a)
}