/**
 * Los avisos de un tutor pueden ser de cualquiera de sus hijos. El enlace
 * guardado no incluye `?estudiante=`; se añade aquí con el `studentId` de la
 * notificación para que la campana abra el expediente correcto.
 */
export function buildNotificationHref(link: string | null, studentId: string | null): string {
  const base = link ?? '/dashboard/notificaciones'
  if (!studentId) return base

  const isStudentPortal = /^\/(?:dashboard\/)?estudiante(?:\/|\?|$)/.test(base)
  if (!isStudentPortal) return base

  const [pathname, query = ''] = base.split('?')
  const params = new URLSearchParams(query)
  params.set('estudiante', studentId)
  return `${pathname}?${params.toString()}`
}
