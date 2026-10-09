import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import { reviewAbsenceJustification } from '@/lib/dashboard/absence-justifications'
import { notifyAssignment } from '@/lib/notifications/create'
import { recordAudit } from '@/lib/security/audit'
import { isSameOrigin, sameOriginResponse } from '@/lib/security/origin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

interface JustificationRouteContext {
  params: Promise<{ justificationId: string }>
}

export async function PATCH(request: Request, { params }: JustificationRouteContext) {
  if (!isSameOrigin(request)) {
    return sameOriginResponse()
  }

  const session = await auth()

  if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = reviewSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  const { justificationId } = await params
  const ownClasses = await db.class.findMany({
    where: { instructorId: session.user.id },
    select: { id: true },
  })

  try {
    const { attendanceStatus } = await reviewAbsenceJustification({
      justificationId,
      reviewerId: session.user.id,
      action: result.data.action,
      scopedClassIds: new Set(ownClasses.map(({ id }) => id)),
    })

    const justification = await db.absenceJustification.findUnique({
      where: { id: justificationId },
      select: {
        studentId: true,
        class: { select: { name: true } },
        student: { select: { schoolId: true } },
      },
    })

    if (justification) {
      await notifyAssignment({
        type: 'ATTENDANCE_JUSTIFICATION_REVIEWED',
        studentId: justification.studentId,
        data: { status: attendanceStatus, className: justification.class.name },
      })

      await recordAudit({
        actorId: session.user.id,
        schoolId: justification.student.schoolId,
        action: `attendance.justification_${result.data.action}`,
        targetType: 'AbsenceJustification',
        targetId: justificationId,
        detail: { status: attendanceStatus },
      })
    }

    return NextResponse.json({ ok: true, status: attendanceStatus })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'No tienes acceso a este reporte' }, { status: 403 })
    }
    console.error('Error revisando justificación de inasistencia:', error)
    return NextResponse.json({ error: 'No fue posible revisar el reporte' }, { status: 500 })
  }
}
