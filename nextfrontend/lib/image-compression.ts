// Compresión de imágenes en el cliente antes de subirlas.
//
// Las fotos de celular rondan los 3-8 MB. Como las funciones de Vercel rechazan
// cualquier petición de más de 4.5 MB (error 413), subirlas tal cual rompe la
// inscripción. Aquí se redimensionan y recomprimen a JPEG para que cada archivo
// pese unos cientos de KB, sin perder calidad útil para una cédula, carnet o
// partida de nacimiento.
//
// Es "best effort": ante cualquier fallo (navegador antiguo, formato no
// soportado, imagen corrupta) devuelve el archivo original y el flujo continúa.

export const MAX_IMAGE_DIMENSION = 1600

const JPEG_QUALITY = 0.82
// Si la imagen ya es JPEG y pesa poco, no vale la pena recomprimir.
const SKIP_BELOW_BYTES = 700 * 1024

function fitInside(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height }
  const scale = max / Math.max(width, height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

interface LoadedImage {
  source: CanvasImageSource
  width: number
  height: number
  close?: () => void
}

async function loadImage(file: File): Promise<LoadedImage | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    } catch {
      // Cae al fallback con <img>.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement | null>((resolve) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => resolve(null)
      element.src = url
    })
    if (!image) return null
    return { source: image, width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function renameToJpeg(name: string) {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  return `${base}.jpg`
}

export async function comprimirImagen(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  // Formatos sin recompresión razonable: se dejan intactos.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (typeof document === 'undefined') return file

  const loaded = await loadImage(file)
  if (!loaded || !loaded.width || !loaded.height) return file

  try {
    const target = fitInside(loaded.width, loaded.height, MAX_IMAGE_DIMENSION)
    const unchangedSize = target.width === loaded.width && target.height === loaded.height
    if (unchangedSize && file.type === 'image/jpeg' && file.size <= SKIP_BELOW_BYTES) return file

    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(loaded.source, 0, 0, target.width, target.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    // Si no se pudo recomprimir o el resultado pesa más, se conserva el original.
    if (!blob || blob.size === 0 || blob.size >= file.size) return file
    return new File([blob], renameToJpeg(file.name), { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  } finally {
    loaded.close?.()
  }
}
