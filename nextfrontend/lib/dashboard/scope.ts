import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'

export interface AdminScope {
  isSuperAdmin: boolean
  schoolId: string | null
  branchId: string | null
}

export async function getAdminScope(userId: string): Promise<AdminScope | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { roles: true, schoolId: true, branchId: true },
  })

  if (!user || !hasRole(user, 'SCHOOL_ADMIN') && !hasRole(user, 'SUPERADMIN')) {
    return null
  }

  if (hasRole(user, 'SCHOOL_ADMIN') && !hasRole(user, 'SUPERADMIN') && !user.schoolId) {
    return null
  }

  return {
    isSuperAdmin: hasRole(user, 'SUPERADMIN'),
    schoolId: user.schoolId,
    branchId: user.branchId,
  }
}

export function scopeSchoolFilter(scope: AdminScope) {
  return scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }
}