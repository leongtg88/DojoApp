import { db } from '@/lib/db'
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

  const rank = student.currentRank
    ? await db.beltRank.findFirst({
        where: {
          name: student.currentRank,
          OR: [{ schoolId: student.schoolId }, { schoolId: null }],
        },
        select: {
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
        },
      })
    : null

  const attendedSessions = student.attendances.filter(({ present, status }) => present && status !== 'REJECTED').length
  const totalSessions = student.attendances.length

  return {
    profile: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
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

export async function getStudentSchedule(userId: string) {
  const student = await db.student.findUnique({
    where: { userId },
    select: {
      classEnrollments: {
        where: { status: 'ACTIVE' },
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
    startTime: scheduledClass.startTime,
    endTime: scheduledClass.endTime,
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
  'Blanco': '#e5e7eb',
  'Amarillo': '#facc15',
  'Naranja': '#f97316',
  'Verde': '#16a34a',
  'Azul': '#2563eb',
  'Marrón': '#6b4226',
  'Negro': '#17181a',
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
  return goal <= 0 ? 100 : Math.min(100, Math.round((value / goal) * 100))
}

export async function getStudentKataProgress(userId: string): Promise<StudentKataProgressSummary | null> {
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      techniques: {
        include: {
          technique: { include: { rank: true } },
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
    select: { id: true, name: true, kyuDan: true, beltColor: true, order: true, minMonths: true, minAttendancePercent: true },
  })
  const currentRank = ranks.find(({ name }) => name === student.currentRank) ?? null
  const nextRank = currentRank ? ranks.find(({ order }) => order === currentRank.order + 1) ?? null : null

  const attendedSessions = student.attendances.filter(({ present, status }) => present && status !== 'REJECTED').length
  const totalSessions = student.attendances.length
  const attendancePercent = totalSessions === 0 ? 0 : Math.round((attendedSessions / totalSessions) * 100)
  const minAttendancePercent = currentRank?.minAttendancePercent ?? 80
  const minMonths = currentRank?.minMonths ?? 6

  const gradeStart = student.rankHistory[0]?.promotedAt ?? student.enrollmentDate
  const monthsInRank = Math.max(0, Math.floor((Date.now() - gradeStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))

  const katas = student.techniques
    .filter(({ technique }) => technique.category === 'KATA')
    .map(({ technique, approved, inPractice, practiceHours, lastPracticeDate, notes, evaluation, approvedAt }) => {
      const requiredForGrade = Boolean(technique.rankId)
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
        rankName: technique.rank?.name ?? null,
        requiredForGrade,
      } satisfies KataProgressItem
    })

  const requiredKatas = katas.filter(({ requiredForGrade }) => requiredForGrade)
  const approvedKatas = requiredKatas.filter(({ status }) => status === 'APPROVED').length
  const kataPercent = clampPercent(approvedKatas, requiredKatas.length)
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
    requiredKatas: requiredKatas.length,
    attendance: { attendedSessions, totalSessions, percentage: attendancePercent },
    minAttendancePercent,
    monthsInRank,
    minMonths,
    overallPercent,
    isEligible,
  }

  return { grado, katas }
}