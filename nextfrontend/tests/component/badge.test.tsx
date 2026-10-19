import { afterEach, describe, expect, it, vi } from 'vitest'
import { setUnreadBadge } from '@/lib/badge'

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'setAppBadge')
  Reflect.deleteProperty(navigator, 'clearAppBadge')
})

describe('setUnreadBadge (Badging API)', () => {
  it('usa setAppBadge con el conteo cuando hay no leídos', () => {
    const setAppBadge = vi.fn(async () => {})
    const clearAppBadge = vi.fn(async () => {})
    Object.assign(navigator, { setAppBadge, clearAppBadge })

    setUnreadBadge(3)

    expect(setAppBadge).toHaveBeenCalledWith(3)
    expect(clearAppBadge).not.toHaveBeenCalled()
  })

  it('limpia el badge cuando el conteo es cero', () => {
    const setAppBadge = vi.fn(async () => {})
    const clearAppBadge = vi.fn(async () => {})
    Object.assign(navigator, { setAppBadge, clearAppBadge })

    setUnreadBadge(0)

    expect(clearAppBadge).toHaveBeenCalled()
    expect(setAppBadge).not.toHaveBeenCalled()
  })

  it('no falla si la API no está disponible (p. ej. iOS Safari)', () => {
    Object.assign(navigator, { setAppBadge: undefined, clearAppBadge: undefined })

    expect(() => setUnreadBadge(2)).not.toThrow()
  })

  it('ignora los errores de la API (app no instalada)', () => {
    Object.assign(navigator, {
      setAppBadge: () => {
        throw new Error('no instalada')
      },
      clearAppBadge: undefined,
    })

    expect(() => setUnreadBadge(2)).not.toThrow()
  })
})
