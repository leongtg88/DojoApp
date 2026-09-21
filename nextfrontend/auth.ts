import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { consumeRateLimit, getClientIp, peekRateLimit, resetRateLimit } from '@/lib/security/rate-limit'
import type { DashboardRole } from '@/types/dashboard'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 días en lugar de los 30 por defecto
  },

  // Cookie de sesión con atributos de seguridad explícitos.
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
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
        // El gate aplica SOLO a cuentas cuyo único rol es STUDENT: el staff
        // multirol (admin/instructor) nunca queda bloqueado por este chequeo.
        const staffRoles = user.roles.filter((role) => role !== 'STUDENT')
        if (staffRoles.length === 0) {
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
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = user.roles as DashboardRole[]
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