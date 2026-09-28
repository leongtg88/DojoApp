import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { propagateTechniquesToRankStudents } from '@/lib/dashboard/technique-propagate'
import { notifyAssignment } from '@/lib/notifications/create'
import { ClassEnrollmentStatus, StudentStatus } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const assignSchema = z.object({
  targets: z.array(
    z.object({
      kind: z.enum(['GRADE', 'STUDENT', 'GROUP']),
      gradeIds: z.array(z.string().trim().min(1)).max(100).optional(),
      assignToStudents: z.boolean().optional(),
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
 * Asigna una técnica del catálogo a uno o varios destinos desde una única
 * fuente de verdad: grados (enlace al plan), alumnos individuales o grupos.
 */
export async function POST(request: Request, { params }: AssignRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { techniqueId } = await params
  const technique = await db.technique.findFirst({
    where: {
      id: techniqueId,
      ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId }, { schoolId: null }] }),
    },
    select: { id: true, name: true },
  })

  if (!technique) {
    return NextResponse.json({ error: 'Técnica no encontrada' }, { status: 404 })
  }

  const result = assignSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de asignación no válidos' }, { status: 400 })
  }

  let gradesLinked = 0
  let studentsAssigned = 0

  for (const target of result.data.targets) {
    if (target.kind === 'GRADE') {
      const gradeIds = [...new Set(target.gradeIds ?? [])]

      for (const gradeId of gradeIds) {
        const rank = await db.beltRank.findFirst({
          where: {
            id: gradeId,
            ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId }, { schoolId: null }] }),
          },
          select: { id: true, name: true },
        })

        if (!rank) continue

        const maxLink = await db.beltRankKata.aggregate({ where: { beltRankId: rank.id }, _max: { order: true } })

        try {
          await db.beltRankKata.create({
            data: { beltRankId: rank.id, kataId: technique.id, order: (maxLink._max.order ?? 0) + 1 },
          })
          gradesLinked += 1
        } catch {
          // Ya está enlazada al grado.
        }

        if (target.assignToStudents) {
          const summary = await propagateTechniquesToRankStudents({ scope, rank, techniqueIds: [technique.id] })
          studentsAssigned += summary.studentsAssigned
        }
      }
    } else if (target.kind === 'STUDENT') {
      const studentIds = [...new Set(target.studentIds ?? [])]
      const students = await db.student.findMany({
        where: { id: { in: studentIds }, ...scopeSchoolFilter(scope), status: StudentStatus.ACTIVE },
        select: { id: true },
      })

      for (const student of students) {
        const creation = await db.studentTechnique.createMany({
          data: [{ studentId: student.id, techniqueId: technique.id }],
          skipDuplicates: true,
        })

        if (creation.count > 0) {
          studentsAssigned += 1
          await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: student.id, count: 1 })
        }
      }
    } else if (target.kind === 'GROUP') {
      const group = target.group
      if (!group || (group.type !== 'ALL' && !group.value)) continue

      const targetFilter =
        group.type === 'GRADE'
          ? { currentRank: group.value }
          : group.type === 'BRANCH'
            ? { branch: { name: group.value } }
            : group.type === 'CLASS'
              ? { classEnrollments: { some: { status: ClassEnrollmentStatus.ACTIVE, class: { name: group.value } } } }
              : {}

      const students = await db.student.findMany({
        where: { ...scopeSchoolFilter(scope), status: StudentStatus.ACTIVE, ...targetFilter },
        select: { id: true },
      })

      for (const student of students) {
        const creation = await db.studentTechnique.createMany({
          data: [{ studentId: student.id, techniqueId: technique.id }],
          skipDuplicates: true,
        })

        if (creation.count > 0) {
          studentsAssigned += 1
          await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: student.id, count: 1 })
        }
      }
    }
  }

  return NextResponse.json({ ok: true, gradesLinked, studentsAssigned })
}
