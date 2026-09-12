import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { DashboardRole } from '@/types/dashboard'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },

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

        const user = await db.user.findUnique({
          where: {
            email,
          },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        if (!user.emailVerified) {
          return null
        }

        const passwordIsValid = await bcrypt.compare(
          password,
          user.passwordHash,
        )

        if (!passwordIsValid) {
          return null
        }

        // Un alumno solo puede entrar si su expediente proviene de una
        // inscripción (tiene al menos un enrolment). Las cuentas sin
        // inscripción (auto-registradas o huérfanas) quedan bloqueadas:
        // el acceso es exclusivo por invitación de la escuela.
        // El gate aplica SOLO a cuentas cuyo único rol es STUDENT: el staff
        // multirol (admin/instructor) nunca queda bloqueado por este chequeo.
        const staffRoles = user.roles.filter((role) => role !== 'STUDENT')
        if (staffRoles.length === 0) {
          const studentWithEnrollment = await db.student.findFirst({
            where: {
              userId: user.id,
              enrollments: { some: {} },
            },
            select: { id: true },
          })

          if (!studentWithEnrollment) {
            return null
          }
        }

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