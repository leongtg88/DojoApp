'use client'

// Descarga un archivo servido por una ruta del panel. Se usa `fetch` en lugar
// de un enlace directo para poder detectar errores del servidor (403/404/503)
// y para forzar la descarga con el nombre original del archivo.
export async function downloadFileFromEndpoint(url: string, fallbackFileName: string) {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'No fue posible descargar el archivo')
  }

  const blob = await response.blob()
  const fileName = filenameFromDisposition(response.headers.get('content-disposition')) ?? fallbackFileName
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Se libera después de que el navegador haya iniciado la descarga.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

function filenameFromDisposition(header: string | null) {
  if (!header) return null

  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return null
    }
  }

  const plain = header.match(/filename="?([^";]+)"?/i)
  return plain?.[1]?.trim() || null
}
