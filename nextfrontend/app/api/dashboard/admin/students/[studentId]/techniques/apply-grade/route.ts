import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { notifyAssignment } from '@/lib/notifications/create'
import { recordAudit } from '@/lib/security/audit'
import { ageFromDob, programForAge } from '@/lib/dashboard/program'
import { pickStudentRank } from '@/lib/dashboard/rank-resolution'
import { resolveProgressionKataIds } from '@/lib/dashboard/kata-curriculum'
import type { Program } from '@/lib/curriculum/programs'
import { NextResponse } from 'next/server'

interface ApplyGradeKatasRouteContext {
  params: Promise<{ studentId: string }>
}

/**
 * Aplica al expediente del alumno las katas de su grado actual (y del siguiente),
 * sin quitar nada: sólo agrega las que falten. Sirve para recomponer alumnos que
 * quedaron sin katas (p. ej. expedientes reutilizados o creados antes de que su
 * grado tuviera katas configuradas).
 */
export async function POST(_request: Request, { params }: ApplyGradeKatasRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await params
  const student = await db.student.findFirst({
    where: { id: studentId, ...scopeSchoolFilter(scope) },
    select: { id: true, schoolId: true, currentRank: true, currentRankId: true, dateOfBirth: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const studentProgram = programForAge(ageFromDob(student.dateOfBirth))
  const ranks = await db.beltRank.findMany({
    where: { OR: [{ schoolId: student.schoolId }, { schoolId: null }] },
    orderBy: [{ program: 'asc' }, { order: 'asc' }],
    select: { id: true, name: true, program: true, order: true, schoolId: true },
  })
  const rank =
    pickStudentRank(ranks, {
      currentRank: student.currentRank,
      currentRankId: student.currentRankId,
      studentProgram,
      schoolId: student.schoolId,
    }) ??
    ranks.find((candidate) => candidate.program === studentProgram && candidate.order === 1) ??
    null

  if (!rank) {
    return NextResponse.json({ error: 'El alumno no tiene un grado asignado.' }, { status: 409 })
  }

  const techniqueIds = await resolveProgressionKataIds({
    schoolId: student.schoolId,
    program: rank.program as Program,
    order: rank.order,
  })
  const existing = await db.studentTechnique.findMany({ where: { studentId: student.id }, select: { techniqueId: true } })
  const existingIds = new Set(existing.map((entry) => entry.techniqueId))
  const toAdd = techniqueIds.filter((techniqueId) => !existingIds.has(techniqueId))

  if (toAdd.length > 0) {
    await db.studentTechnique.createMany({
      data: toAdd.map((techniqueId) => ({ studentId: student.id, techniqueId })),
      skipDuplicates: true,
    })
    await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId: student.id, count: toAdd.length })
    await recordAudit({
      actorId: session.user.id,
      schoolId: scope.schoolId,
      action: 'techniques.assign',
      targetType: 'Student',
      targetId: student.id,
      detail: { source: 'apply-grade', rankId: rank.id, added: toAdd.length },
    })
  }

  return NextResponse.json({ ok: true, added: toAdd.length, total: techniqueIds.length, rankName: rank.name })
}
