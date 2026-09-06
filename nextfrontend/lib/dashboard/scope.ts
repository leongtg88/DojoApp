import { db } from '@/lib/db'

export interface AdminScope {
  isSuperAdmin: boolean
  schoolId: string | null
}

export async function getAdminScope(userId: string): Promise<AdminScope | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, schoolId: true },
  })

  if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPERADMIN')) {
    return null
  }

  if (user.role === 'SCHOOL_ADMIN' && !user.schoolId) {
    return null
  }

  return {
    isSuperAdmin: user.role === 'SUPERADMIN',
    schoolId: user.schoolId,
  }
}

export function scopeSchoolFilter(scope: AdminScope) {
  return scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }
}