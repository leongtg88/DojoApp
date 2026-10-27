import { describe, expect, it } from 'vitest'
import { buildNotificationHref } from '@/lib/notifications/links'

describe('UX-B1 · enlaces de notificaciones con contexto familiar', () => {
  it('añade el hijo a los enlaces del portal del alumno', () => {
    expect(buildNotificationHref('/dashboard/estudiante/clases', 'ana')).toBe(
      '/dashboard/estudiante/clases?estudiante=ana',
    )
    expect(buildNotificationHref('/dashboard/estudiante', 'ana')).toBe(
      '/dashboard/estudiante?estudiante=ana',
    )
    expect(buildNotificationHref('/estudiante/entrenar', 'ana')).toBe(
      '/estudiante/entrenar?estudiante=ana',
    )
  })

  it('conserva la query existente', () => {
    expect(buildNotificationHref('/dashboard/estudiante/clases?tab=historial', 'ana')).toBe(
      '/dashboard/estudiante/clases?tab=historial&estudiante=ana',
    )
    expect(buildNotificationHref('/dashboard/estudiante?tab=inicio', 'ana')).toBe(
      '/dashboard/estudiante?tab=inicio&estudiante=ana',
    )
  })

  it('no toca enlaces de admin, instructor ni rutas parecidas', () => {
    expect(buildNotificationHref('/dashboard/admin/alumnos/1', 'ana')).toBe('/dashboard/admin/alumnos/1')
    expect(buildNotificationHref('/dashboard/instructor/asistencia', 'ana')).toBe('/dashboard/instructor/asistencia')
    expect(buildNotificationHref('/estudiante-falso', 'ana')).toBe('/estudiante-falso')
  })

  it('sin alumno o sin enlace usa el fallback', () => {
    expect(buildNotificationHref('/dashboard/estudiante/clases', null)).toBe('/dashboard/estudiante/clases')
    expect(buildNotificationHref(null, 'ana')).toBe('/dashboard/notificaciones')
  })
})
