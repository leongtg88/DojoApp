import { DefaultSession } from 'next-auth'
import type { DashboardRole } from '@/types/dashboard'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      roles: DashboardRole[]
    } & DefaultSession['user']
  }

  interface User {
    role: string
    roles: DashboardRole[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    roles: DashboardRole[]
  }
}