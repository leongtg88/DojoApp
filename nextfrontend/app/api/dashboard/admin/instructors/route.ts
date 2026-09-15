import { auth } from '@/auth'
import { db } from '@/lib/db'
import { Role } from '@/lib/generated/prisma'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateInstructorRoleSchema = z.object({
  studentId: z.string().trim().min(1),
  grant: z.boolean(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = updateInstructorRoleSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  }

  const { studentId, grant } = result.data

  const student = await db.student.findFirst({
    where: { id: studentId, ...scopeSchoolFilter(scope) },
    select: {
      id: true,
      schoolId: true,
      branchId: true,
      user: { select: { id: true, roles: true, schoolId: true } },
    },
  })

  if (!student || !student.user) {
    return NextResponse.json({ error: 'El alumno no tiene una cuenta activa' }, { status: 400 })
  }

  const studentUser = student.user
  const roles = new Set<Role>(studentUser.roles)

  if (grant) {
    roles.add(Role.INSTRUCTOR)
  } else {
    roles.delete(Role.INSTRUCTOR)
    if (roles.size === 0) roles.add(Role.STUDENT)
  }

  await db.user.update({
    where: { id: studentUser.id },
    data: {
      roles: [...roles],
      ...(grant && !studentUser.schoolId ? { schoolId: student.schoolId, branchId: student.branchId } : {}),
    },
  })

  return NextResponse.json({ ok: true, isInstructor: grant })
}
