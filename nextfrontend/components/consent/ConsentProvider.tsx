'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  type ConsentCategory,
  type ConsentState,
  defaultConsent,
  getConsentServerSnapshot,
  getConsentSnapshot,
  parseConsent,
  subscribeConsent,
  subscribeNoop,
  writeConsentCookie,
} from '@/lib/consent'

interface ConsentContextValue {
  consent: ConsentState
  /** true una vez montado en el cliente (evita diferencias de hidratación). */
  isReady: boolean
  isBannerOpen: boolean
  /** true si ya existe una decisión guardada y vigente. */
  hasDecision: boolean
  /** ¿Hay consentimiento para esta categoría? "necessary" siempre es true. */
  hasConsent: (category: ConsentCategory) => boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void
  openBanner: () => void
  closeBanner: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // La cookie se lee como fuente externa: en SSR no existe (snapshot centinela),
  // así que el HTML del servidor y la primera renderización del cliente coinciden.
  const rawConsent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  )
  const isReady = useSyncExternalStore(subscribeNoop, () => true, () => false)

  const consent = useMemo<ConsentState>(
    () => parseConsent(rawConsent) ?? defaultConsent(),
    [rawConsent],
  )

  // ¿El usuario ya tomó una decisión válida (y vigente) sobre las cookies?
  const hasDecision = parseConsent(rawConsent) !== null

  // El banner se abre solo si aún no hay decisión; el footer puede reabrirlo.
  const [forceOpen, setForceOpen] = useState(false)
  const isBannerOpen = (isReady && !hasDecision) || forceOpen

  const persist = useCallback((next: ConsentState) => {
    writeConsentCookie(next)
    setForceOpen(false)
  }, [])

  const acceptAll = useCallback(() => {
    persist({ ...defaultConsent(), analytics: true, marketing: true })
  }, [persist])

  const rejectAll = useCallback(() => {
    persist(defaultConsent())
  }, [persist])

  const savePreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      persist({ ...defaultConsent(), analytics: prefs.analytics, marketing: prefs.marketing })
    },
    [persist],
  )

  const hasConsent = useCallback(
    (category: ConsentCategory) =>
      category === 'necessary' || consent[category] === true,
    [consent],
  )

  const openBanner = useCallback(() => setForceOpen(true), [])
  const closeBanner = useCallback(() => setForceOpen(false), [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      isReady,
      isBannerOpen,
      hasDecision,
      hasConsent,
      acceptAll,
      rejectAll,
      savePreferences,
      openBanner,
      closeBanner,
    }),
    [
      consent,
      isReady,
      isBannerOpen,
      hasDecision,
      hasConsent,
      acceptAll,
      rejectAll,
      savePreferences,
      openBanner,
      closeBanner,
    ],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    throw new Error('useConsent debe usarse dentro de <ConsentProvider>')
  }
  return ctx
}
