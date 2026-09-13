import { db } from '@/lib/db'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { ageFromDob, programForAge, resolveDefaultRank } from '@/lib/dashboard/program'
import { computeBalance, formatTime, monthRange, pendingRecoveries } from '@/lib/dashboard/balance'
import type {
  StudentAttendanceRecord,
  StudentAttendancePunchData,
  StudentDashboardSummary,
  StudentDocumentSummary,
  StudentKataProgressSummary,
  KataStatus,
  GradoProgressData,
  KataProgressItem,
  TechniqueStatus,
  AttendanceRecord,
  StudentMonthlyStatus,
} from '@/types/dashboard'

function techniqueStatus(approved: boolean, inPractice: boolean): TechniqueStatus {
  if (approved) return 'APPROVED'
  if (inPractice) return 'IN_PROGRESS'
  return 'PENDING'
}

export async function getStudentDashboardSummary(
  userId: string,
): Promise<StudentDashboardSummary | null> {
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true } },
      techniques: {
        include: { technique: true, evaluation: { include: { evaluator: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
      attendances: { select: { present: true, status: true } },
    },
  })

  if (!student) {
    return null
  }

  const rankSelect = {
    id: true,
    name: true,
    kyuDan: true,
    japaneseName: true,
    kanji: true,
    order: true,
    beltColor: true,
    beltSecondaryColor: true,
    isMaximumRank: true,
    minMonths: true,
    minAttendancePercent: true,
    estimatedDurationMonths: true,
    description: true,
  } as const

  let rank = student.currentRank
    ? await db.beltRank.findFirst({
        where: {
          name: student.currentRank,
          OR: [{ schoolId: student.schoolId }, { schoolId: null }],
        },
        select: rankSelect,
      })
    : null

  // Fallback: un estudiante sin grado asignado siempre resuelve a cinturón blanco
  // según su programa (nunca más "grado fantasma").
  if (!rank && !student.currentRank) {
    const fallback = await resolveDefaultRank(student.schoolId, student.dateOfBirth)
    if (fallback) {
      rank = await db.beltRank.findUnique({ where: { id: fallback.id }, select: rankSelect })
    }
  }

  const attendedSessions = student.attendances.filter(({ present, status }) => present && status !== 'REJECTED').length
  const totalSessions = student.attendances.length

  return {
    profile: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      email: student.user?.email ?? null,
      contactPhone: student.contactPhone,
      dateOfBirth: student.dateOfBirth.toISOString(),
      currentRank: rank,
      photoKey: student.photoKey,
      medicalInfo: student.medicalInfo,
      emergencyContact: student.emergencyContact,
      enrollmentDate: student.enrollmentDate.toISOString(),
    },
    attendance: {
      attendedSessions,
      totalSessions,
      percentage: totalSessions === 0 ? 0 : Math.round((attendedSessions / totalSessions) * 100),
    },
    techniques: student.techniques.map(({ approved, approvedAt, inPractice, notes, practiceHours, technique, evaluation }) => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      category: technique.category,
      status: techniqueStatus(approved, inPractice),
      approvedAt: approvedAt?.toISOString() ?? null,
      notes,
      practiceHours,
      evaluation: evaluation ? {
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluatedAt: evaluation.evaluatedAt.toISOString(),
        evaluatorName: evaluation.evaluator.name,
      } : null,
    })),
    upcomingClasses: [],
  }
}

export async function getStudentAttendanceHistory(userId: string): Promise<StudentAttendanceRecord[] | null> {
  const student = await db.student.findUnique({
    where: { userId },
    select: {
      attendances: {
        orderBy: { date: 'desc' },
        select: {
          id: true,
          present: true,
          notes: true,
          date: true,
          session: {
            select: {
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!student) {
    return null
  }

  return student.attendances.map((attendance) => ({
    id: attendance.id,
    date: attendance.date.toISOString(),
    className: attendance.session?.class.name ?? 'Punch-in',
    present: attendance.present,
    notes: attendance.notes,
  }))
}

export async function getStudentAttendancePunchData(userId: string): Promise<StudentAttendancePunchData | null> {
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      attendances: {
        orderBy: { date: 'desc' },
        include: {
          confirmedBy: { select: { name: true } },
        },
      },
    },
  })

  if (!student) {
    return null
  }

  const confirmedCount = student.attendances.filter(({ status }) => status === 'CONFIRMED').length
  const pendingCount = student.attendances.filter(({ status }) => status === 'PENDING').length
  const totalHours = student.attendances
    .filter(({ status }) => status === 'CONFIRMED')
    .reduce((sum, { hoursTrained }) => sum + hoursTrained, 0)
  const targetAttendances = 30
  const attendancePercent = clampPercent(confirmedCount, targetAttendances)

  const records: AttendanceRecord[] = student.attendances.map((attendance) => ({
    id: attendance.id,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    date: attendance.date.toISOString(),
    hoursTrained: attendance.hoursTrained,
    sessionType: attendance.sessionType,
    status: attendance.status,
    present: attendance.present,
    confirmedByName: attendance.confirmedBy?.name ?? null,
    notes: attendance.notes,
    punchedAt: attendance.punchedAt.toISOString(),
  }))

  return {
    summary: {
      confirmedCount,
      pendingCount,
      totalHours: Number(totalHours.toFixed(1)),
      targetAttendances,
      attendancePercent,
    },
    records,
  }
}

export async function getStudentMonthlyStatus(userId: string, date = new Date()): Promise<StudentMonthlyStatus | null> {
  const { start, end } = monthRange(date)
  const student = await db.student.findUnique({
    where: { userId },
    select: {
      id: true,
      planId: true,
      planStartDate: true,
      scholarshipType: true,
      scholarshipNote: true,
      isCompetitor: true,
      plan: {
        select: {
          id: true,
          name: true,
          description: true,
          monthlyHours: true,
          price: true,
          isUnlimited: true,
          active: true,
          sortOrder: true,
        },
      },
      classEnrollments: {
        where: { status: 'ACTIVE' },
        select: { classId: true },
      },
      attendances: {
        where: { date: { gte: start, lt: end } },
        select: {
          id: true,
          date: true,
          present: true,
          status: true,
          hoursTrained: true,
          isOutOfSchedule: true,
          recovery: { select: { id: true } },
          class: { select: { name: true } },
          session: { select: { class: { select: { name: true } } } },
        },
      },
    },
  })

  if (!student) {
    return null
  }

  const confirmedHours = student.attendances
    .filter((attendance) => attendance.present && attendance.status === 'CONFIRMED')
    .reduce((sum, attendance) => sum + attendance.hoursTrained, 0)

  const balance = computeBalance({
    confirmedHours,
    planMonthlyHours: student.plan?.monthlyHours ?? null,
    isUnlimited: student.plan?.isUnlimited ?? false,
    scholarshipType: student.scholarshipType,
    isCompetitor: student.isCompetitor,
  })

  const justifiedAbsences = student.attendances
    .filter((attendance) => attendance.status === 'JUSTIFIED')
    .map((attendance) => ({
      id: attendance.id,
      date: attendance.date,
      recovery: attendance.recovery,
      className: attendance.class?.name ?? attendance.session?.class.name ?? null,
    }))

  const pending = pendingRecoveries(justifiedAbsences)

  return {
    plan: student.plan ? { ...student.plan, price: student.plan.price?.toNumber() ?? null } : null,
    planStartDate: student.planStartDate?.toISOString() ?? null,
    scholarshipType: student.scholarshipType,
    scholarshipNote: student.scholarshipNote,
    isCompetitor: student.isCompetitor,
    confirmedHours: Number(confirmedHours.toFixed(2)),
    expectedHours: balance.planHours,
    balanceDiff: balance.diff,
    balanceLevel: balance.level,
    balanceAlert: balance.alert,
    balanceMessage: balance.message,
    pendingRecoveries: pending.map((absence) => ({
      id: absence.id,
      date: absence.date.toISOString(),
      className: absence.className,
    })),
    outOfScheduleCount: student.attendances.filter((attendance) => attendance.isOutOfSchedule && attendance.status === 'CONFIRMED').length,
    needsPlan: !student.planId,
    needsSchedule: student.classEnrollments.length === 0,
  }
}

export async function getStudentSchedule(userId: string) {
  const student = await db.student.findUnique({
    where: { userId },
    select: {
      classEnrollments: {
        where: { status: ClassEnrollmentStatus.ACTIVE },
        orderBy: { class: { dayOfWeek: 'asc' } },
        select: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              instructor: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!student) {
    return null
  }

  return student.classEnrollments.map(({ class: scheduledClass }) => ({
    id: scheduledClass.id,
    name: scheduledClass.name,
    description: scheduledClass.description,
    dayOfWeek: scheduledClass.dayOfWeek,
    startTime: formatTime(scheduledClass.startTime),
    endTime: formatTime(scheduledClass.endTime),
    instructorName: scheduledClass.instructor?.name ?? null,
  }))
}

export async function getStudentDocuments(userId: string): Promise<StudentDocumentSummary[] | null> {
  const student = await db.student.findUnique({
    where: { userId },
    select: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
        select: { id: true, type: true, status: true, fileName: true, mimeType: true, fileSize: true, reviewNotes: true, uploadedAt: true },
      },
    },
  })

  if (!student) {
    return null
  }

  return student.documents.map((document) => ({ ...document, uploadedAt: document.uploadedAt.toISOString() }))
}

const BELT_COLORS: Record<string, string> = {
  'Amarillo': '#facc15',
  'Naranja': '#f97316',
  'Morado': '#9c27b0',
  'Verde': '#16a34a',
  'Azul': '#2563eb',
  'Marrón': '#6b4226',
  'Café': '#795548',
  'Negro': '#17181a',
  'Blanco': '#e5e7eb',
}

function beltColorFor(name: string | null): string | null {
  if (!name) return null
  const lower = name.toLocaleLowerCase('es')
  const key = Object.keys(BELT_COLORS).find((color) => lower.includes(color.toLocaleLowerCase('es')))
  return key ? BELT_COLORS[key] : null
}

function constructorStatus(approved: boolean, inPractice: boolean): KataStatus {
  if (approved) return 'APPROVED'
  if (inPractice) return 'IN_PROGRESS'
  return 'PENDING'
}

function clampPercent(value: number, goal: number): number {
  return goal <= 0 ? 0 : Math.min(100, Math.round((value / goal) * 100))
}

export async function getStudentKataProgress(userId: string): Promise<StudentKataProgressSummary | null> {
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      techniques: {
        include: {
          technique: {
            include: {
              beltRankKatas: { include: { beltRank: { select: { name: true } } } },
            },
          },
          evaluation: { include: { evaluator: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
      attendances: { select: { present: true, status: true } },
      rankHistory: { orderBy: { promotedAt: 'desc' }, take: 1 },
    },
  })

  if (!student) {
    return null
  }

  const ranks = await db.beltRank.findMany({
    where: { OR: [{ schoolId: student.schoolId }, { schoolId: null }] },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      program: true,
      kyuDan: true,
      beltColor: true,
      order: true,
      minMonths: true,
      minAttendancePercent: true,
      katas: { select: { kataId: true }, orderBy: { order: 'asc' } },
    },
  })
  const currentProgram = programForAge(ageFromDob(student.dateOfBirth))
  const currentRank =
    ranks.find(({ name }) => name === student.currentRank) ??
    ranks.find(({ program, order }) => program === currentProgram && order === 1) ??
    null
  const nextRank = currentRank ? ranks.find(({ order }) => order === currentRank.order + 1) ?? null : null
  const gradeKataIds = currentRank?.katas.map(({ kataId }) => kataId) ?? []

  // Solo las asistencias confirmadas cuentan para el avance (PENDING aún no es válido).
  const attendedSessions = student.attendances.filter(({ present, status }) => present && status === 'CONFIRMED').length
  const totalSessions = student.attendances.length
  const attendancePercent = totalSessions === 0 ? 0 : Math.round((attendedSessions / totalSessions) * 100)
  const minAttendancePercent = currentRank?.minAttendancePercent ?? 80
  const minMonths = currentRank?.minMonths ?? 6

  const gradeStart = student.rankHistory[0]?.promotedAt ?? student.enrollmentDate
  const monthsInRank = Math.max(0, Math.floor((Date.now() - gradeStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))

  const katas = student.techniques
    .filter(({ technique }) => technique.category === 'KATA')
    .map(({ technique, approved, inPractice, practiceHours, lastPracticeDate, notes, evaluation, approvedAt }) => {
      const requiredForGrade = gradeKataIds.includes(technique.id)
      return {
        id: technique.id,
        name: technique.name,
        description: technique.description,
        status: constructorStatus(approved, inPractice),
        practiceHours,
        score: evaluation?.score ?? null,
        lastFeedback: notes,
        lastPracticeDate: lastPracticeDate?.toISOString() ?? approvedAt?.toISOString() ?? null,
        evaluatedBy: evaluation?.evaluator.name ?? null,
        rankName: technique.beltRankKatas[0]?.beltRank.name ?? null,
        requiredForGrade,
      } satisfies KataProgressItem
    })

  const gradeKataIdsSet = new Set(gradeKataIds)
  const approvedKatas = katas.filter(({ id, status }) => gradeKataIdsSet.has(id) && status === 'APPROVED').length
  const totalRequiredKatas = gradeKataIds.length
  const kataPercent = totalRequiredKatas === 0 ? 0 : clampPercent(approvedKatas, totalRequiredKatas)
  const attendanceCriteriaPercent = clampPercent(attendancePercent, minAttendancePercent)
  const monthsPercent = clampPercent(monthsInRank, minMonths)
  const overallPercent = Math.round((kataPercent + attendanceCriteriaPercent + monthsPercent) / 3)
  const isEligible = kataPercent === 100 && attendanceCriteriaPercent === 100 && monthsPercent === 100

  const grado: GradoProgressData = {
    currentRankName: currentRank?.name ?? student.currentRank ?? null,
    currentRankOrder: currentRank?.order ?? null,
    nextRankName: nextRank?.name ?? null,
    beltColor: currentRank?.beltColor ?? beltColorFor(currentRank?.name ?? student.currentRank),
    approvedKatas,
    requiredKatas: totalRequiredKatas,
    attendance: { attendedSessions, totalSessions, percentage: attendancePercent },
    minAttendancePercent,
    monthsInRank,
    minMonths,
    overallPercent,
    isEligible,
  }

  return { grado, katas }
}