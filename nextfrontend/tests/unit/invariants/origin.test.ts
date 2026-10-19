import { describe, expect, it } from 'vitest'
import { isSameOrigin } from '@/lib/security/origin'

// Fase 0 · F0-05 — Las mutaciones exigen mismo origen (anti-CSRF).
// Se construye un Request mínimo: solo importa `headers.get`.
const requestWith = (headers: Record<string, string>) =>
  ({ headers: { get: (key: string) => headers[key.toLowerCase()] ?? null } }) as unknown as Request

describe('isSameOrigin', () => {
  it('permite peticiones sin cabecera Origin (server-side/internas)', () => {
    expect(isSameOrigin(requestWith({ host: 'dojo.test' }))).toBe(true)
  })

  it('permite cuando Origin coincide con Host', () => {
    expect(isSameOrigin(requestWith({ origin: 'https://dojo.test', host: 'dojo.test' }))).toBe(true)
  })

  it('bloquea cuando Origin es de otro dominio', () => {
    expect(isSameOrigin(requestWith({ origin: 'https://evil.test', host: 'dojo.test' }))).toBe(false)
  })

  it('bloquea cuando hay Origin pero no Host', () => {
    expect(isSameOrigin(requestWith({ origin: 'https://dojo.test' }))).toBe(false)
  })

  it('bloquea un Origin inválido sin lanzar', () => {
    expect(isSameOrigin(requestWith({ origin: 'no-es-una-url', host: 'dojo.test' }))).toBe(false)
  })
})
