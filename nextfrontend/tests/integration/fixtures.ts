import { db } from '@/lib/db'
import type { AdminScope } from '@/lib/dashboard/scope'
import { randomUUID } from 'node:crypto'

export function scopeFor(schoolId: string, branchId: string | null = null): AdminScope {
  return { isSuperAdmin: false, schoolId, branchId }
}

export async function createSchool(name = 'Escuela Test') {
  return db.school.create({ data: { name }, select: { id: true } })
}

export async function createBranch(schoolId: string, name = 'Sede Test') {
  return db.branch.create({ data: { name, schoolId }, select: { id: true } })
}

export interface StudentFixture {
  schoolId: string
  branchId: string
  firstName: string
  lastName: string
  currentRank?: string | null
}

export async function createStudent({ schoolId, branchId, firstName, lastName, currentRank = null }: StudentFixture) {
  return db.student.create({
    data: {
      schoolId,
      branchId,
      firstName,
      lastName,
      dateOfBirth: new Date('2010-01-01T00:00:00.000Z'),
      currentRank,
    },
    select: { id: true },
  })
}

export async function createTechnique(
  name: string,
  schoolId: string | null = null,
  category: 'KIHON' | 'KATA' | 'KUMITE' | 'BUNKAI' = 'KATA',
) {
  return db.technique.create({ data: { name, category, schoolId }, select: { id: true } })
}

export async function createRank({
  schoolId = null,
  program = 'ADULT',
  order,
  name,
  kataIds = [],
}: {
  schoolId?: string | null
  program?: 'ADULT' | 'YOUTH'
  order: number
  name: string
  kataIds?: string[]
}) {
  const rank = await db.beltRank.create({ data: { program, order, name, schoolId }, select: { id: true } })

  if (kataIds.length > 0) {
    await db.beltRankKata.createMany({
      data: kataIds.map((kataId, index) => ({ beltRankId: rank.id, kataId, order: index + 1 })),
    })
  }

  return rank
}

export type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

export async function createUser({
  email,
  roles = ['SCHOOL_ADMIN'],
  schoolId = null,
  branchId = null,
  name = null,
}: {
  email: string
  roles?: TestRole[]
  schoolId?: string | null
  branchId?: string | null
  name?: string | null
}) {
  return db.user.create({ data: { email, roles, schoolId, branchId, name }, select: { id: true } })
}

export async function createStudentAccount({
  schoolId,
  branchId,
  roles = ['STUDENT'],
}: {
  schoolId: string
  branchId: string
  roles?: TestRole[]
}) {
  const user = await db.user.create({ data: { email: `s-${randomUUID()}@test.dev`, roles }, select: { id: true } })
  const student = await db.student.create({
    data: {
      schoolId,
      branchId,
      firstName: 'Ana',
      lastName: 'Uno',
      dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
      userId: user.id,
    },
    select: { id: true },
  })
  return { userId: user.id, studentId: student.id }
}

export async function createPlan({
  schoolId = null,
  name = 'Plan Test',
  monthlyHours = 8,
  isUnlimited = false,
}: {
  schoolId?: string | null
  name?: string
  monthlyHours?: number
  isUnlimited?: boolean
}) {
  return db.plan.create({ data: { name, monthlyHours, isUnlimited, schoolId }, select: { id: true } })
}

export async function createClass({
  branchId,
  name = 'Clase Test',
  dayOfWeek = 1,
  startTime = '19:00',
  endTime = '21:00',
  instructorId = null,
  active = true,
}: {
  branchId: string
  name?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  instructorId?: string | null
  active?: boolean
}) {
  return db.class.create({
    data: {
      name,
      branchId,
      dayOfWeek,
      active,
      instructorId,
      startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
      endTime: new Date(`1970-01-01T${endTime}:00.000Z`),
    },
    select: { id: true },
  })
}
