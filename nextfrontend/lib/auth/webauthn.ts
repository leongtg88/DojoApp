import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// Cookies efímeras usadas durante el flujo WebAuthn. Ambas van firmadas con
// HMAC-SHA256 (clave AUTH_SECRET) para que el cliente no pueda falsificar ni el
// desafío ni el ticket de sesión. Son httpOnly para que el JS de la página no
// las lea.
export const WA_CHALLENGE_COOKIE = 'dojo_wa_challenge'
export const WA_LOGIN_TICKET_COOKIE = 'dojo_wa_ticket'

// El desafío debe resolverse enseguida; 5 minutos es margen de sobra para que el
// usuario ponga la huella. El ticket de login solo vive lo que tarda el cliente
// en llamar a `signIn('webauthn')`.
const CHALLENGE_MAX_AGE_SECONDS = 5 * 60
const LOGIN_TICKET_MAX_AGE_SECONDS = 2 * 60

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export interface WebAuthnRp {
  /** Relying Party ID: el dominio registrable (p. ej. "toseigusoku.com"). */
  rpID: string
  /** Nombre visible para el usuario en el diálogo del sistema. */
  rpName: string
  /** URL exacta del sitio (esquema + host) que se espera en la respuesta. */
  origin: string
}

/**
 * Deriva la configuración del Relying Party a partir de la petición, con
 * override por variables de entorno. En Vercel, `x-forwarded-host` y
 * `x-forwarded-proto` los fija el edge proxy y son confiables.
 */
export function resolveWebAuthnRp(request: Request): WebAuthnRp {
  const headers = request.headers
  const host = (headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3000')
    .split(',')[0]
    .trim()

  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|192\.168\.|10\.)(:|$)/.test(host)
  const proto = (headers.get('x-forwarded-proto') ?? (isLocal ? 'http' : 'https'))
    .split(',')[0]
    .trim()

  const origin = `${proto}://${host}`
  const hostname = host.replace(/:\d+$/, '')

  return {
    rpID: process.env.WEBAUTHN_RP_ID?.trim() || hostname,
    rpName: process.env.WEBAUTHN_RP_NAME?.trim() || 'Tosei Gusoku',
    origin,
  }
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET no está configurado: no se puede firmar el flujo WebAuthn')
  }
  return secret
}

function hmac(payload: string): string {
  return createHmac('sha256', authSecret()).update(payload).digest('base64url')
}

/** Serializa y firma un payload JSON. Formato: `base64url(json).base64url(hmac)`. */
export function sealValue(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${hmac(body)}`
}

/** Verifica la firma y la expiración de un valor sellado. Devuelve null si no es válido. */
export function unsealValue<T>(token: string | null | undefined): T | null {
  if (!token) return null

  const separator = token.indexOf('.')
  if (separator <= 0) return null

  const body = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = hmac(body)

  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { exp?: unknown }
    if (typeof parsed.exp === 'number' && parsed.exp < Date.now()) {
      return null
    }
    return parsed as T
  } catch {
    return null
  }
}

/** Convierte un valor base64url almacenado en la base de datos a bytes. */
export function bytesFromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const decoded = Buffer.from(value, 'base64url')
  const bytes = new Uint8Array(decoded.byteLength)
  bytes.set(decoded)
  return bytes
}

/** Convierte bytes a base64url para persistirlos. */
export function bytesToBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString('base64url')
}

export interface StoredChallenge {
  challenge: string
  purpose: 'register' | 'login'
  userId: string | null
  exp: number
}

export async function setChallengeCookie(
  challenge: string,
  purpose: StoredChallenge['purpose'],
  userId: string | null,
): Promise<void> {
  const store = await cookies()
  store.set(
    WA_CHALLENGE_COOKIE,
    sealValue({ challenge, purpose, userId, exp: Date.now() + CHALLENGE_MAX_AGE_SECONDS * 1000 }),
    { ...COOKIE_BASE, maxAge: CHALLENGE_MAX_AGE_SECONDS },
  )
}

export async function readChallengeCookie(): Promise<StoredChallenge | null> {
  const store = await cookies()
  return unsealValue<StoredChallenge>(store.get(WA_CHALLENGE_COOKIE)?.value)
}

export async function clearChallengeCookie(): Promise<void> {
  const store = await cookies()
  store.delete(WA_CHALLENGE_COOKIE)
}

export interface LoginTicket {
  uid: string
  sv: number
  exp: number
}

export async function setLoginTicketCookie(userId: string, sessionVersion: number): Promise<void> {
  const store = await cookies()
  store.set(
    WA_LOGIN_TICKET_COOKIE,
    sealValue({ uid: userId, sv: sessionVersion, exp: Date.now() + LOGIN_TICKET_MAX_AGE_SECONDS * 1000 }),
    { ...COOKIE_BASE, maxAge: LOGIN_TICKET_MAX_AGE_SECONDS },
  )
}

export async function readLoginTicketCookie(): Promise<LoginTicket | null> {
  const store = await cookies()
  return unsealValue<LoginTicket>(store.get(WA_LOGIN_TICKET_COOKIE)?.value)
}

export async function clearLoginTicketCookie(): Promise<void> {
  const store = await cookies()
  store.delete(WA_LOGIN_TICKET_COOKIE)
}
