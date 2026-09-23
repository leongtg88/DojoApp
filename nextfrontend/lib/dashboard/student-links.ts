/**
 * Construye el href de una ruta del portal del estudiante preservando el
 * contexto familiar (`?estudiante=<id>`). Si no hay estudiante activo devuelve
 * la ruta tal cual.
 */
export function studentHref(path: string, studentId?: string | null): string {
  if (!studentId) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}estudiante=${encodeURIComponent(studentId)}`
}