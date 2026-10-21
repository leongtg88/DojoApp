import { db } from '@/lib/db'
import { ClassEnrollmentStatus, StudentStatus, type Prisma } from '@/lib/generated/prisma'
import { hasRole } from '@/lib/auth/roles'
import { getAdminScope } from '@/lib/dashboard/scope'
import { getInstructorSchoolId } from '@/lib/dashboard/instructor-queries'
import { santoDomingoDayKey, santoDomingoNoon } from '@/lib/dashboard/schedule-utils'
import type {
  OnlineRecoveryCandidate,
  OnlineRecoveryStatus,
  OnlineRecoverySummary,
} from '@/types/dashboard'

/** Duración y horas de la reposición online. Cuenta como tatami. */
export const ONLINE_RECOVERY_MINUTES = 35
export const ONLINE_RECOVERY_HOURS = Number((ONLINE_RECOVERY_MINUTES / 60).toFixed(2))

export interface RecoveryScope {
  /** null = superadmin (todas las escuelas). */
  schoolId: string | null
  /** Si viene, el instructor solo ve alumnos inscritos en estas clases. */
  instructorClassIds?: string[] | null
}

export interface RecoveryActor {
  userId: string
  isAdmin: boolean
  isInstructor: boolean
  scope: RecoveryScope
}

const recoveryInclude = {
  student: { select: { id: true, firstName: true, lastName: true } },
  absence: { select: { date: true, recoveredById: true, class: { select: { name: true } } } },
  instructor: { select: { id: true, name: true } },
} satisfies Prisma.OnlineRecoveryInclude

type RecoveryRow = Prisma.OnlineRecoveryGetPayload<{ include: typeof recoveryInclude }>

function studentScopeWhere(scope: RecoveryScope): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {}

  if (scope.schoolId) {
    where.schoolId = scope.schoolId
  }

  if (scope.instructorClassIds) {
    where.classEnrollments = {
      some: {
        status: ClassEnrollmentStatus.ACTIVE,
        classId: { in: scope.instructorClassIds },
      },
    }
  }

  return where
}

function studentName(row: Pick<RecoveryRow, 'student'>): string {
  return `${row.student.firstName} ${row.student.lastName}`.trim()
}

function mapRecovery(row: RecoveryRow): OnlineRecoverySummary {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: studentName(row),
    absenceId: row.absenceId,
    absenceDate: santoDomingoDayKey(row.absence.date),
    absenceRecovered: row.absence.recoveredById != null,
    className: row.absence.class?.name ?? null,
    status: row.status as OnlineRecoveryStatus,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    instructorId: row.instructorId,
    instructorName: row.instructor?.name ?? null,
    meetingUrl: row.meetingUrl,
    costAmount: row.costAmount?.toNumber() ?? null,
    costCurrency: row.costCurrency,
    costNote: row.costNote,
    costInformedAt: row.costInformedAt?.toISOString() ?? null,
    notes: row.notes,
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}

/**
 * Resuelve el alcance del actor. Un admin ve su escuela (o todas si es
 * superadmin); un instructor solo los alumnos de sus clases.
 */
export async function getOnlineRecoveryActor(userId: string): Promise<RecoveryActor | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  })

  if (!user) return null

  const adminScope = await getAdminScope(userId)

  if (adminScope) {
    return {
      userId,
      isAdmin: true,
      isInstructor: hasRole(user, 'INSTRUCTOR'),
      scope: { schoolId: adminScope.isSuperAdmin ? null : adminScope.schoolId },
    }
  }

  if (!hasRole(user, 'INSTRUCTOR')) return null

  const schoolId = await getInstructorSchoolId(userId)
  if (!schoolId) return null

  const classes = await db.class.findMany({
    where: { instructorId: userId },
    select: { id: true },
  })

  return {
    userId,
    isAdmin: false,
    isInstructor: true,
    scope: { schoolId, instructorClassIds: classes.map((scheduledClass) => scheduledClass.id) },
  }
}

/** Faltas sin reponer que todavía no tienen una reposición online asociada. */
export async function listOnlineRecoveryCandidates(
  actor: RecoveryActor,
  search?: string | null,
): Promise<OnlineRecoveryCandidate[]> {
  const searchFilter: Prisma.StudentWhereInput = search?.trim()
    ? {
        OR: [
          { firstName: { contains: search.trim(), mode: 'insensitive' } },
          { lastName: { contains: search.trim(), mode: 'insensitive' } },
        ],
      }
    : {}

  const rows = await db.attendance.findMany({
    where: {
      present: false,
      recoveredById: null,
      status: { in: ['ABSENT', 'JUSTIFIED', 'CONFIRMED'] },
      onlineRecoveryAbsence: null,
      student: {
        ...studentScopeWhere(actor.scope),
        status: StudentStatus.ACTIVE,
        ...searchFilter,
      },
    },
    orderBy: { date: 'desc' },
    take: 100,
    select: {
      id: true,
      date: true,
      class: { select: { name: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return rows.map((row) => ({
    absenceId: row.id,
    studentId: row.student.id,
    studentName: `${row.student.firstName} ${row.student.lastName}`.trim(),
    date: santoDomingoDayKey(row.date),
    className: row.class?.name ?? null,
  }))
}

/** Reposiciones visibles para el actor. */
export async function listOnlineRecoveries(
  actor: RecoveryActor,
  options: { status?: OnlineRecoveryStatus | null } = {},
): Promise<OnlineRecoverySummary[]> {
  const where: Prisma.OnlineRecoveryWhereInput = {
    student: studentScopeWhere(actor.scope),
  }

  if (options.status) {
    where.status = options.status
  }

  if (!actor.isAdmin) {
    where.OR = [
      { instructorId: actor.userId },
      { createdById: actor.userId },
    ]
  }

  const rows = await db.onlineRecovery.findMany({
    where,
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    include: recoveryInclude,
  })

  return rows.map(mapRecovery)
}

/** Reposiciones de un alumno (vista del alumno/tutor). */
export async function listStudentOnlineRecoveries(studentId: string): Promise<OnlineRecoverySummary[]> {
  const rows = await db.onlineRecovery.findMany({
    where: { studentId },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    include: recoveryInclude,
  })

  return rows.map(mapRecovery)
}

export async function getOnlineRecoveryPanelData(actor: RecoveryActor): Promise<{
  recoveries: OnlineRecoverySummary[]
  candidates: OnlineRecoveryCandidate[]
}> {
  const [recoveries, candidates] = await Promise.all([
    listOnlineRecoveries(actor),
    listOnlineRecoveryCandidates(actor),
  ])

  return { recoveries, candidates }
}

async function getOnlineRecoveryById(id: string): Promise<OnlineRecoverySummary> {
  const row = await db.onlineRecovery.findUnique({
    where: { id },
    include: recoveryInclude,
  })

  if (!row) throw new Error('NOT_FOUND')
  return mapRecovery(row)
}

async function assertInstructorForSchool(instructorId: string, schoolId: string): Promise<void> {
  const instructor = await db.user.findFirst({
    where: { id: instructorId, roles: { has: 'INSTRUCTOR' } },
    select: {
      id: true,
      schoolId: true,
      classes: {
        where: { branch: { schoolId } },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!instructor || (instructor.schoolId !== schoolId && instructor.classes.length === 0)) {
    throw new Error('INVALID_INSTRUCTOR')
  }
}

function canManageSchedule(
  row: { instructorId: string | null; createdById: string | null },
  actor: RecoveryActor,
): boolean {
  if (actor.isAdmin) return true
  return row.instructorId === actor.userId || row.createdById === actor.userId
}

function canComplete(row: { instructorId: string | null }, actor: RecoveryActor): boolean {
  if (actor.isAdmin) return true
  return row.instructorId === actor.userId
}

export interface CreateOnlineRecoveryInput {
  absenceId: string
  scheduledAt: Date
  instructorId?: string | null
  meetingUrl?: string | null
  notes?: string | null
}

/**
 * Agenda una reposición online para una falta. Si ya existe una reposición
 * cancelada o no-show para esa falta, la reutiliza.
 */
export async function createOnlineRecovery(
  actor: RecoveryActor,
  input: CreateOnlineRecoveryInput,
): Promise<OnlineRecoverySummary> {
  if (Number.isNaN(input.scheduledAt.getTime()) || input.scheduledAt.getTime() <= Date.now()) {
    throw new Error('INVALID_DATE')
  }

  const absence = await db.attendance.findFirst({
    where: { id: input.absenceId, student: studentScopeWhere(actor.scope) },
    select: {
      id: true,
      studentId: true,
      present: true,
      recoveredById: true,
      student: { select: { schoolId: true, status: true } },
      onlineRecoveryAbsence: { select: { id: true, status: true } },
    },
  })

  if (!absence) throw new Error('NOT_FOUND')
  if (absence.present || absence.recoveredById) throw new Error('ALREADY_RECOVERED')
  if (absence.student.status !== StudentStatus.ACTIVE) throw new Error('STUDENT_INACTIVE')

  const instructorId = input.instructorId ?? (!actor.isAdmin && actor.isInstructor ? actor.userId : null)
  if (instructorId) {
    await assertInstructorForSchool(instructorId, absence.student.schoolId)
  }

  const data = {
    scheduledAt: input.scheduledAt,
    instructorId,
    meetingUrl: input.meetingUrl ?? null,
    notes: input.notes ?? null,
    createdById: actor.userId,
  }

  if (absence.onlineRecoveryAbsence) {
    const existing = absence.onlineRecoveryAbsence
    if (existing.status === 'SCHEDULED') throw new Error('ALREADY_SCHEDULED')
    if (existing.status === 'COMPLETED') throw new Error('ALREADY_COMPLETED')

    const updated = await db.onlineRecovery.update({
      where: { id: existing.id },
      data: {
        ...data,
        status: 'SCHEDULED',
        cancelledAt: null,
        completedAt: null,
      },
      include: recoveryInclude,
    })

    return mapRecovery(updated)
  }

  const created = await db.onlineRecovery.create({
    data: {
      ...data,
      studentId: absence.studentId,
      absenceId: absence.id,
      status: 'SCHEDULED',
    },
    include: recoveryInclude,
  })

  return mapRecovery(created)
}

export interface RescheduleOnlineRecoveryInput {
  scheduledAt: Date
  instructorId?: string | null
  meetingUrl?: string | null
  notes?: string | null
}

export async function rescheduleOnlineRecovery(
  actor: RecoveryActor,
  recoveryId: string,
  input: RescheduleOnlineRecoveryInput,
): Promise<OnlineRecoverySummary> {
  if (Number.isNaN(input.scheduledAt.getTime()) || input.scheduledAt.getTime() <= Date.now()) {
    throw new Error('INVALID_DATE')
  }

  const recovery = await db.onlineRecovery.findFirst({
    where: { id: recoveryId, student: studentScopeWhere(actor.scope) },
    select: {
      id: true,
      status: true,
      instructorId: true,
      createdById: true,
      student: { select: { schoolId: true } },
    },
  })

  if (!recovery) throw new Error('NOT_FOUND')
  if (!canManageSchedule(recovery, actor)) throw new Error('FORBIDDEN')
  if (recovery.status === 'COMPLETED') throw new Error('ALREADY_COMPLETED')

  if (input.instructorId !== undefined && input.instructorId !== null) {
    await assertInstructorForSchool(input.instructorId, recovery.student.schoolId)
  }

  const data: Prisma.OnlineRecoveryUpdateInput = {
    status: 'SCHEDULED',
    scheduledAt: input.scheduledAt,
    cancelledAt: null,
    completedAt: null,
  }

  if (input.instructorId !== undefined) {
    data.instructor = input.instructorId
      ? { connect: { id: input.instructorId } }
      : { disconnect: true }
  }
  if (input.meetingUrl !== undefined) data.meetingUrl = input.meetingUrl
  if (input.notes !== undefined) data.notes = input.notes

  const updated = await db.onlineRecovery.update({
    where: { id: recovery.id },
    data,
    include: recoveryInclude,
  })

  return mapRecovery(updated)
}

export async function completeOnlineRecovery(
  actor: RecoveryActor,
  recoveryId: string,
): Promise<OnlineRecoverySummary> {
  const recovery = await db.onlineRecovery.findFirst({
    where: { id: recoveryId, student: studentScopeWhere(actor.scope) },
    include: {
      absence: {
        select: { id: true, present: true, recoveredById: true },
      },
    },
  })

  if (!recovery) throw new Error('NOT_FOUND')
  if (!canComplete(recovery, actor)) throw new Error('FORBIDDEN')
  if (recovery.status !== 'SCHEDULED') throw new Error('INVALID_STATUS')
  if (recovery.absence.present || recovery.absence.recoveredById) throw new Error('ALREADY_RECOVERED')

  const now = new Date()
  const dayKey = santoDomingoDayKey(recovery.scheduledAt)

  await db.$transaction(async (transaction) => {
    const attendance = await transaction.attendance.create({
      data: {
        studentId: recovery.studentId,
        date: santoDomingoNoon(dayKey),
        present: true,
        status: 'CONFIRMED',
        sessionType: 'online_recovery',
        hoursTrained: ONLINE_RECOVERY_HOURS,
        classId: null,
        isOutOfSchedule: true,
        confirmedById: actor.userId,
        confirmedAt: now,
        notes: recovery.notes ?? 'Reposición online de 35 min',
      },
      select: { id: true },
    })

    const recovered = await transaction.attendance.updateMany({
      where: { id: recovery.absenceId, recoveredById: null, present: false },
      data: { recoveredById: attendance.id },
    })

    if (recovered.count === 0) throw new Error('ALREADY_RECOVERED')

    await transaction.onlineRecovery.update({
      where: { id: recovery.id },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        attendanceId: attendance.id,
      },
    })
  })

  return getOnlineRecoveryById(recovery.id)
}

export async function cancelOnlineRecovery(
  actor: RecoveryActor,
  recoveryId: string,
): Promise<OnlineRecoverySummary> {
  const recovery = await db.onlineRecovery.findFirst({
    where: { id: recoveryId, student: studentScopeWhere(actor.scope) },
    select: { id: true, status: true, instructorId: true, createdById: true },
  })

  if (!recovery) throw new Error('NOT_FOUND')
  if (!canManageSchedule(recovery, actor)) throw new Error('FORBIDDEN')
  if (recovery.status === 'COMPLETED') throw new Error('ALREADY_COMPLETED')

  const updated = await db.onlineRecovery.update({
    where: { id: recovery.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: recoveryInclude,
  })

  return mapRecovery(updated)
}

export async function markOnlineRecoveryNoShow(
  actor: RecoveryActor,
  recoveryId: string,
): Promise<OnlineRecoverySummary> {
  const recovery = await db.onlineRecovery.findFirst({
    where: { id: recoveryId, student: studentScopeWhere(actor.scope) },
    select: { id: true, status: true, instructorId: true },
  })

  if (!recovery) throw new Error('NOT_FOUND')
  if (!canComplete(recovery, actor)) throw new Error('FORBIDDEN')
  if (recovery.status !== 'SCHEDULED') throw new Error('INVALID_STATUS')

  const updated = await db.onlineRecovery.update({
    where: { id: recovery.id },
    data: { status: 'NO_SHOW', cancelledAt: new Date() },
    include: recoveryInclude,
  })

  return mapRecovery(updated)
}

export interface InformOnlineRecoveryCostInput {
  costAmount: number
  costCurrency: string
  costNote?: string | null
}

export async function informOnlineRecoveryCost(
  actor: RecoveryActor,
  recoveryId: string,
  input: InformOnlineRecoveryCostInput,
): Promise<OnlineRecoverySummary> {
  if (!actor.isAdmin) throw new Error('FORBIDDEN')

  const recovery = await db.onlineRecovery.findFirst({
    where: { id: recoveryId, student: studentScopeWhere(actor.scope) },
    select: { id: true },
  })

  if (!recovery) throw new Error('NOT_FOUND')

  const updated = await db.onlineRecovery.update({
    where: { id: recovery.id },
    data: {
      costAmount: input.costAmount,
      costCurrency: input.costCurrency.toUpperCase(),
      costNote: input.costNote ?? null,
      costInformedAt: new Date(),
    },
    include: recoveryInclude,
  })

  return mapRecovery(updated)
}

/**
 * Cancela una reposición online programada cuando la falta se repone
 * presencialmente. Se llama dentro de la transacción del pase de lista.
 */
export async function cancelOnlineRecoveryForAbsence(
  transaction: Prisma.TransactionClient,
  absenceId: string,
): Promise<void> {
  await transaction.onlineRecovery.updateMany({
    where: { absenceId, status: 'SCHEDULED' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })
}
