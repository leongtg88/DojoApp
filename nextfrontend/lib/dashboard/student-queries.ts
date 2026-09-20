import { db } from '@/lib/db'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { ageFromDob, programForAge, resolveDefaultRank } from '@/lib/dashboard/program'
import { computeBalance, formatTime, monthRange, pendingRecoveries } from '@/lib/dashboard/balance'
import { introLevelFromBeltRankKatas } from '@/lib/dashboard/kata-level'
import { buildHolidaySet } from '@/lib/dashboard/holidays'
import { monthsForGrade } from '@/lib/dashboard/rank-months'
import { targetRepetitionsFor } from '@/lib/dashboard/technique-reps'
import { cuatrimestreForDate, nextCuatrimestre, tentativeExamDate, type Cuatrimestre, type ExamDayValue } from '@/lib/dashboard/cuatrimestre'
import { availableTrainingHours, type TrainingAudience, type TrainingScheduleClass } from '@/lib/dashboard/training-hours'
import type {
  StudentAttendanceRecord,
  StudentAttendancePunchData,
  StudentDashboardSummary,
  StudentDocumentSummary,
  StudentKataProgressSummary,
  KataStatus,
  GradoProgressData,
  GradoMetric,
  CuatrimestreProgress,
  GradeHoursRequirement,
  CurrentPeriod,
  MonthAbsence,
  NextExamInfo,
  KataProgressItem,
  TechniqueStatus,
  AttendanceRecord,
  StudentMonthlyStatus,
} from '@/types/dashboard'

const MAX_ABSENCES_PER_MONTH = 2

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
      classEnrollments: {
        where: { status: ClassEnrollmentStatus.ACTIVE },
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
    techniques: student.techniques.map(({ approved, approvedAt, inPractice, notes, practiceHours, practiceRepetitions, technique, evaluation }) => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      category: technique.category,
      level: null,
      beltColor: null,
      beltSecondaryColor: null,
      status: techniqueStatus(approved, inPractice),
      approvedAt: approvedAt?.toISOString() ?? null,
      notes,
      practiceHours,
      practiceRepetitions,
      targetRepetitions: targetRepetitionsFor(technique),
      evaluation: evaluation ? {
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluatedAt: evaluation.evaluatedAt.toISOString(),
        evaluatorName: evaluation.evaluator.name,
      } : null,
    })),
    upcomingClasses: student.classEnrollments
      .map(({ class: scheduledClass }) => ({
        id: scheduledClass.id,
        name: scheduledClass.name,
        description: scheduledClass.description,
        dayOfWeek: scheduledClass.dayOfWeek,
        startTime: formatTime(scheduledClass.startTime),
        endTime: formatTime(scheduledClass.endTime),
        instructorName: scheduledClass.instructor?.name ?? null,
      }))
      .sort((a, b) => {
        const dayDelta = a.dayOfWeek - b.dayOfWeek
        return dayDelta !== 0 ? dayDelta : a.startTime.localeCompare(b.startTime)
      }),
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
      techniques: {
        select: {
          practiceRepetitions: true,
          technique: {
            select: { id: true, name: true, category: true, repetitionsCount: true, movementsCount: true },
          },
        },
        orderBy: { technique: { name: 'asc' } },
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
    availableTechniques: student.techniques.map(({ practiceRepetitions, technique }) => ({
      id: technique.id,
      name: technique.name,
      category: technique.category,
      targetRepetitions: targetRepetitionsFor(technique),
      practiceRepetitions,
    })),
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

function normalizeMetric(value: number, goal: number): { percent: number; applicable: boolean } {
  if (goal <= 0) return { percent: 100, applicable: false }
  return { percent: Math.min(100, Math.round((value / goal) * 100)), applicable: true }
}

function clampPercent(value: number, goal: number): number {
  return goal <= 0 ? 0 : Math.min(100, Math.round((value / goal) * 100))
}

/**
 * Meses de calendario tocados por [start, end), con tope de `max`. Se usa para
 * prorratear el mínimo de horas del plan cuando el cuatrimestre arranca a mitad
 * (p. ej. el primero desde la matrícula).
 */
function monthsCovered(start: Date, end: Date, max = 4): number {
  let count = 0
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor.getTime() < end.getTime() && count < max) {
    count += 1
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return count
}

/** Meses transcurridos (fraccional) entre dos fechas, con mes promedio de 30.44 días. */
function mesesElapsed(start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) return 0
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

export async function getStudentKataProgress(userId: string): Promise<StudentKataProgressSummary | null> {
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      plan: { select: { monthlyHours: true, isUnlimited: true } },
      techniques: {
        include: {
          technique: {
            include: {
              beltRankKatas: {
                select: {
                  order: true,
                  beltRank: { select: { name: true, program: true, order: true, beltColor: true, beltSecondaryColor: true } },
                },
                orderBy: [{ beltRank: { program: 'asc' } }, { beltRank: { order: 'asc' } }],
              },
            },
          },
          evaluation: { include: { evaluator: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
      attendances: { select: { date: true, present: true, status: true, hoursTrained: true, recoveredById: true, sessionType: true, classId: true } },
      rankHistory: { orderBy: { promotedAt: 'desc' }, select: { beltRankId: true, promotedAt: true } },
      classEnrollments: { where: { status: 'ACTIVE' }, select: { classId: true } },
    },
  })

  if (!student) {
    return null
  }

  const ranks = await db.beltRank.findMany({
    where: { OR: [{ schoolId: student.schoolId }, { schoolId: null }] },
    orderBy: [{ program: 'asc' }, { order: 'asc' }],
    select: {
      id: true,
      name: true,
      program: true,
      kyuDan: true,
      beltColor: true,
      order: true,
      isMaximumRank: true,
      minMonths: true,
      minAttendancePercent: true,
      examDay: true,
      schoolId: true,
      katas: { select: { kataId: true }, orderBy: { order: 'asc' } },
    },
  })

  const currentProgram = programForAge(ageFromDob(student.dateOfBirth))
  const audience: TrainingAudience = currentProgram === 'ADULT' ? 'ADULTS' : 'CHILDREN'

  // Prefiere siempre el grado propio de la escuela sobre el global, y nunca
  // cruza programas (kids vs adultos).
  const pickRank = (predicate: (rank: (typeof ranks)[number]) => boolean) => {
    const candidates = ranks.filter(predicate)
    return candidates.find((rank) => rank.schoolId === student.schoolId) ?? candidates.find((rank) => rank.schoolId === null) ?? candidates[0] ?? null
  }

  const currentRank =
    (student.currentRankId ? ranks.find((rank) => rank.id === student.currentRankId) ?? null : null) ??
    (student.currentRank ? pickRank((rank) => rank.name === student.currentRank && rank.program === currentProgram) : null) ??
    pickRank((rank) => rank.program === currentProgram && rank.order === 1)

  const nextRank =
    currentRank && !currentRank.isMaximumRank
      ? pickRank((rank) => rank.program === currentRank.program && rank.order === currentRank.order + 1)
      : null

  const gradeKataIds = currentRank?.katas.map(({ kataId }) => kataId) ?? []
  const gradeKataIdsSet = new Set(gradeKataIds)

  // Permanencia: desde el ascenso al grado actual. Si no hay historial propio,
  // cae a la matriculación pero se marca como estimado.
  const matchingHistory = student.rankHistory.find((entry) => entry.beltRankId === currentRank?.id)
  const gradeStart = matchingHistory?.promotedAt ?? student.rankHistory[0]?.promotedAt ?? student.enrollmentDate
  const monthsInRankEstimated = !matchingHistory
  const today = new Date()
  const monthsInRank = Math.max(0, Math.floor((today.getTime() - gradeStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))

  const minAttendancePercent = currentRank?.minAttendancePercent ?? 80
  // `minMonths` del currículum de kyu es acumulado desde Blanco; el tramo del
  // grado actual es la diferencia con el siguiente (los dan ya son "desde anterior").
  const minMonths = monthsForGrade(currentRank, nextRank)

  // Asistencia de clase vs horas de práctica. Solo confirmadas cuentan; las
  // faltas confirmadas o justificadas sin recuperar son inasistencias.
  const referenceClassIds = new Set(student.classEnrollments.map((entry) => entry.classId))
  const isClassAttendance = (attendance: {
    sessionType: string | null
    classId: string | null
  }) => attendance.sessionType === 'class' && attendance.classId != null && referenceClassIds.has(attendance.classId)

  const scopedAttendances = student.attendances.filter((attendance) => attendance.date.getTime() >= gradeStart.getTime())
  const confirmedRecords = scopedAttendances.filter((attendance) => attendance.present && attendance.status === 'CONFIRMED')
  const classRecords = confirmedRecords.filter(isClassAttendance)
  const absenceRecords = scopedAttendances.filter(
    (attendance) => !attendance.present && (attendance.status === 'CONFIRMED' || attendance.status === 'JUSTIFIED') && !attendance.recoveredById,
  )

  const classSessionsGrade = classRecords.length

  const approvedKatas = student.techniques.filter(({ technique, approved }) => gradeKataIdsSet.has(technique.id) && approved).length
  const totalRequiredKatas = gradeKataIds.length

  const kataMetric = normalizeMetric(approvedKatas, totalRequiredKatas)
  const monthsMetric = normalizeMetric(monthsInRank, minMonths)

  const applicableMetrics: { key: GradoMetric; percent: number }[] = []
  if (kataMetric.applicable) applicableMetrics.push({ key: 'KATAS', percent: kataMetric.percent })
  if (monthsMetric.applicable) applicableMetrics.push({ key: 'PERMANENCIA', percent: monthsMetric.percent })

  const katas = student.techniques
    .filter(({ technique }) => technique.category === 'KATA')
    .map(({ technique, approved, inPractice, practiceHours, practiceRepetitions, lastPracticeDate, notes, evaluation, approvedAt }) => {
      const requiredForGrade = gradeKataIdsSet.has(technique.id)
      const level = introLevelFromBeltRankKatas(technique.beltRankKatas, currentProgram)
      return {
        id: technique.id,
        name: technique.name,
        description: technique.description,
        status: constructorStatus(approved, inPractice),
        practiceHours,
        practiceRepetitions,
        targetRepetitions: targetRepetitionsFor(technique),
        score: evaluation?.score ?? null,
        lastFeedback: notes,
        lastPracticeDate: lastPracticeDate?.toISOString() ?? approvedAt?.toISOString() ?? null,
        evaluatedBy: evaluation?.evaluator.name ?? null,
        rankName: level?.rankName ?? null,
        level: level?.level ?? null,
        beltColor: level?.beltColor ?? null,
        beltSecondaryColor: level?.beltSecondaryColor ?? null,
        requiredForGrade,
      } satisfies KataProgressItem
    })

  // ============ Calendario: cuatrimestres, horas y convocatoria ============
  const [activeClasses, holidayRows, convocations] = await Promise.all([
    db.class.findMany({
      where: { branchId: student.branchId, active: true },
      select: { id: true, name: true, audience: true, dayOfWeek: true, startTime: true, endTime: true },
    }),
    db.holiday.findMany({
      where: { OR: [{ schoolId: student.schoolId }, { schoolId: null }] },
      select: { date: true, recurring: true },
    }),
    db.examConvocation.findMany({
      where: { schoolId: student.schoolId, confirmed: true },
      select: { date: true, examDay: true, label: true },
    }),
  ])

  // Capacidad basada en los horarios de referencia del alumno; si no tiene
  // ninguno asignado, se usa el catálogo de su audiencia como respaldo.
  const referenceClasses = activeClasses.filter((scheduledClass) => referenceClassIds.has(scheduledClass.id))
  const scheduleSource = referenceClasses.length > 0 ? referenceClasses : activeClasses

  const scheduleClasses: TrainingScheduleClass[] = scheduleSource.map((scheduledClass) => ({
    id: scheduledClass.id,
    name: scheduledClass.name,
    audience: scheduledClass.audience,
    dayOfWeek: scheduledClass.dayOfWeek,
    startTime: formatTime(scheduledClass.startTime),
    endTime: formatTime(scheduledClass.endTime),
  }))

  const examDay = ((nextRank?.examDay ?? currentRank?.examDay ?? null) as ExamDayValue | null)

  const cuatrimestreCount = Math.max(1, Math.ceil(Math.max(minMonths, 1) / 4))
  const blocks: Cuatrimestre[] = []
  let cursorBlock = cuatrimestreForDate(gradeStart)
  for (let index = 0; index < cuatrimestreCount; index += 1) {
    blocks.push(cursorBlock)
    cursorBlock = nextCuatrimestre(cursorBlock)
  }

  const rangeStart = blocks[0]?.start ?? gradeStart
  const rangeEnd = blocks[blocks.length - 1]?.end ?? today
  const holidays = buildHolidaySet(holidayRows, rangeStart, rangeEnd)

  const confirmedExamFor = (cuatrimestre: Cuatrimestre): Date | null => {
    if (!examDay) return null
    return (
      convocations
        .filter((convocation) => convocation.examDay === examDay && convocation.date >= cuatrimestre.start && convocation.date < cuatrimestre.end)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0]?.date ?? null
    )
  }

  const requiredTechniques = student.techniques.filter(({ technique }) => gradeKataIdsSet.has(technique.id))
  const baseExpected = Math.floor(totalRequiredKatas / cuatrimestreCount)
  const expectedRemainder = totalRequiredKatas % cuatrimestreCount

  // Mínimo de horas del plan: ilimitado o sin plan quedan exentos.
  const planMonthlyHours = student.plan?.monthlyHours ?? null
  const hoursExempt = student.plan == null || student.plan.isUnlimited || planMonthlyHours == null || planMonthlyHours <= 0

  const approvedBy = (endExclusive: Date): number =>
    requiredTechniques.filter(({ approved, approvedAt }) => {
      if (!approved) return false
      return (approvedAt ?? today).getTime() < endExclusive.getTime()
    }).length

  let cumulativeExpected = 0
  const cuatrimestres: CuatrimestreProgress[] = blocks.map((block, index) => {
    cumulativeExpected += baseExpected + (index < expectedRemainder ? 1 : 0)

    const effectiveStart = block.start.getTime() < gradeStart.getTime() ? gradeStart : block.start
    const available = availableTrainingHours(scheduleClasses, { audience, start: effectiveStart, end: block.end, holidays })
    const blockConfirmed = confirmedRecords.filter((attendance) => attendance.date >= effectiveStart && attendance.date < block.end)
    const blockClass = classRecords.filter((attendance) => attendance.date >= effectiveStart && attendance.date < block.end)
    const classHours = Number(blockClass.reduce((sum, attendance) => sum + attendance.hoursTrained, 0).toFixed(2))
    const classSessions = blockClass.length
    const extraHours = Number((blockConfirmed.reduce((sum, attendance) => sum + attendance.hoursTrained, 0) - classHours).toFixed(2))
    const extraClasses = blockConfirmed.filter(
      (attendance) => attendance.sessionType === 'class' && (attendance.classId == null || !referenceClassIds.has(attendance.classId)),
    ).length

    const requiredHours = hoursExempt ? null : Number((planMonthlyHours * monthsCovered(effectiveStart, block.end)).toFixed(2))
    const capacityHours = available.hours
    const capacitySessions = available.sessions
    const hoursMet = requiredHours == null || classHours >= requiredHours

    const blockAbsences = absenceRecords.filter((attendance) => attendance.date >= effectiveStart && attendance.date < block.end)
    const monthCounts = new Map<string, { count: number; label: string }>()
    for (const absence of blockAbsences) {
      const key = `${absence.date.getFullYear()}-${absence.date.getMonth()}`
      const label = absence.date.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
      const current = monthCounts.get(key)
      if (current) current.count += 1
      else monthCounts.set(key, { count: 1, label })
    }

    let maxMonthAbsences = 0
    let excessMonth: string | null = null
    const monthAbsences: MonthAbsence[] = []
    for (const { count, label } of monthCounts.values()) {
      monthAbsences.push({ label, count, max: MAX_ABSENCES_PER_MONTH })
      if (count > maxMonthAbsences) {
        maxMonthAbsences = count
        excessMonth = label
      }
    }

    const confirmed = confirmedExamFor(block)
    const examDate = confirmed ?? (examDay ? tentativeExamDate(block, examDay) : null)
    const lastDay = new Date(block.end)
    lastDay.setDate(lastDay.getDate() - 1)

    return {
      year: block.year,
      index: block.index,
      label: block.label,
      start: block.start.toISOString(),
      end: lastDay.toISOString(),
      expectedKatas: cumulativeExpected,
      approvedKatas: approvedBy(block.end),
      requiredHours,
      capacityHours,
      capacitySessions,
      classHours,
      classSessions,
      extraHours,
      extraClasses,
      hoursMet,
      hoursExempt,
      absences: blockAbsences.length,
      monthAbsences,
      maxMonthAbsences,
      excessMonth,
      exceededAbsenceLimit: maxMonthAbsences > MAX_ABSENCES_PER_MONTH,
      isCurrent: today >= block.start && today < block.end,
      isFuture: block.start.getTime() > today.getTime(),
      examDate: examDate ? examDate.toISOString() : null,
      examTentative: examDate != null && confirmed == null,
    } satisfies CuatrimestreProgress
  })

  const examRightLost = cuatrimestres.some((cuatrimestre) => !cuatrimestre.isFuture && cuatrimestre.exceededAbsenceLimit)
  const examBlock =
    cuatrimestres.find((cuatrimestre) => cuatrimestre.examDate && new Date(cuatrimestre.examDate).getTime() >= today.getTime()) ??
    cuatrimestres[cuatrimestres.length - 1]

  const nextExam: NextExamInfo | null =
    examBlock && examDay
      ? {
          date: (examBlock.examDate ? new Date(examBlock.examDate) : tentativeExamDate(
            blocks[cuatrimestres.indexOf(examBlock)] ?? blocks[blocks.length - 1],
            examDay,
          )).toISOString(),
          examDay,
          cuatrimestreLabel: examBlock.label,
          tentative: examBlock.examTentative,
        }
      : null

  // Requisito de tatami (opción A): las horas de clase cumplen el mínimo; las
  // horas extra (casa/fuera de horario) quedan como ponderables y el excedente
  // de grados previos se descuenta de la meta.
  const examIndex = examBlock ? cuatrimestres.indexOf(examBlock) : -1
  const hoursBlocks = examIndex >= 0 ? cuatrimestres.slice(0, examIndex + 1) : cuatrimestres
  const classHoursTramo = Number(hoursBlocks.reduce((sum, block) => sum + block.classHours, 0).toFixed(2))
  const extraHoursTramo = Number(hoursBlocks.reduce((sum, block) => sum + block.extraHours, 0).toFixed(2))
  const hoursCapacity = Number(hoursBlocks.reduce((sum, block) => sum + block.capacityHours, 0).toFixed(2))
  const hoursLabel = hoursBlocks.length > 1
    ? `${hoursBlocks[0].label} – ${hoursBlocks[hoursBlocks.length - 1].label}`
    : examBlock?.label ?? 'Cuatrimestre actual'

  const examBoundary = examIndex >= 0 ? blocks[examIndex].end : today

  // Crédito heredado de grados previos (todo lo confirmado antes de gradeStart).
  const attendedBefore = student.attendances.filter(
    (attendance) => attendance.present && attendance.status === 'CONFIRMED' && attendance.date.getTime() < gradeStart.getTime(),
  )
  const attendedHoursBefore = attendedBefore.reduce((sum, attendance) => sum + attendance.hoursTrained, 0)
  const requiredHoursBefore = hoursExempt ? null : planMonthlyHours * mesesElapsed(student.enrollmentDate, gradeStart)
  const creditHours = requiredHoursBefore == null ? 0 : Math.max(0, Number((attendedHoursBefore - requiredHoursBefore).toFixed(2)))

  // Tramo del grado actual.
  const requiredHoursTramo = hoursExempt ? null : Number((planMonthlyHours * mesesElapsed(gradeStart, examBoundary)).toFixed(2))
  const effectiveRequiredHours = requiredHoursTramo == null ? null : Math.max(0, Number((requiredHoursTramo - creditHours).toFixed(2)))
  const hoursMet = effectiveRequiredHours == null || classHoursTramo >= effectiveRequiredHours

  const hoursRequirement: GradeHoursRequirement | null = examBlock
    ? {
        classHours: classHoursTramo,
        requiredHours: requiredHoursTramo,
        effectiveRequiredHours,
        extraHours: extraHoursTramo,
        creditHours,
        capacityHours: hoursCapacity,
        label: hoursLabel,
        exempt: hoursExempt,
        met: hoursMet,
      }
    : null

  if (hoursRequirement && !hoursRequirement.exempt && hoursRequirement.effectiveRequiredHours != null) {
    applicableMetrics.push({
      key: 'HORAS',
      percent: normalizeMetric(hoursRequirement.classHours, hoursRequirement.effectiveRequiredHours).percent,
    })
  }

  const overallPercent =
    applicableMetrics.length === 0
      ? 100
      : Math.round(applicableMetrics.reduce((sum, metric) => sum + metric.percent, 0) / applicableMetrics.length)
  const bottleneck =
    applicableMetrics.filter((metric) => metric.percent < 100).sort((a, b) => a.percent - b.percent)[0]?.key ?? null

  const allApplicableMet = applicableMetrics.every((metric) => metric.percent === 100)
  const isEligible = allApplicableMet && !examRightLost && nextRank != null

  const capacitySessionsGrade = cuatrimestres.reduce((sum, cuatrimestre) => sum + cuatrimestre.capacitySessions, 0)
  const currentBlock =
    cuatrimestres.find((cuatrimestre) => cuatrimestre.isCurrent) ?? [...cuatrimestres].reverse().find((cuatrimestre) => !cuatrimestre.isFuture) ?? null

  const currentPeriod: CurrentPeriod | null = currentBlock
    ? {
        label: currentBlock.label,
        classSessions: currentBlock.classSessions,
        capacitySessions: currentBlock.capacitySessions,
        classHours: currentBlock.classHours,
        requiredHours: currentBlock.requiredHours,
        extraHours: currentBlock.extraHours,
        extraClasses: currentBlock.extraClasses,
        creditHours: hoursRequirement?.creditHours ?? 0,
        monthAbsences: currentBlock.monthAbsences,
        totalAbsences: currentBlock.absences,
        maxAbsencesTotal: MAX_ABSENCES_PER_MONTH * 4,
        exempt: currentBlock.hoursExempt,
        met: currentBlock.hoursMet,
      }
    : null

  const grado: GradoProgressData = {
    currentRankName: currentRank?.name ?? student.currentRank ?? null,
    currentRankOrder: currentRank?.order ?? null,
    nextRankName: nextRank?.name ?? null,
    beltColor: currentRank?.beltColor ?? beltColorFor(currentRank?.name ?? student.currentRank),
    approvedKatas,
    requiredKatas: totalRequiredKatas,
    attendance: {
      attendedSessions: classSessionsGrade,
      totalSessions: capacitySessionsGrade,
      percentage: capacitySessionsGrade > 0 ? Math.round((classSessionsGrade / capacitySessionsGrade) * 100) : 0,
    },
    minAttendancePercent,
    monthsInRank,
    monthsInRankEstimated,
    minMonths,
    overallPercent,
    isEligible,
    examDay,
    nextExam,
    cuatrimestres,
    hoursRequirement,
    currentPeriod,
    maxAbsencesPerMonth: MAX_ABSENCES_PER_MONTH,
    examRightLost,
    bottleneck,
  }

  return { grado, katas }
}