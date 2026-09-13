import { auth } from '@/auth'
import { applyOfficialCurriculum } from '@/lib/dashboard/kata-curriculum'
import { getAdminScope } from '@/lib/dashboard/scope'
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

  const summary = await applyOfficialCurriculum(scope)

  return NextResponse.json({ ok: true, ...summary })
}
