import { DefaultSession } from 'next-auth'
import type { DashboardRole } from '@/types/dashboard'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roles: DashboardRole[]
    } & DefaultSession['user']
  }

  interface User {
    roles: DashboardRole[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roles: DashboardRole[]
  }
}