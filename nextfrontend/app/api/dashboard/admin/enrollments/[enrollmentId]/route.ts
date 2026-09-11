import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { deletePrivateDocuments } from '@/lib/document-storage'
import { NextResponse } from 'next/server'

interface EnrollmentRouteContext {
  params: Promise<{ enrollmentId: string }>
}

export async function DELETE(_request: Request, { params }: EnrollmentRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { enrollmentId } = await params
  const enrollment = await db.enrollment.findFirst({
    where: {
      id: enrollmentId,
      status: 'PENDING',
      ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }),
    },
    select: {
      id: true,
      documents: { select: { storageKey: true } },
    },
  })

  if (!enrollment) {
    return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 })
  }

  if (enrollment.documents.length > 0) {
    try {
      await deletePrivateDocuments(enrollment.documents.map(({ storageKey }) => storageKey))
    } catch (reason) {
      console.error('[eliminar-inscripcion] no fue posible borrar archivos del storage:', reason)
    }
  }

  await db.enrollment.delete({ where: { id: enrollment.id } })

  return NextResponse.json({ ok: true })
}