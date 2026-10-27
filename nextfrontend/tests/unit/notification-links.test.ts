import { describe, expect, it } from 'vitest'
import { buildNotificationContent } from '@/lib/notifications/types'

const context = {
  studentName: 'Ana',
  studentId: 'student-1',
  count: 2,
  data: { rankName: 'Amarillo' },
}

describe('UX-B1 · enlaces de notificaciones', () => {
  it.each(['TECHNIQUES_ASSIGNED', 'TECHNIQUES_REMOVED', 'KATAS_UNLOCKED'] as const)(
    '%s lleva a Entrenar',
    (type) => {
      expect(buildNotificationContent(type, context).link).toBe('/dashboard/estudiante/entrenar')
    },
  )

  it('el ascenso de grado sigue llevando a Progreso', () => {
    expect(buildNotificationContent('RANK_PROMOTED', context).link).toBe('/dashboard/estudiante/progreso')
  })

  it('los avisos de clase y perfil mantienen su destino', () => {
    expect(buildNotificationContent('CLASS_ENROLLED', context).link).toBe('/dashboard/estudiante/clases')
    expect(buildNotificationContent('DOCUMENT_APPROVED', context).link).toBe('/dashboard/estudiante/perfil')
  })
})
