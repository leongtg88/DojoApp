import type { DashboardRole } from '@/types/dashboard'

interface RoleAwareUser {
    role?: string | null
    roles?: Array<string | DashboardRole> | null
}

export function hasRole(user: RoleAwareUser | null | undefined, role: DashboardRole): boolean {
  if (!user) return false
  if (user.roles && user.roles.length > 0) return user.roles.includes(role)
  return user.role === role
}

export function hasAnyRole(user: RoleAwareUser | null | undefined, roles: DashboardRole[]): boolean {
  return roles.some((role) => hasRole(user, role))
}