import { afterEach, describe, expect, it, vi } from 'vitest'
import { NOTIFICATION_PRIORITY_LABELS, formatNotificationRelative } from '@/lib/notifications/format'

afterEach(() => {
  vi.useRealTimers()
})

describe('formato de notificaciones', () => {
  it('etiquetas de prioridad completas', () => {
    expect(NOTIFICATION_PRIORITY_LABELS).toEqual({
      INFO: 'Información',
      ACTION: 'Acción requerida',
      URGENT: 'Importante',
    })
  })

  it('describe el tiempo relativo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
    const at = (iso: string) => formatNotificationRelative(iso)

    expect(at('2026-06-15T12:00:00.000Z')).toBe('Ahora')
    expect(at('2026-06-15T11:30:00.000Z')).toBe('Hace 30 min')
    expect(at('2026-06-15T09:00:00.000Z')).toBe('Hace 3 h')
    expect(at('2026-06-12T12:00:00.000Z')).toBe('Hace 3 d')
    expect(at('2026-05-01T12:00:00.000Z')).toContain('2026')
  })
})
