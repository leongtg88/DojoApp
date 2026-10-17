// Gestión del consentimiento de cookies (lado cliente).
//
// La decisión del usuario se guarda en una cookie de primera parte legible por
// JavaScript (`dojo_consent`). NO es httpOnly a propósito: el banner y el gate
// de analítica/marketing necesitan leerla en el navegador para decidir si
// cargan los scripts de terceros. El valor no es sensible (solo booleanos).
//
// La cookie se expone como una "fuente externa" leíble con useSyncExternalStore,
// en lugar de leerla dentro de un efecto, para evitar set-state-in-effect.

export const CONSENT_COOKIE = 'dojo_consent'

// Subir esta versión invalida las decisiones previas: si el usuario tenía la
// versión anterior, se le vuelve a pedir consentimiento.
export const CONSENT_VERSION = 1

// 12 meses, en línea con lo indicado en la Política de Cookies.
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'

export interface ConsentState {
  necessary: true
  analytics: boolean
  marketing: boolean
  version: number
  ts: number
}

/** Estado por defecto: solo lo estrictamente necesario activado. */
export function defaultConsent(): ConsentState {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    version: CONSENT_VERSION,
    ts: Date.now(),
  }
}

/** Valida y normaliza el valor crudo de la cookie. Devuelve null si no es válido. */
export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw || raw === CONSENT_SERVER_SNAPSHOT) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>
    if (typeof parsed !== 'object' || parsed === null) return null
    // Una versión distinta de la política fuerza a volver a preguntar.
    if (parsed.version !== CONSENT_VERSION) return null

    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      version: CONSENT_VERSION,
      ts: typeof parsed.ts === 'number' ? parsed.ts : Date.now(),
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Fuente externa (cookie) para useSyncExternalStore
// ---------------------------------------------------------------------------

/** Marca que el render ocurrió en el servidor (aún no hay cookie que leer). */
export const CONSENT_SERVER_SNAPSHOT = '\u0000server'

type Listener = () => void
const listeners = new Set<Listener>()

function emitConsentChange(): void {
  listeners.forEach((listener) => listener())
}

/**
 * Suscribe a los cambios de la cookie. Emitimos manualmente tras escribirla y
 * también escuchamos `storage` para sincronizar entre pestañas.
 */
export function subscribeConsent(listener: Listener): () => void {
  if (typeof window === 'undefined') return () => {}
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** Suscripción vacía para detectar el montaje en el cliente sin efectos. */
export function subscribeNoop(): () => void {
  return () => {}
}

/**
 * Valor actual de la cookie (o null si no existe). Devuelve un string primitivo,
 * por lo que es estable mientras no cambie: cumple el contrato de getSnapshot.
 */
export function getConsentSnapshot(): string | null {
  if (typeof document === 'undefined') return null

  const prefix = `${CONSENT_COOKIE}=`
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(prefix))

  return match ? match.slice(prefix.length) : null
}

/** Snapshot del servidor: nunca hay cookie disponible en SSR. */
export function getConsentServerSnapshot(): string {
  return CONSENT_SERVER_SNAPSHOT
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/** Persiste la decisión en la cookie y notifica a los suscriptores. */
export function writeConsentCookie(state: ConsentState): void {
  if (typeof document === 'undefined') return

  const value = encodeURIComponent(JSON.stringify(state))
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
  emitConsentChange()
}

/** Elimina la decisión guardada (por si se necesita re-consultar). */
export function clearConsentCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`
  emitConsentChange()
}
