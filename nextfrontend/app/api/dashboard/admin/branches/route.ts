import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const branches = await db.branch.findMany({
    where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return NextResponse.json({ branches })
}