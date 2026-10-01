import { auth } from '@/auth'
import { hasRole } from '@/lib/auth/roles'
import { getInstructorAssignableStudents } from '@/lib/dashboard/instructor-queries'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const students = await getInstructorAssignableStudents(session.user.id)

  return NextResponse.json({ students })
}
