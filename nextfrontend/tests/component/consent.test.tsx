import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_VERSION,
  clearConsentCookie,
  defaultConsent,
  getConsentSnapshot,
  parseConsent,
  subscribeConsent,
  writeConsentCookie,
} from '@/lib/consent'

beforeEach(() => {
  clearConsentCookie()
})

// Consentimiento de cookies (cliente, jsdom).
describe('consentimiento de cookies', () => {
  it('defaultConsent solo activa lo estrictamente necesario', () => {
    const consent = defaultConsent()
    expect(consent.necessary).toBe(true)
    expect(consent.analytics).toBe(false)
    expect(consent.marketing).toBe(false)
    expect(consent.version).toBe(CONSENT_VERSION)
  })

  it('parseConsent rechaza vacío, inválido y versión distinta', () => {
    expect(parseConsent(null)).toBeNull()
    expect(parseConsent('no-json')).toBeNull()
    expect(parseConsent(encodeURIComponent(JSON.stringify({ version: 999, analytics: true })))).toBeNull()
  })

  it('escribe y vuelve a leer la decisión', () => {
    writeConsentCookie({ ...defaultConsent(), analytics: true })
    expect(parseConsent(getConsentSnapshot())).toMatchObject({ necessary: true, analytics: true, marketing: false })
  })

  it('notifica a los suscriptores al escribir', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeConsent(listener)
    writeConsentCookie(defaultConsent())
    expect(listener).toHaveBeenCalled()
    unsubscribe()
  })

  it('clearConsentCookie deja el consentimiento sin decisión', () => {
    writeConsentCookie({ ...defaultConsent(), marketing: true })
    clearConsentCookie()
    expect(parseConsent(getConsentSnapshot())).toBeNull()
  })
})
