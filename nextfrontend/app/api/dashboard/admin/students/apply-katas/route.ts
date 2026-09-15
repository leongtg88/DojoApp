import { auth } from '@/auth'
import { assignCurriculumKatasToStudents } from '@/lib/dashboard/kata-curriculum'
import { getAdminScope } from '@/lib/dashboard/scope'
import { notifyAssignment } from '@/lib/notifications/create'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const summary = await assignCurriculumKatasToStudents(scope)
  const { assignments, ...summaryRest } = summary

  await Promise.all(
    assignments.map((assignment) =>
      notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: assignment.studentId, count: assignment.added }),
    ),
  )

  return NextResponse.json({ ok: true, ...summaryRest })
}
