import { db } from '@/lib/db'
import { createPrivateDocumentUrl } from '@/lib/document-storage'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { ageFromDob, programForAge, resolveDefaultRank } from '@/lib/dashboard/program'
import { computeBalance, formatTime, monthRange } from '@/lib/dashboard/balance'
import { FREE_ABSENCES_PER_MONTH, evaluateExamRight, resolveAbsencePolicyAt, summarizeMonthlyAbsences } from '@/lib/dashboard/absence-policy'
import { listAbsencePolicyPoints } from '@/lib/dashboard/absence-policy-settings'
import { formatMonthKey, toCalendarKey } from '@/lib/format/datetime'
import { santoDomingoDayKey, toDateKey } from '@/lib/dashboard/schedule-utils'
import { introLevelFromBeltRankKatas } from '@/lib/dashboard/kata-level'
import { parseKataCriteria } from '@/lib/dashboard/kata-rubric'
import { buildHolidaySet } from '@/lib/dashboard/holidays'
import { monthsForGrade } from '@/lib/dashboard/rank-months'
import { targetRepetitionsFor } from '@/lib/dashboard/technique-reps'
import { listStudentAbsenceJustifications } from '@/lib/dashboard/absence-justifications'
import { listStudentOnlineRecoveries } from '@/lib/dashboard/online-recovery'
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
  ClassSchedule,
  MonthlyProgressInfo,
  AttendanceMonthProgress,
  StudentPracticeKataLevel,
  StudentPracticeTechniqueOption,
} from '@/types/dashboard'

function techniqueStatus(approved: boolean, inPractice: boolean): TechniqueStatus {
  if (approved) return 'APPROVED'
  if (inPractice) return 'IN_PROGRESS'
  return 'PENDING'
}

/**
 * Lee el opt-in de WhatsApp de forma aislada y tolerante a fallos. Se consulta
 * aparte del resumen principal para que una migración pendiente de la tabla
 * WhatsAppContact no tumbe el dashboard del alumno (resumen, perfil, progreso).
 */
async function getWhatsappOptInSafe(userId: string | null): Promise<boolean> {
  if (!userId) return false
  try {
    const contact = await db.whatsAppContact.findUnique({
      where: { userId },
      select: { optIn: true },
    })
    return contact?.optIn ?? false
  } catch {
    return false
  }
}

export async function getStudentDashboardSummary(
  studentId: string,
): Promise<StudentDashboardSummary | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { email: true } },
      guardian: { select: { name: true, phone: true } },
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

  // Foto de perfil (URL firmada) y datos del tutor responsable, útiles cuando un
  // padre/tutor consulta el perfil de su hijo.
  let photoUrl: string | null = null
  if (student.photoKey) {
    try {
      photoUrl = await createPrivateDocumentUrl(student.photoKey, 600)
    } catch {
      photoUrl = null
    }
  }
  const registrationData = (student.registrationData ?? {}) as Record<string, unknown>
  const guardianMeta =
    registrationData.guardian && typeof registrationData.guardian === 'object' && !Array.isArray(registrationData.guardian)
      ? (registrationData.guardian as { name?: string; relationship?: string })
      : null

  const whatsappOptIn = await getWhatsappOptInSafe(student.userId)

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
      photoUrl,
      guardianName: student.guardian?.name ?? guardianMeta?.name ?? null,
      guardianRelationship: guardianMeta?.relationship ?? null,
      guardianPhone: student.guardian?.phone ?? null,
      medicalInfo: student.medicalInfo,
      emergencyContact: student.emergencyContact,
      giSize: student.giSize,
      beltSize: student.beltSize,
      enrollmentDate: student.enrollmentDate.toISOString(),
      whatsappOptIn,
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
      kihonCategory: technique.kihonCategory,
      kumiteCategory: technique.kumiteCategory,
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
        criteria: parseKataCriteria(evaluation.criteria),
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

export async function getStudentAttendanceHistory(studentId: string): Promise<StudentAttendanceRecord[] | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
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

export async function getStudentAttendancePunchData(studentId: string): Promise<StudentAttendancePunchData | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      attendances: {
        orderBy: { date: 'desc' },
        include: {
          confirmedBy: { select: { name: true } },
          class: { select: { name: true } },
          session: { select: { class: { select: { name: true } } } },
          practiceLogs: {
            select: {
              id: true,
              techniqueId: true,
              repetitions: true,
              place: true,
              studentTechnique: { select: { technique: { select: { id: true, name: true } } } },
              technique: { select: { id: true, name: true } },
            },
          },
        },
      },
      techniques: {
        select: {
          practiceRepetitions: true,
          technique: {
            select: { id: true, name: true, japaneseName: true, category: true, repetitionsCount: true, movementsCount: true, kihonCategory: true, kumiteCategory: true },
          },
        },
        orderBy: { technique: { name: 'asc' } },
      },
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
    sessionId: attendance.sessionId,
    className: attendance.class?.name ?? attendance.session?.class.name ?? null,
    practiceLogs: attendance.practiceLogs.map((log) => ({
      id: log.id,
      techniqueId: log.studentTechnique?.technique.id ?? log.technique?.id ?? log.techniqueId ?? null,
      techniqueName: log.studentTechnique?.technique.name ?? log.technique?.name ?? 'Técnica',
      repetitions: log.repetitions,
      place: log.place,
    })),
  }))

  // Todo el catálogo de la escuela (más el global). El alumno puede registrar
  // repeticiones de cualquier técnica: las que están en su expediente suman a su
  // experiencia; las demás quedan como registro libre (no tocan el expediente).
  const schoolTechniques = await db.technique.findMany({
    where: { OR: [{ schoolId: student.schoolId }, { schoolId: null }] },
    orderBy: [{ category: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      japaneseName: true,
      category: true,
      order: true,
      kihonCategory: true,
      kumiteCategory: true,
      repetitionsCount: true,
      movementsCount: true,
      beltRankKatas: {
        select: {
          order: true,
          beltRank: { select: { name: true, program: true, order: true, kyuDan: true, beltColor: true, beltSecondaryColor: true } },
        },
      },
    },
  })

  const assignedRepetitions = new Map(
    student.techniques.map(({ practiceRepetitions, technique }) => [technique.id, practiceRepetitions]),
  )

  const programs: Array<'YOUTH' | 'ADULT'> = ['YOUTH', 'ADULT']

  const practiceTechniques: StudentPracticeTechniqueOption[] = schoolTechniques.map((technique) => ({
    id: technique.id,
    name: technique.name,
    japaneseName: technique.japaneseName,
    category: technique.category,
    order: technique.order,
    kihonCategory: technique.kihonCategory,
    kumiteCategory: technique.kumiteCategory,
    targetRepetitions: targetRepetitionsFor(technique),
    practiceRepetitions: assignedRepetitions.get(technique.id) ?? 0,
    assigned: assignedRepetitions.has(technique.id),
    kataLevels: technique.category === 'KATA'
      ? programs
        .map((program) => {
          const info = introLevelFromBeltRankKatas(technique.beltRankKatas, program)
          if (!info) return null
          return {
            program,
            rankName: info.rankName,
            kyuDan: info.kyuDan,
            order: info.gradeOrder,
            level: info.level,
            beltColor: info.beltColor,
            beltSecondaryColor: info.beltSecondaryColor,
          } satisfies StudentPracticeKataLevel
        })
        .filter((entry): entry is StudentPracticeKataLevel => entry !== null)
      : [],
  }))

  const schedule: ClassSchedule[] = student.classEnrollments.map(({ class: scheduledClass }) => ({
    id: scheduledClass.id,
    name: scheduledClass.name,
    description: scheduledClass.description,
    dayOfWeek: scheduledClass.dayOfWeek,
    startTime: formatTime(scheduledClass.startTime),
    endTime: formatTime(scheduledClass.endTime),
    instructorName: scheduledClass.instructor?.name ?? null,
  }))

  const [justifications, onlineRecoveries] = await Promise.all([
    listStudentAbsenceJustifications(student.id),
    listStudentOnlineRecoveries(student.id),
  ])

  return {
    summary: {
      confirmedCount,
      pendingCount,
      totalHours: Number(totalHours.toFixed(1)),
      targetAttendances,
      attendancePercent,
    },
    records,
    justifications,
    onlineRecoveries,
    practiceTechniques,
    program: programForAge(ageFromDob(student.dateOfBirth)),
    schedule,
  }
}

export async function getStudentSchedule(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
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

export async function getStudentDocuments(studentId: string): Promise<StudentDocumentSummary[] | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
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

export async function getStudentKataProgress(studentId: string): Promise<StudentKataProgressSummary | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      plan: { select: { name: true, monthlyHours: true, isUnlimited: true } },
      techniques: {
        include: {
          technique: {
            include: {
              beltRankKatas: {
                select: {
                  order: true,
                  beltRank: { select: { name: true, program: true, order: true, kyuDan: true, beltColor: true, beltSecondaryColor: true } },
                },
                orderBy: [{ beltRank: { program: 'asc' } }, { beltRank: { order: 'asc' } }],
              },
            },
          },
          evaluation: { include: { evaluator: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
      attendances: {
        select: {
          date: true,
          present: true,
          status: true,
          hoursTrained: true,
          recoveredById: true,
          recoveredBy: { select: { date: true } },
          sessionType: true,
          classId: true,
          isOutOfSchedule: true,
        },
      },
      absenceJustifications: { select: { classId: true, date: true, status: true } },
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

  // Progreso del mes en curso: barra informativa dentro de "Progreso de grado".
  // No participa del `overallPercent` ni de la elegibilidad a examen.
  const { start: monthStart, end: monthEnd } = monthRange(today)
  const confirmedHoursMonth = student.attendances
    .filter((attendance) => attendance.present && attendance.status === 'CONFIRMED' && attendance.date >= monthStart && attendance.date < monthEnd)
    .reduce((sum, attendance) => sum + attendance.hoursTrained, 0)
  const isUnlimitedPlan = student.plan?.isUnlimited ?? false
  const planMonthlyHoursForMonth = student.plan?.monthlyHours ?? null
  const monthlyBalance = computeBalance({
    confirmedHours: confirmedHoursMonth,
    planMonthlyHours: planMonthlyHoursForMonth,
    isUnlimited: isUnlimitedPlan,
    scholarshipType: student.scholarshipType,
    isCompetitor: student.isCompetitor,
  })
  const monthly: MonthlyProgressInfo = {
    planName: student.plan?.name ?? null,
    confirmedHours: Number(confirmedHoursMonth.toFixed(2)),
    expectedHours: monthlyBalance.planHours,
    percent:
      !isUnlimitedPlan && monthlyBalance.planHours != null && monthlyBalance.planHours > 0
        ? Math.min(100, Math.round((confirmedHoursMonth / monthlyBalance.planHours) * 100))
        : 0,
    balanceLevel: monthlyBalance.level,
    isUnlimited: isUnlimitedPlan,
  }

  // Asistencia vs horas de entrenamiento. Cuentan TODAS las asistencias
  // presentadas (present=true), incluidas las PENDING de punch-in: el alumno ve
  // progreso de inmediato y, si luego se rechaza la marca, se descuenta sola
  // (el rechazo pone present=false). Las faltas marcadas (ABSENT) y las
  // justificadas (JUSTIFIED) participan del control mensual; una repuesta sigue
  // en el total del mes pero deja de estar pendiente. Un punch rechazado no.
  const referenceClassIds = new Set(student.classEnrollments.map((entry) => entry.classId))

  const scopedAttendances = student.attendances.filter((attendance) => attendance.date.getTime() >= gradeStart.getTime())
  const attendedRecords = scopedAttendances.filter((attendance) => attendance.present)
  const pendingRecords = attendedRecords.filter((attendance) => attendance.status === 'PENDING')

  // Toda falta participa del control mensual: justificada (notificada por la app)
  // o no. Las dos primeras del mes están incluidas; desde la tercera se exige
  // reposición. Una falta repuesta sigue contando en el total del mes, pero deja
  // de estar pendiente (recoveredById es la marca de reposición).
  // Un reporte aún PENDIENTE de revisión no penaliza: se excluye hasta que el
  // instructor o administración lo apruebe o rechace.
  const pendingJustificationKeys = new Set(
    student.absenceJustifications
      .filter((justification) => justification.status === 'PENDING')
      .map((justification) => `${justification.classId}|${toCalendarKey(justification.date) ?? ''}`),
  )
  const absenceRecords = scopedAttendances
    .filter((attendance) => {
      if (attendance.present) return false
      if (attendance.status !== 'ABSENT' && attendance.status !== 'CONFIRMED' && attendance.status !== 'JUSTIFIED') return false
      const key = `${attendance.classId ?? ''}|${santoDomingoDayKey(attendance.date)}`
      // Solo se difiere una falta marcada como ABSENT: si el pase de lista ya la
      // justificó, cuenta como falta justificada aunque el reporte siga pendiente.
      return attendance.status !== 'ABSENT' || !pendingJustificationKeys.has(key)
    })
    .map((attendance) => ({
      date: attendance.date,
      status: attendance.status,
      recoveredById: attendance.recoveredById,
      recoveredAt: attendance.recoveredBy?.date ?? null,
    }))

  // Horas de entrenamiento: TATAMI vs LIBRE, según el tipo de sesión que el
  // alumno eligió al punchar (o el instructor al confirmar). "Entrenamiento
  // libre" (sessionType 'autonomous') es la única categoría de casa/libre; todo
  // lo demás ('class', 'private', 'seminar', 'other', null) es tatami/dojo. No
  // se usa classId porque el punch puede quedar sin clase coincidente aunque
  // sea una clase real. La división por bloques se hace más abajo.
  const isLibreTraining = (attendance: { sessionType: string | null }) => attendance.sessionType === 'autonomous'
  const attendedSessionsGrade = attendedRecords.length
  const pendingSessionsGrade = pendingRecords.length

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
        criteria: parseKataCriteria(evaluation?.criteria ?? null),
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
  const [activeClasses, holidayRows, convocations, policyPoints] = await Promise.all([
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
    listAbsencePolicyPoints(student.schoolId),
  ])
  const currentAbsencePolicy = resolveAbsencePolicyAt(policyPoints, today)

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
    const blockAttended = attendedRecords.filter((attendance) => attendance.date >= effectiveStart && attendance.date < block.end)
    const blockTatami = blockAttended.filter((attendance) => !isLibreTraining(attendance))
    const blockLibre = blockAttended.filter(isLibreTraining)
    const classHours = Number(blockTatami.reduce((sum, attendance) => sum + attendance.hoursTrained, 0).toFixed(2))
    const libreHours = Number(blockLibre.reduce((sum, attendance) => sum + attendance.hoursTrained, 0).toFixed(2))
    const classSessions = blockAttended.length
    const extraClasses = blockTatami.filter((attendance) => attendance.isOutOfSchedule).length

    const requiredHours = hoursExempt ? null : Number((planMonthlyHours * monthsCovered(effectiveStart, block.end)).toFixed(2))
    const capacityHours = available.hours
    const capacitySessions = available.sessions
    const hoursMet = requiredHours == null || classHours >= requiredHours

    const blockClosed = block.end.getTime() <= today.getTime()
    const blockPolicy = resolveAbsencePolicyAt(policyPoints, blockClosed ? block.end : today)
    const blockAbsences = absenceRecords.filter((attendance) => attendance.date >= effectiveStart && attendance.date < block.end)
    const monthlyAbsences = summarizeMonthlyAbsences(blockAbsences, {
      closedAt: blockClosed ? block.end : null,
      policy: blockPolicy,
    })
    const monthAbsences: MonthAbsence[] = monthlyAbsences.map((month) => ({
      label: month.label,
      count: month.count,
      max: FREE_ABSENCES_PER_MONTH,
      recovered: month.recovered,
      excess: month.excess,
      pendingRecovery: month.pendingRecovery,
      lateRecovery: month.lateRecovery,
    }))
    const maxMonthAbsences = monthlyAbsences.reduce((max, month) => Math.max(max, month.count), 0)
    const pendingRecoveries = monthlyAbsences.reduce((sum, month) => sum + month.pendingRecovery, 0)
    const lateRecoveries = monthlyAbsences.reduce((sum, month) => sum + month.lateRecovery, 0)
    const excessMonth = monthlyAbsences
      .filter((month) => month.pendingRecovery > 0)
      .sort((left, right) => right.pendingRecovery - left.pendingRecovery)[0]?.label ?? null

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
      libreHours,
      extraClasses,
      hoursMet,
      hoursExempt,
      absences: blockAbsences.length,
      monthAbsences,
      maxMonthAbsences,
      excessMonth,
      exceededAbsenceLimit: pendingRecoveries > 0,
      pendingRecoveries,
      lateRecoveries,
      absencePolicy: blockPolicy,
      isCurrent: today >= block.start && today < block.end,
      isFuture: block.start.getTime() > today.getTime(),
      examDate: examDate ? examDate.toISOString() : null,
      examTentative: examDate != null && confirmed == null,
    } satisfies CuatrimestreProgress
  })

  const examRight = evaluateExamRight(
    blocks.map((block, index) => ({
      end: block.end,
      pendingRecovery: cuatrimestres[index]?.pendingRecoveries ?? 0,
    })),
    today,
  )
  const examRightLost = examRight.lost
  const examAtRisk = examRight.atRisk
  const totalPendingRecoveries = cuatrimestres.reduce((sum, cuatrimestre) => sum + cuatrimestre.pendingRecoveries, 0)
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

  // Requisito de horas de entrenamiento: la barra muestra el TOTAL (tatami +
  // libre) contra la meta del plan; la elegibilidad de examen exige un mínimo de
  // TATAMI (clase regular + extra). El excedente de grados previos se descuenta.
  const examIndex = examBlock ? cuatrimestres.indexOf(examBlock) : -1
  const hoursBlocks = examIndex >= 0 ? cuatrimestres.slice(0, examIndex + 1) : cuatrimestres
  const classHoursTramo = Number(hoursBlocks.reduce((sum, block) => sum + block.classHours, 0).toFixed(2))
  const libreHoursTramo = Number(hoursBlocks.reduce((sum, block) => sum + block.libreHours, 0).toFixed(2))
  const totalHoursTramo = Number((classHoursTramo + libreHoursTramo).toFixed(2))
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
        libreHours: libreHoursTramo,
        totalHours: totalHoursTramo,
        requiredHours: requiredHoursTramo,
        effectiveRequiredHours,
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

  // Asistencia mínima mensual: se exige el mínimo del grado en CADA mes del
  // cuatrimestre del examen (no en todo el historial del grado). Un mes sin
  // clases programadas no cuenta. Las 2 primeras faltas justificadas del mes se
  // eximen y las faltas repuestas se acreditan en su mes original.
  const attendanceMonths: AttendanceMonthProgress[] = []
  const attendanceWindowStart = examBlock ? new Date(examBlock.start) : gradeStart
  const attendanceWindowEnd = examBlock ? new Date(examBlock.end) : today
  const attendanceEvalEnd = new Date(Math.min(attendanceWindowEnd.getTime(), today.getTime()))
  const examBlockIndex = examBlock ? cuatrimestres.indexOf(examBlock) : -1
  const examBlockRange = examBlockIndex >= 0 ? blocks[examBlockIndex] : null
  const examWindowStart = examBlockRange?.start ?? attendanceWindowStart
  const examWindowEnd = examBlockRange?.end ?? attendanceWindowEnd
  const examBlockClosed = examBlockRange ? examBlockRange.end.getTime() <= today.getTime() : false
  const examPolicy = examBlockRange
    ? resolveAbsencePolicyAt(policyPoints, examBlockClosed ? examBlockRange.end : today)
    : currentAbsencePolicy
  const examMonthlySummary = new Map(
    summarizeMonthlyAbsences(
      absenceRecords.filter((absence) => absence.date >= examWindowStart && absence.date < examWindowEnd),
      { closedAt: examBlockClosed ? examWindowEnd : null, policy: examPolicy },
    ).map((month) => [month.key, month]),
  )
  const MAX_ATTENDANCE_MONTHS = 24
  let cursorMonth = new Date(attendanceWindowStart.getFullYear(), attendanceWindowStart.getMonth(), 1)
  while (cursorMonth.getTime() <= attendanceEvalEnd.getTime() && attendanceMonths.length < MAX_ATTENDANCE_MONTHS) {
    const monthStart = new Date(cursorMonth)
    const monthEnd = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1)
    const capacitySessions = availableTrainingHours(scheduleClasses, { audience, start: monthStart, end: monthEnd, holidays }).sessions
    cursorMonth = monthEnd
    if (capacitySessions <= 0) continue

    const monthKey = toDateKey(monthStart).slice(0, 7)
    const monthSummary = examMonthlySummary.get(monthKey)
    const attendedSessionsRaw = attendedRecords.filter(
      (attendance) => attendance.date >= monthStart && attendance.date < monthEnd && !isLibreTraining(attendance),
    ).length
    const forgivenSessions = monthSummary?.forgivenSessions ?? 0
    const recoveredSessions = monthSummary?.recovered ?? 0
    const creditedSessions = monthSummary?.creditedSessions ?? 0
    const attendedSessions = attendedSessionsRaw + creditedSessions
    const percentAttendance = Math.min(100, Math.round((attendedSessions / capacitySessions) * 100))
    attendanceMonths.push({
      label: formatMonthKey(monthKey),
      attendedSessions,
      capacitySessions,
      forgivenSessions,
      recoveredSessions,
      creditedSessions,
      percent: percentAttendance,
      required: minAttendancePercent,
      met: percentAttendance >= minAttendancePercent,
    })
  }

  if (attendanceMonths.length > 0) {
    const worstMonth = attendanceMonths.reduce((min, month) => Math.min(min, month.percent), 100)
    const percent = minAttendancePercent > 0
      ? Math.min(100, Math.round((worstMonth / minAttendancePercent) * 100))
      : 100
    applicableMetrics.push({ key: 'ASISTENCIA', percent })
  }

  const overallPercent =
    applicableMetrics.length === 0
      ? 100
      : Math.round(applicableMetrics.reduce((sum, metric) => sum + metric.percent, 0) / applicableMetrics.length)
  const bottleneck =
    applicableMetrics.filter((metric) => metric.percent < 100).sort((a, b) => a.percent - b.percent)[0]?.key ?? null

  const allApplicableMet = applicableMetrics.every((metric) => metric.percent === 100)
  // El derecho no se pierde hasta el cierre, pero mientras haya faltas 3.ª+
  // pendientes de reponer no se puede solicitar la mesa de examen.
  const isEligible = allApplicableMet && !examRightLost && !examAtRisk && nextRank != null

  const capacitySessionsGrade = cuatrimestres.reduce((sum, cuatrimestre) => sum + cuatrimestre.capacitySessions, 0)
  const currentBlock =
    cuatrimestres.find((cuatrimestre) => cuatrimestre.isCurrent) ?? [...cuatrimestres].reverse().find((cuatrimestre) => !cuatrimestre.isFuture) ?? null

  const forgivenSessionsGrade = summarizeMonthlyAbsences(absenceRecords).reduce(
    (sum, month) => sum + month.forgivenSessions,
    0,
  )
  const effectiveAttendedGrade = attendedSessionsGrade + forgivenSessionsGrade

  const currentPeriod: CurrentPeriod | null = currentBlock
    ? {
        label: currentBlock.label,
        classSessions: currentBlock.classSessions,
        capacitySessions: currentBlock.capacitySessions,
        classHours: currentBlock.classHours,
        requiredHours: currentBlock.requiredHours,
        libreHours: currentBlock.libreHours,
        extraClasses: currentBlock.extraClasses,
        creditHours: hoursRequirement?.creditHours ?? 0,
        monthAbsences: currentBlock.monthAbsences,
        totalAbsences: currentBlock.absences,
        maxAbsencesTotal: FREE_ABSENCES_PER_MONTH * 4,
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
      attendedSessions: effectiveAttendedGrade,
      totalSessions: capacitySessionsGrade,
      percentage: capacitySessionsGrade > 0 ? Math.min(100, Math.round((effectiveAttendedGrade / capacitySessionsGrade) * 100)) : 0,
      forgivenSessions: forgivenSessionsGrade,
    },
    attendedSessions: attendedSessionsGrade,
    pendingSessions: pendingSessionsGrade,
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
    maxAbsencesPerMonth: FREE_ABSENCES_PER_MONTH,
    absencePolicy: currentAbsencePolicy,
    examAtRisk,
    examRightLost,
    pendingRecoveries: totalPendingRecoveries,
    bottleneck,
    attendanceMonths,
    monthly,
  }

  return { grado, katas }
}