export const MAX_FILE_SIZE = 5 * 1024 * 1024

export const ALLOWED_FILE_TYPES: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
}

export const ALLOWED_MIME_TYPES = new Set<string>(Object.keys(ALLOWED_FILE_TYPES))

export function mimeForExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) return ''
  const ext = fileName.slice(dot + 1).toLowerCase()
  for (const [mime, exts] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (exts.includes(ext)) return mime
  }
  return ''
}

const b = (bytes: Uint8Array, i: number) => (i < bytes.length ? bytes[i] : 0)

export function sniffMimeType(bytes: Uint8Array): string {
  if (bytes.length >= 4 && b(bytes, 0) === 0x25 && b(bytes, 1) === 0x50 && b(bytes, 2) === 0x44 && b(bytes, 3) === 0x46) return 'application/pdf'
  if (bytes.length >= 3 && b(bytes, 0) === 0xff && b(bytes, 1) === 0xd8 && b(bytes, 2) === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && b(bytes, 0) === 0x89 && b(bytes, 1) === 0x50 && b(bytes, 2) === 0x4e && b(bytes, 3) === 0x47 && b(bytes, 4) === 0x0d && b(bytes, 5) === 0x0a && b(bytes, 6) === 0x1a && b(bytes, 7) === 0x0a) return 'image/png'
  if (bytes.length >= 12 && b(bytes, 0) === 0x52 && b(bytes, 1) === 0x49 && b(bytes, 2) === 0x46 && b(bytes, 3) === 0x46 && b(bytes, 8) === 0x57 && b(bytes, 9) === 0x45 && b(bytes, 10) === 0x42 && b(bytes, 11) === 0x50) return 'image/webp'
  return ''
}