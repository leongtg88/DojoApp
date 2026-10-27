/**
 * Rutas antiguas del portal del alumno que deben responder con una redirección
 * permanente real desde `proxy.ts` (308), antes de que el layout del dashboard
 * empiece a transmitir. La query se conserva para no perder `?estudiante=`.
 */
export const LEGACY_STUDENT_REDIRECTS: Readonly<Record<string, string>> = {
  '/estudiante/horario': '/dashboard/estudiante/clases',
  '/estudiante/asistencia': '/dashboard/estudiante/clases',
  '/dashboard/estudiante/horario': '/dashboard/estudiante/clases',
  '/dashboard/estudiante/asistencia': '/dashboard/estudiante/clases',
}

export function getLegacyStudentRedirect(pathname: string): string | null {
  return LEGACY_STUDENT_REDIRECTS[pathname] ?? null
}

/**
 * Construye el destino conservando la query original. `search` es el valor de
 * `request.nextUrl.search`, que ya incluye el `?` cuando hay parámetros.
 */
export function buildLegacyStudentRedirect(pathname: string, search: string): string | null {
  const destination = getLegacyStudentRedirect(pathname)
  if (!destination) return null

  const query = search.startsWith('?') ? search : search ? `?${search}` : ''
  return `${destination}${query}`
}
