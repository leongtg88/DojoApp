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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: user.roles as DashboardRole[],
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roles = user.roles as DashboardRole[]
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id)
        session.user.role = String(token.role)
        const tokenRoles = (token.roles ?? []) as DashboardRole[]
        const fallbackRoles = token.role ? [String(token.role) as DashboardRole] : []
        session.user.roles = tokenRoles.length > 0 ? tokenRoles : (fallbackRoles as DashboardRole[])
      }

      return session
    },
  },
})