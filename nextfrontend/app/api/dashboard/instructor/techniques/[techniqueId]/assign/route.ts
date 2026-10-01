import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/auth/roles'
import type { AdminScope } from '@/lib/dashboard/scope'
import { getInstructorSchoolId } from '@/lib/dashboard/instructor-queries'
import { propagateTechniquesToRankStudents } from '@/lib/dashboard/technique-propagate'
import { assignTechniqueToStudentGroup, assignTechniqueToStudentsByIds } from '@/lib/dashboard/technique-assign'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignSchema = z.object({
  targets: z.array(
    z.object({
      kind: z.enum(['GRADE', 'STUDENT', 'GROUP']),
      gradeIds: z.array(z.string().trim().min(1)).max(100).optional(),
      studentIds: z.array(z.string().trim().min(1)).max(500).optional(),
      group: z
        .object({
          type: z.enum(['ALL', 'GRADE', 'BRANCH', 'CLASS']),
          value: z.string().trim().min(1).optional(),
        })
        .optional(),
    }),
  ).min(1).max(50),
})

interface AssignRouteContext {
  params: Promise<{ techniqueId: string }>
}

/**
 * Asigna una técnica del catálogo al expediente de los alumnos del instructor.
 * A diferencia del admin, no enlaza la técnica al plan del grado (no modifica
 * requisitos de examen); la pestaña "Grado" sólo propaga a sus alumnos activos.
 */
export async function POST(request: Request, { params }: AssignRouteContext) {
  const session = await auth()

  if (!session?.user?.id || !hasRole(session.user, 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const schoolId = await getInstructorSchoolId(session.user.id)

  if (!schoolId) {
    return NextResponse.json({ error: 'No perteneces a ninguna escuela' }, { status: 403 })
  }

  const { techniqueId } = await params
  const technique = await db.technique.findFirst({
    where: { id: techniqueId, OR: [{ schoolId }, { schoolId: null }] },
    select: { id: true, name: true },
  })

  if (!technique) {
    return NextResponse.json({ error: 'Técnica no encontrada' }, { status: 404 })
  }

  const result = assignSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  const instructor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { branchId: true },
  })
  const scope: AdminScope = { isSuperAdmin: false, schoolId, branchId: instructor?.branchId ?? null }

  let studentsAssigned = 0

  for (const target of result.data.targets) {
    if (target.kind === 'GRADE') {
      const gradeIds = [...new Set(target.gradeIds ?? [])]

      for (const gradeId of gradeIds) {
        const rank = await db.beltRank.findFirst({
          where: { id: gradeId, OR: [{ schoolId }, { schoolId: null }] },
          select: { id: true, name: true },
        })

        if (!rank) continue

        const summary = await propagateTechniquesToRankStudents({ scope, rank, techniqueIds: [technique.id] })
        studentsAssigned += summary.studentsAssigned
      }
    } else if (target.kind === 'STUDENT') {
      studentsAssigned += await assignTechniqueToStudentsByIds({
        scope,
        techniqueId: technique.id,
        studentIds: target.studentIds ?? [],
      })
    } else if (target.kind === 'GROUP') {
      const group = target.group
      if (!group) continue

      studentsAssigned += await assignTechniqueToStudentGroup({
        scope,
        techniqueId: technique.id,
        group: { type: group.type, value: group.value },
      })
    }
  }

  return NextResponse.json({ ok: true, gradesLinked: 0, studentsAssigned })
}
