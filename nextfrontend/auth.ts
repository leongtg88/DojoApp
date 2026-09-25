import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { consumeRateLimit, getClientIp, peekRateLimit, resetRateLimit } from '@/lib/security/rate-limit'
import type { DashboardRole } from '@/types/dashboard'

const SESSION_VERIFY_INTERVAL_MS = 60 * 60 * 1000 // 1 hora entre chequeos de validez de sesión

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 días: quien use el app al menos una vez al mes no vuelve a loguearse
  },

  // Cookies con atributos de seguridad explícitos. Todas llevan maxAge (30
  // días) para que sean PERSISTENTES: en las PWA instaladas (iOS/WebKit) las
  // cookies de solo sesión se pierden al cerrar/reabrir la app, y mezclar
  // cookies de sesión con persistentes dispara el bug de rollback de cookies
  // (WebKit #272325). Con todas persistentes el bug no se reproduce.
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      },
    },
    csrfToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      },
    },
    callbackUrl: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      },
    },
  },

  secret: process.env.AUTH_SECRET,

  trustHost: true,

  pages: {
    signIn: '/login',
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: 'Correo',
          type: 'email',
        },
        password: {
          label: 'Contraseña',
          type: 'password',
        },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .trim()
          .toLowerCase()

        const password = String(credentials?.password ?? '')

        if (!email || !password) {
          return null
        }

        // Rate limiting: límite por IP por ventana (bloquea botnets) y por
        // email con lockout tras fallos consecutivos.
        let ip = 'unknown'
        try {
          const hdrs = await headers()
          ip = getClientIp(hdrs)
        } catch {
          ip = 'unknown'
        }

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

        const passwordIsValid = await bcrypt.compare(
          password,
          user.passwordHash,
        )

        if (!passwordIsValid) {
          await recordFailedLogin()
          return null
        }

        // Un alumno solo puede entrar si su expediente proviene de una
        // inscripción. Las cuentas sin expediente (auto-registradas u
        // huérfanas) quedan bloqueadas: el acceso es exclusivo por invitación
        // de la escuela. Un expediente puede venir de la conversión de una
        // inscripción (relación `enrollments` en el enrollment principal) o de
        // un aspirante familiar (relación `enrollmentApplicant`), por lo que se
        // aceptan ambas.
        // El gate aplica SOLO a cuentas cuyo único rol es STUDENT (sin rol de
        // tutor): un tutor (GUARDIAN) puede tener su propio expediente o no
        // (solo da seguimiento a sus hijos), y el staff multirol nunca queda
        // bloqueado por este chequeo.
        const hasStaffOrGuardianRole = user.roles.some((role) => role !== 'STUDENT')
        if (!hasStaffOrGuardianRole) {
          const studentWithEnrollment = await db.student.findFirst({
            where: {
              userId: user.id,
              OR: [
                { enrollments: { some: {} } },
                { enrollmentApplicant: { isNot: null } },
              ],
            },
            select: { id: true },
          })

          if (!studentWithEnrollment) {
            return null
          }
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
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = user.roles as DashboardRole[]
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0
        token.sessionVerifiedAt = Date.now()
      } else if (token.id) {
        // Sesión ya emitida: si el usuario cambió su contraseña (sessionVersion
        // aumentó) o ya no existe, la sesión deja de ser válida. El chequeo se
        // hace como máximo una vez por hora (throttle) para reducir la carga de
        // la DB y evitar que un error transitorio de red móvil invalide la
        // sesión y saque al usuario del dashboard sin aviso.
        const now = Date.now()
        const lastVerified = (token.sessionVerifiedAt as number | undefined) ?? 0
        if (now - lastVerified >= SESSION_VERIFY_INTERVAL_MS) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: String(token.id) },
              select: { sessionVersion: true },
            })
            if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
              return null
            }
            token.sessionVerifiedAt = now
          } catch {
            // Error transitorio de la DB: se conserva la sesión vigente en vez
            // de invalidarla. Se reintenta en la siguiente verificación.
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id)
        session.user.roles = (token.roles ?? []) as DashboardRole[]
      }

      return session
    },
  },
})