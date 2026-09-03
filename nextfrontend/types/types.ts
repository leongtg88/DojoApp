export enum Role {
  STUDENT = 'STUDENT',
  GUARDIAN = 'GUARDIAN',
  INSTRUCTOR = 'INSTRUCTOR',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  emailVerified: boolean
  createdAt: string
  belt?: string
  password?: string
}

export interface Session {
  user: {
    id: string
    name: string
    email: string
    role: Role
    belt?: string
  }
  expires: string
}
