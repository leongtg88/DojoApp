import 'server-only'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface RateLimitOptions {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export type RateLimitHeaders = Pick<Headers, 'get'>

// Extrae la IP del cliente. En Vercel, `x-forwarded-for` lo setea el edge
// proxy; en desarrollo no hay proxy y se usa un valor fijo.
export function getClientIp(headers?: RateLimitHeaders | null): string {
  if (!headers) return 'unknown'
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return headers.get('x-real-ip') ?? 'unknown'
}

function windowStart(now: number, windowMs: number): Date {
  return new Date(Math.floor(now / windowMs) * windowMs)
}

// Incrementa el contador de la ventana actual. No puede rebasarse por
// concurrencia gracias al upsert atómico de Prisma.
export async function consumeRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowMs = Math.max(1_000, opts.windowMs)
  const limit = Math.max(1, opts.limit)
  const now = Date.now()
  const start = windowStart(now, windowMs)

  const record = await db.apiUsage.upsert({
    where: { key_windowStart: { key, windowStart: start } },
    create: { key, windowStart: start, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  })

  // Limpieza oportunista: borra ventanas viejas de esta key.
  const cutoff = new Date(now - windowMs * 2)
  await db.apiUsage.deleteMany({
    where: { key, windowStart: { lt: cutoff } },
  })

  const allowed = record.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - record.count),
    retryAfterSeconds: Math.max(1, Math.ceil((start.getTime() + windowMs - now) / 1_000)),
  }
}

// Consulta el contador actual sin incrementarlo (p. ej. para bloquear antes de
// hacer un bcrypt.compare costoso cuando ya se superó el límite).
export async function peekRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowMs = Math.max(1_000, opts.windowMs)
  const limit = Math.max(1, opts.limit)
  const now = Date.now()
  const start = windowStart(now, windowMs)

  const record = await db.apiUsage.findUnique({
    where: { key_windowStart: { key, windowStart: start } },
    select: { count: true },
  })

  const count = record?.count ?? 0
  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((start.getTime() + windowMs - now) / 1_000)),
  }
}

// Reinicia los contadores de una key (p. ej. al loguearse con éxito).
export async function resetRateLimit(key: string): Promise<void> {
  await db.apiUsage.deleteMany({ where: { key } })
}

export function rateLimitResponse(retryAfterSeconds: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, {
    status: 429,
    headers: { 'Retry-After': String(retryAfterSeconds) },
  })
}