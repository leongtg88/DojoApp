import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const CARNET_FIXED = {
  ASOCIACION: 'ASOKADINA',
  CLUB: 'Tosei Gusoku Dojo Inoue Ha',
} as const

export interface CarnetData {
  fecha?: string | null
  apellidos?: string | null
  nombres?: string | null
  fechaNacimiento?: string | null
  sexo?: 'MALE' | 'FEMALE' | null
  tipoSangre?: string | null
  telefono?: string | null
  cedula?: string | null
  direccion?: string | null
  asociacion?: string | null
  grado?: string | null
  club?: string | null
  /** Foto de perfil (JPEG/PNG) lista para incrustar. */
  foto?: { bytes: Uint8Array; mime: 'image/jpeg' | 'image/png' } | null
}

const TEMPLATE_PATH = join(process.cwd(), 'public', 'forms', 'Formulario Federación para App.pdf')

// Coordenadas medidas sobre el formulario. `topY` es la línea de escritura en
// coordenadas top-left (origen arriba-izquierda); se convierte al sistema de
// pdf-lib (origen abajo-izquierda). pdf-lib ancla y=0 en la base del MediaBox
// (850.08 pt de alto, incluye el margen inferior de 7.83), por lo que la
// conversión usa esa altura completa para que el texto caiga sobre las líneas.
const PAGE_HEIGHT = 850.08

const yFromTop = (topY: number) => PAGE_HEIGHT - topY + 1

interface TextField {
  key: keyof CarnetData | 'fecha' | 'asociacion' | 'club'
  x: number
  topY: number
  size: number
}

const TEXT_FIELDS: TextField[] = [
  { key: 'fecha', x: 95, topY: 180.3, size: 12 },
  { key: 'apellidos', x: 131, topY: 291, size: 13 },
  { key: 'nombres', x: 130, topY: 326.3, size: 13 },
  { key: 'fechaNacimiento', x: 188, topY: 359.4, size: 13 },
  { key: 'tipoSangre', x: 320, topY: 395.3, size: 13 },
  { key: 'telefono', x: 131, topY: 429, size: 13 },
  { key: 'cedula', x: 398, topY: 430, size: 13 },
  { key: 'direccion', x: 134, topY: 465.1, size: 13 },
  { key: 'asociacion', x: 220, topY: 522.1, size: 13 },
  { key: 'grado', x: 175, topY: 554.8, size: 13 },
  { key: 'club', x: 147, topY: 587.1, size: 13 },
]

// Casillas de sexo (centros en coords top-left; M en x132.5-146, F en x175-185).
const SEXO_M_BOX = { x: 139, topY: 390 }
const SEXO_F_BOX = { x: 180, topY: 390 }

// Recuadro FOTO 2x2 (coords top-left). El área de recorte se centra sobre el
// marco (centro ~x460, y~156) y sobresale un poco para cubrirlo por completo.
const FOTO = { x: 438, yTop: 114, width: 76, height: 101 }

let cachedTemplate: Uint8Array | null = null

function loadTemplate(): Uint8Array {
  if (!cachedTemplate) cachedTemplate = readFileSync(TEMPLATE_PATH)
  return cachedTemplate
}

function emptyValue(value: string | null | undefined): boolean {
  return value === undefined || value === null || value.trim() === ''
}

/**
 * Rellena el formulario de la Federación con los datos del alumno.
 * Devuelve los bytes del PDF generado.
 */
export async function buildCarnetPdf(data: CarnetData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(loadTemplate(), { ignoreEncryption: true })
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const black = rgb(0, 0, 0)
  const page = pdfDoc.getPage(0)

  const effective = { ...data } as CarnetData
  if (emptyValue(effective.asociacion)) effective.asociacion = CARNET_FIXED.ASOCIACION
  if (emptyValue(effective.club)) effective.club = CARNET_FIXED.CLUB
  if (emptyValue(effective.fecha)) {
    effective.fecha = new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Santo_Domingo',
    }).format(new Date())
  }

  for (const field of TEXT_FIELDS) {
    const value = String(effective[field.key] ?? '').trim()
    if (!value) continue
    page.drawText(value, {
      x: field.x,
      y: yFromTop(field.topY),
      size: field.size,
      font,
      color: black,
    })
  }

  // Marca una X centrada en la casilla de sexo correspondiente.
  const sexBox = data.sexo === 'FEMALE' ? SEXO_F_BOX : data.sexo === 'MALE' ? SEXO_M_BOX : null
  if (sexBox) {
    page.drawText('X', {
      x: sexBox.x - 4.5,
      y: yFromTop(sexBox.topY) - 4.5,
      size: 13,
      font,
      color: black,
    })
  }

  // Incrusta la foto de perfil dentro del recuadro FOTO 2x2.
  if (data.foto) {
    const { bytes, mime } = data.foto
    const image = mime === 'image/png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
    const aspect = image.width / image.height
    let w = FOTO.width
    let h = FOTO.width / aspect
    if (h > FOTO.height) {
      h = FOTO.height
      w = FOTO.height * aspect
    }
    const x = FOTO.x + (FOTO.width - w) / 2
    const yBottomLeft = yFromTop(FOTO.yTop + FOTO.height) + (FOTO.height - h) / 2
    page.drawImage(image, { x, y: yBottomLeft, width: w, height: h })
  }

  return pdfDoc.save()
}