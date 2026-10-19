import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { consumeRateLimit, getClientIp, peekRateLimit, resetRateLimit, type RateLimitHeaders } from '@/lib/security/rate-limit'
import { userHasDashboardAccess } from '@/lib/auth/login-gate'
import type { DashboardRole } from '@/types/dashboard'

export interface AuthorizedUser {
  id: string
  email: string
  name: string | null
  roles: DashboardRole[]
  sessionVersion: number
}

/**
 * Lógica del proveedor de credenciales (login con correo y contraseña).
 * Se extrae de `auth.ts` para poder probar el wiring exacto (rate-limit por IP y
 * por correo, verificación de email, gate de acceso y reset al iniciar sesión).
 *
 * Devuelve el usuario autorizado o `null`. Nunca lanza: NextAuth espera `null`
 * ante cualquier rechazo.
 */
export async function authorizeCredentials(
  credentials: Partial<Record<'email' | 'password', unknown>> | null | undefined,
  headers: RateLimitHeaders | null,
): Promise<AuthorizedUser | null> {
  const email = String(credentials?.email ?? '')
    .trim()
    .toLowerCase()

  const password = String(credentials?.password ?? '')

  if (!email || !password) {
    return null
  }

  // Rate limiting: límite por IP por ventana (bloquea botnets) y por
  // email con lockout tras fallos consecutivos.
  const ip = getClientIp(headers)
  const ipAttempt = await consumeRateLimit(`login:${ip}`, {
    limit: 60,
    windowMs: 15 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return null
  }

  const emailFail = await peekRateLimit(`login-fail:${email}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  })
  if (!emailFail.allowed) {
    return null
  }

  const recordFailedLogin = async () => {
    await consumeRateLimit(`login-fail:${email}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
  }

  const user = await db.user.findUnique({
    where: {
      email,
    },
  })

  if (!user || !user.passwordHash) {
    await recordFailedLogin()
    return null
  }

  if (!user.emailVerified) {
    await recordFailedLogin()
    return null
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash)

  if (!passwordIsValid) {
    await recordFailedLogin()
    return null
  }

  // Gate de acceso compartido con el login por huella (ver
  // `lib/auth/login-gate.ts`): un alumno solo entra si su expediente
  // proviene de una inscripción; el staff y los tutores siempre pasan.
  if (!(await userHasDashboardAccess({ id: user.id, roles: user.roles }))) {
    return null
  }

  // Login exitoso: se reinicia el contador de fallos de este email.
  await resetRateLimit(`login-fail:${email}`)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles as DashboardRole[],
    sessionVersion: user.sessionVersion,
  }
}
