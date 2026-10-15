// Tipos de documento de inscripción y reglas de obligatoriedad compartidas por
// el endpoint de subida por archivo y el de confirmación de la inscripción.
//
// Se centralizan aquí para que ambos usen exactamente las mismas etiquetas y
// reglas (evita que uno acepte lo que el otro rechaza).

export type DocumentKey = 'PROFILE_PHOTO' | 'IDENTITY' | 'BIRTH_CERTIFICATE' | 'PASSPORT'

// Allowlist de tipos: cualquier clave desconocida se descarta (fail-closed).
export const DOCUMENT_TYPE_MAP: Record<string, DocumentKey> = {
  PROFILE_PHOTO: 'PROFILE_PHOTO',
  IDENTITY: 'IDENTITY',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  PASSPORT: 'PASSPORT',
}

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  PROFILE_PHOTO: 'la foto de perfil',
  IDENTITY: 'la cédula',
  BIRTH_CERTIFICATE: 'la partida de nacimiento',
  PASSPORT: 'el pasaporte',
}

// Topes anti-abuso: por aspirante y por envío completo.
export const MAX_DOCUMENTS_PER_APPLICANT = 5
export const MAX_DOCUMENTS_PER_SUBMISSION = 50

// Documentos obligatorios según el rol del aspirante dentro de la inscripción.
export function requiredDocumentsFor(rol: 'adulto' | 'menor'): DocumentKey[] {
  return rol === 'adulto'
    ? ['PROFILE_PHOTO', 'IDENTITY', 'PASSPORT']
    : ['PROFILE_PHOTO', 'BIRTH_CERTIFICATE', 'PASSPORT']
}

// Rol de cada aspirante a partir del tipo de registro y su posición. En una
// inscripción familiar el primer aspirante es el tutor (adulto); el resto son
// menores. En 'adulto' hay un único aspirante; en 'menor' todos son menores.
export function applicantRole(tipoRegistro: string, applicantIndex: number): 'adulto' | 'menor' {
  if (tipoRegistro === 'adulto') return 'adulto'
  if (tipoRegistro === 'familiar') return applicantIndex === 0 ? 'adulto' : 'menor'
  return 'menor'
}
