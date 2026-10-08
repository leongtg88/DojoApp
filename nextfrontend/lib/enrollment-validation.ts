import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, mimeForExtension, sniffMimeType } from '@/lib/file-validation'

export const TALLAS_ROPA: readonly string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const TIPOS_SANGRE: readonly string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const HORAS_SUENO: readonly string[] = ['Menos de 6 horas', '6-7 horas', '7-8 horas', '8-9 horas', 'Más de 9 horas']

export const TIEMPO_PANTALLAS: readonly string[] = ['Menos de 1 hora', '1-2 horas', '2-3 horas', '3-4 horas', 'Más de 4 horas']

// Responsabilidades en casa agrupadas por nivel de autonomía. Se presentan como
// selección múltiple agrupada y se guardan como array de etiquetas por alumno.
export const RESPONSABILIDADES_CASA: readonly { grupo: string; opciones: readonly string[] }[] = [
  {
    grupo: 'Nivel 1 · Con supervisión',
    opciones: [
      'Guardar sus juguetes',
      'Poner la ropa sucia en el cesto',
      'Ayudar a poner la mesa (servilletas, cubiertos no peligrosos)',
      'Regar una planta pequeña',
      'Cepillarse los dientes con supervisión',
    ],
  },
  {
    grupo: 'Nivel 2 · Con acompañamiento',
    opciones: [
      'Hacer su cama',
      'Ordenar su cuarto',
      'Preparar su mochila escolar',
      'Sacar la basura ligera',
      'Ayudar con la mascota (alimentarla)',
      'Tender o guardar su ropa',
    ],
  },
  {
    grupo: 'Nivel 3 · Con autonomía',
    opciones: [
      'Todas las anteriores con autonomía',
      'Preparar desayunos simples',
      'Lavar platos',
      'Colaborar en limpieza general (barrer, trapear)',
      'Administrar una pequeña mesada',
      'Cuidar a un hermano menor por periodos cortos (con supervisión)',
    ],
  },
  {
    grupo: 'Nivel 4 · Autonomía avanzada',
    opciones: [
      'Gestionar su horario y tareas escolares',
      'Cocinar comidas básicas',
      'Lavar su ropa',
      'Participar en decisiones familiares',
      'Administrar su dinero con orientación',
    ],
  },
]

export const RESPONSABILIDADES_OPCIONES: readonly string[] = RESPONSABILIDADES_CASA.flatMap((nivel) => nivel.opciones)

// ===== Preguntas de "Hábitos y bienestar" para adultos =====
export const ESTADO_CIVIL_HOGAR: readonly string[] = ['Vive solo/a', 'Con pareja', 'Con hijos', 'Con padres']

export const INFLUENCIA_INSCRIPCION: readonly string[] = ['Pareja', 'Amigo/a', 'Serie/película', 'Médico/a', 'Familiar', 'Nadie', 'Otro']

export const OBJETIVO_PRINCIPAL: readonly string[] = ['Competir', 'Defensa personal', 'Entrenar por salud', 'Desarrollo personal']

export const NIVEL_ESTRES: readonly string[] = ['Bajo', 'Medio', 'Alto']

export const MANEJO_FRUSTRACION: readonly string[] = ['Me insisto y sigo', 'Necesito un empujón', 'Me desanimo y abandono', 'Busco ayuda del instructor']

export const REACCION_CRITICA: readonly string[] = ['La recibo bien y aprendo', 'Me cuesta, pero la acepto', 'Me molesta', 'Depende de cómo se diga']

export const SI_NO_VE_RESULTADOS: readonly string[] = ['Seguiría igual', 'Buscaría asesoría del instructor', 'Ajustaría mi rutina', 'Lo reconsideraría']

export const TIEMPO_ARTE_MARCIAL: readonly string[] = ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años']

export const CUANDO_ARTE_MARCIAL: readonly string[] = ['Actualmente', 'Hace menos de 1 año', 'Hace 1-3 años', 'Hace más de 3 años']

export const soloDigitos = (value: string) => value.replace(/\D/g, '')

export const esCedulaValida = (value: string) => /^\d{11}$/.test(soloDigitos(value))

export const esTelefonoValido = (value: string) => {
  const digits = soloDigitos(value)
  return digits.length >= 10 && digits.length <= 15
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const esEmailValido = (value: string) => EMAIL_REGEX.test(value.trim())

const MENSAJE_TAMANO = 'El archivo supera los 5 MB. Comprime la imagen o usa otro archivo.'

function mensajeFormato(permitirPdf: boolean) {
  return `Formato no permitido. Usa ${permitirPdf ? 'JPG, PNG, WEBP o PDF' : 'JPG, PNG o WEBP'}.`
}

// Validación básica (sin leer el contenido): tamaño y formato declarado o por
// extensión. Sirve para la comprobación síncrona al avanzar de paso.
export function validarArchivoBasico(file: File, permitirPdf: boolean): string | null {
  if (!(file.size > 0 && file.size <= MAX_FILE_SIZE)) {
    return MENSAJE_TAMANO
  }

  const declared = file.type && file.type !== 'application/octet-stream' ? file.type : ''
  const effective = declared || mimeForExtension(file.name)

  if (!effective || !ALLOWED_MIME_TYPES.has(effective)) {
    return mensajeFormato(permitirPdf)
  }
  if (!permitirPdf && effective === 'application/pdf') {
    return mensajeFormato(false)
  }
  return null
}

// Validación completa: añade la detección por contenido (magic bytes) para
// rechazar archivos con extensión válida pero contenido inválido. Idéntica en
// cliente y servidor.
export async function validarArchivo(file: File, permitirPdf: boolean): Promise<string | null> {
  const basic = validarArchivoBasico(file, permitirPdf)
  if (basic) return basic

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const detected = sniffMimeType(header)

  if (!detected || !ALLOWED_MIME_TYPES.has(detected)) {
    return mensajeFormato(permitirPdf)
  }
  if (!permitirPdf && detected === 'application/pdf') {
    return mensajeFormato(false)
  }
  return null
}
