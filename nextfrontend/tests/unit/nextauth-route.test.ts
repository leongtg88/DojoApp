import { describe, expect, it, vi } from 'vitest'

// Se evita inicializar NextAuth de verdad: solo interesa comprobar que la ruta
// reexporta sus handlers.
const mockHandlers = { GET: vi.fn(), POST: vi.fn() }

vi.mock('@/auth', () => ({ handlers: mockHandlers }))

describe('route handler de NextAuth', () => {
  it('reexporta GET y POST de los handlers', async () => {
    const mod = await import('@/app/api/auth/[...nextauth]/route')

    expect(mod.GET).toBe(mockHandlers.GET)
    expect(mod.POST).toBe(mockHandlers.POST)
  })
})
