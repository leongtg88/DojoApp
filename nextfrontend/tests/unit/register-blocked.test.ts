import { describe, expect, it } from 'vitest'

const { POST } = await import('@/app/api/auth/register/route')

// El acceso es solo por invitación: no existe auto-registro.
describe('POST /api/auth/register', () => {
  it('responde 403 y explica que hace falta la invitación', async () => {
    const res = await POST()

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/inscripci/i)
    expect(body.error).toMatch(/invitaci/i)
  })
})
