import { db } from '@/lib/db'
import { ClassEnrollmentStatus, StudentStatus, EnrollmentStatus } from '@/lib/generated/prisma'
import { computeBirthdays } from '@/lib/dashboard/birthdays'
import { ageFromDob, programForAge } from '@/lib/dashboard/program'
import { computeBalance, formatTime, monthRange } from '@/lib/dashboard/balance'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { buildStudentRegistrationView } from '@/lib/dashboard/registration-data'

function techniqueWithRanks<T extends { beltRankKatas: { beltRankId: string }[] }>(technique: T) {
  const { beltRankKatas, ...rest } = technique
  return { ...rest, rankIds: beltRankKatas.map(({ beltRankId }) => beltRankId) }
}
import type {
  AdminBalanceRow,
  AdminDashboardSummary,
  AdminBeltRankSummary,
  AdminAttendanceRecord,
  AdminCurriculumData,
  AdminEnrollmentSummary,
  AdminInstructor,
  AdminScheduleSummary,
  AdminStudentDetail,
  AdminStudentSummary,
  AttendanceRecord,
  DashboardBirthday,
  InstructorAttendanceBoardData,
  PlanSummary,
  ScholarshipType,
} from '@/types/dashboard'

export async function getAdminDashboardSummary(userId: string): Promise<AdminDashboardSummary | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const studentWhere = scopeSchoolFilter(scope)
  const classWhere = scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }

  const [studentCount, classCount, activeEnrollmentCount, pendingCases] = await Promise.all([
    db.student.count({ where: studentWhere }),
    db.class.count({ where: classWhere }),
    db.classEnrollment.count({
      where: {
        status: ClassEnrollmentStatus.ACTIVE,
        ...(scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } }),
      },
    }),
    (async () => {
      const withoutPlan = await db.student.count({ where: scope.isSuperAdmin ? { planId: null } : { planId: null, schoolId: scope.schoolId! } })
      const withEnrollment = await db.student.findMany({
        where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! },
        select: { id: true },
      })
      const enrolledStudentIds = (
        await db.classEnrollment.findMany({
          where: { status: ClassEnrollmentStatus.ACTIVE, ...(scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } }) },
          select: { studentId: true },
        })
      )
      const enrolledSet = new Set(enrolledStudentIds.map(({ studentId }) => studentId))
      const noSchedule = withEnrollment.filter((student) => !enrolledSet.has(student.id)).length
      return { noPlan: withoutPlan, noSchedule }
    })(),
  ])

  return { studentCount, classCount, activeEnrollmentCount, pendingCases }
}

export async function getAdminStudents(userId: string): Promise<AdminStudentSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const students = await db.student.findMany({
    where: scopeSchoolFilter(scope),
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      memberNumber: true,
      currentRank: true,
      status: true,
      userId: true,
      email: true,
      invitationTokens: {
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true },
      },
      branch: { select: { name: true } },
      plan: { select: { id: true, name: true } },
      scholarshipType: true,
      scholarshipNote: true,
      isCompetitor: true,
      classEnrollments: {
        where: { status: ClassEnrollmentStatus.ACTIVE },
        select: { class: { select: { name: true } } },
      },
      techniques: {
        select: {
          approved: true,
          inPractice: true,
          approvedAt: true,
          notes: true,
          technique: {
            select: {
              id: true,
              name: true,
              japaneseName: true,
              kanji: true,
              description: true,
              category: true,
              order: true,
              difficulty: true,
              embusen: true,
              movementsCount: true,
              videoUrl: true,
              beltRankKatas: { select: { beltRankId: true }, orderBy: { order: 'asc' } },
            },
          },
        },
      },
      rankHistory: {
        orderBy: { promotedAt: 'desc' },
        take: 1,
        select: { promotedAt: true },
      },
    },
  })

  const ranks = await db.beltRank.findMany({
    where: scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] },
    orderBy: { order: 'asc' },
    select: { name: true, order: true, kyuDan: true, beltColor: true, beltSecondaryColor: true },
  })
  const rankByOrder = new Map(ranks.map((rank) => [rank.order, rank]))

  const studentIds = students.map((student) => student.id)
  const attendanceCounts = studentIds.length
    ? await db.attendance.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, status: 'CONFIRMED' },
        _count: { _all: true },
      })
    : []
  const confirmedByStudent = new Map(attendanceCounts.map(({ studentId, _count }) => [studentId, _count._all]))

  const TARGET_ATTENDANCES = 30

  return students.map((student) => {
    const currentBeltRank = ranks.find((rank) => rank.name === student.currentRank)
    const nextBeltRank = currentBeltRank ? rankByOrder.get(currentBeltRank.order + 1) : null
    const confirmedCount = confirmedByStudent.get(student.id) ?? 0

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      memberNumber: student.memberNumber,
      currentRank: student.currentRank,
      kyuDan: currentBeltRank?.kyuDan ?? null,
      beltColor: currentBeltRank?.beltColor ?? null,
      beltSecondaryColor: currentBeltRank?.beltSecondaryColor ?? null,
      status: student.status,
      email: student.email,
      accountStatus: student.userId ? 'ACTIVO' : student.invitationTokens.length > 0 ? 'INVITADO' : 'SIN_CUENTA',
      branchName: student.branch.name,
      activeClassNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
      planId: student.plan?.id ?? null,
      planName: student.plan?.name ?? null,
      scholarshipType: student.scholarshipType as ScholarshipType,
      scholarshipNote: student.scholarshipNote,
      isCompetitor: student.isCompetitor,
      needsPlan: !student.plan?.id,
      needsSchedule: student.classEnrollments.length === 0,
      techniques: student.techniques.map(({ technique }) => techniqueWithRanks(technique)),
      studentCount: student.techniques.length,
      kataMasteredCount: student.techniques.filter(({ approved }) => approved).length,
      kataTotalCount: student.techniques.length,
      attendancePercent: Math.min(100, Math.round((confirmedCount / TARGET_ATTENDANCES) * 100)),
      rankAwardedAt: student.rankHistory[0]?.promotedAt.toISOString() ?? null,
      nextRankName: nextBeltRank?.name ?? null,
      nextRankKyuDan: nextBeltRank?.kyuDan ?? null,
      nextRankBeltColor: nextBeltRank?.beltColor ?? null,
    }
  })
}

export async function getAdminPendingEnrollmentCount(userId: string): Promise<number> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return 0
  }

  return db.enrollment.count({
    where: {
      ...(scopeSchoolFilter(scope)),
      status: EnrollmentStatus.PENDING,
    },
  })
}

export async function getAdminEnrollments(userId: string): Promise<AdminEnrollmentSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      ...(scopeSchoolFilter(scope)),
      status: EnrollmentStatus.PENDING,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      applicantName: true,
      contactEmail: true,
      contactPhone: true,
      interest: true,
      schedule: true,
      status: true,
      createdAt: true,
	  applicants: { where: { studentId: null }, select: { id: true, name: true, dateOfBirth: true, profileData: true } },
    },
  })

  return enrollments.map((enrollment) => ({
    ...enrollment,
    createdAt: enrollment.createdAt.toISOString(),
    applicants: enrollment.applicants.map((applicant) => ({ ...applicant, dateOfBirth: applicant.dateOfBirth.toISOString(), profileData: applicant.profileData as Record<string, unknown> | null })),
  }))
}

export async function getAdminBeltRanks(userId: string): Promise<AdminBeltRankSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const ranks = await db.beltRank.findMany({
    where: scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] },
    orderBy: [{ program: 'asc' }, { order: 'asc' }],
    select: {
      id: true,
      program: true,
      name: true,
      order: true,
      kyuDan: true,
      japaneseName: true,
      kanji: true,
      beltColor: true,
      beltSecondaryColor: true,
      isMaximumRank: true,
      minMonths: true,
      maxMonths: true,
      minAttendancePercent: true,
      estimatedDurationMonths: true,
      description: true,
      katas: { orderBy: { order: 'asc' }, select: { kata: { select: { id: true, name: true, japaneseName: true, kanji: true, description: true, category: true, order: true, difficulty: true, embusen: true, movementsCount: true, videoUrl: true, beltRankKatas: { select: { beltRankId: true }, orderBy: { order: 'asc' } } } } } },
      _count: { select: { promotions: true } },
    },
  })

  const rankNames = ranks.map(({ name }) => name)
  const studentCounts = await db.student.groupBy({
    by: ['currentRank'],
    where: {
      currentRank: { in: rankNames },
      ...(scopeSchoolFilter(scope)),
      status: StudentStatus.ACTIVE,
    },
    _count: { _all: true },
  })
  const countByRankName = new Map(studentCounts.map(({ currentRank, _count }) => [currentRank, _count._all]))

  return ranks.map((rank) => ({
    id: rank.id,
    program: rank.program,
    name: rank.name,
    order: rank.order,
    kyuDan: rank.kyuDan,
    japaneseName: rank.japaneseName,
    kanji: rank.kanji,
    beltColor: rank.beltColor,
    beltSecondaryColor: rank.beltSecondaryColor,
    isMaximumRank: rank.isMaximumRank,
    minMonths: rank.minMonths,
    maxMonths: rank.maxMonths,
    minAttendancePercent: rank.minAttendancePercent,
    estimatedDurationMonths: rank.estimatedDurationMonths,
    description: rank.description,
    techniqueCount: rank.katas.length,
    studentCount: countByRankName.get(rank.name) ?? 0,
    techniques: rank.katas.map(({ kata }) => techniqueWithRanks(kata)),
  }))
}

export async function getAdminCurriculum(userId: string): Promise<AdminCurriculumData | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const ranks = await getAdminBeltRanks(userId)

  const techniques = await db.technique.findMany({
    where: scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      japaneseName: true,
      kanji: true,
      description: true,
      category: true,
      order: true,
      difficulty: true,
embusen: true,
movementsCount: true,
              videoUrl: true,
              beltRankKatas: { select: { beltRankId: true }, orderBy: { order: 'asc' } },
            },
  })

  return {
    ranks: ranks ?? [],
    techniques: techniques.map(techniqueWithRanks),
  }
}

export async function getAdminStudentDetail(userId: string, studentId: string): Promise<AdminStudentDetail | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      ...(scopeSchoolFilter(scope)),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      memberNumber: true,
      currentRank: true,
      status: true,
      schoolId: true,
      userId: true,
      email: true,
      contactPhone: true,
      registrationData: true,
      dateOfBirth: true,
      enrollmentDate: true,
      medicalInfo: true,
      emergencyContact: true,
      invitationTokens: {
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true },
      },
      branch: { select: { name: true } },
      plan: {
        select: {
          id: true,
          name: true,
          monthlyHours: true,
          isUnlimited: true,
        },
      },
      planStartDate: true,
      scholarshipType: true,
      scholarshipNote: true,
      isCompetitor: true,
      classEnrollments: {
        where: { status: ClassEnrollmentStatus.ACTIVE },
        select: { class: { select: { id: true, name: true } } },
      },
documents: {
	    orderBy: { uploadedAt: 'desc' },
	    select: { id: true, type: true, status: true, fileName: true, mimeType: true, fileSize: true, reviewNotes: true, uploadedAt: true },
	    },
      enrollments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          origin: true,
          status: true,
          applicantName: true,
          createdAt: true,
          registrationData: true,
          applicants: { select: { id: true, name: true, dateOfBirth: true, profileData: true, studentId: true } },
        },
      },
      techniques: {
        select: {
          id: true,
          approved: true,
          approvedAt: true,
          inPractice: true,
          practiceHours: true,
          notes: true,
          technique: {
            select: {
              id: true,
              name: true,
              japaneseName: true,
              kanji: true,
              description: true,
              category: true,
              order: true,
              difficulty: true,
              embusen: true,
              movementsCount: true,
              videoUrl: true,
              beltRankKatas: { select: { beltRankId: true }, orderBy: { order: 'asc' } },
            },
          },
        },
      },
      _count: {
        select: {
          attendances: { where: { status: 'CONFIRMED' } },
        },
      },
      rankHistory: {
        orderBy: { promotedAt: 'desc' },
        select: {
          id: true,
          promotedAt: true,
          examinerName: true,
          notes: true,
          beltRank: { select: { name: true, order: true } },
          promoter: { select: { name: true } },
        },
      },
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
      program: true,
      name: true,
      order: true,
      kyuDan: true,
      japaneseName: true,
      kanji: true,
      beltColor: true,
      beltSecondaryColor: true,
      isMaximumRank: true,
      minMonths: true,
      maxMonths: true,
      minAttendancePercent: true,
      estimatedDurationMonths: true,
      description: true,
      katas: { orderBy: { order: 'asc' }, select: { kata: { select: { id: true, name: true, japaneseName: true, kanji: true, description: true, category: true, order: true, difficulty: true, embusen: true, movementsCount: true, videoUrl: true, beltRankKatas: { select: { beltRankId: true }, orderBy: { order: 'asc' } } } } } },
      _count: { select: { katas: true } },
    },
  })
  const currentRankOrder =
    ranks.find(({ name }) => name === student.currentRank)?.order ??
    (student.dateOfBirth
      ? ranks.find(({ program, order }) => program === programForAge(ageFromDob(new Date(student.dateOfBirth))) && order === 1)?.order
      : null) ??
    null
  const nextBeltRank = currentRankOrder !== null ? ranks.find(({ order }) => order === currentRankOrder + 1) : null
  const TARGET_ATTENDANCES = 30
  const attendedCount = student._count.attendances

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    memberNumber: student.memberNumber,
    currentRank: student.currentRank,
    currentRankOrder,
    status: student.status,
    branchName: student.branch.name,
    email: student.email,
    accountStatus: student.userId ? 'ACTIVO' : student.invitationTokens.length > 0 ? 'INVITADO' : 'SIN_CUENTA',
    contactPhone: student.contactPhone,
    dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
    enrollmentDate: student.enrollmentDate?.toISOString() ?? null,
    medicalInfo: student.medicalInfo,
    emergencyContact: student.emergencyContact,
	 documents: student.documents.map((document) => ({ ...document, uploadedAt: document.uploadedAt.toISOString() })),
    availableRanks: ranks.map((rank) => ({
      id: rank.id,
      program: rank.program,
      name: rank.name,
      order: rank.order,
      kyuDan: rank.kyuDan,
      japaneseName: rank.japaneseName,
      kanji: rank.kanji,
      beltColor: rank.beltColor,
      beltSecondaryColor: rank.beltSecondaryColor,
      isMaximumRank: rank.isMaximumRank,
      minMonths: rank.minMonths,
      maxMonths: rank.maxMonths,
      minAttendancePercent: rank.minAttendancePercent,
      estimatedDurationMonths: rank.estimatedDurationMonths,
      description: rank.description,
      techniqueCount: rank._count.katas,
      studentCount: 0,
techniques: rank.katas.map(({ kata }) => techniqueWithRanks(kata)),
    })),
    rankHistory: student.rankHistory.map((entry) => ({
      id: entry.id,
      rankName: entry.beltRank.name,
      rankOrder: entry.beltRank.order,
      promotedAt: entry.promotedAt.toISOString(),
      promoterName: entry.promoter?.name ?? null,
      examinerName: entry.examinerName,
      notes: entry.notes,
    })),
    techniques: student.techniques.map((entry) => ({
      id: entry.id,
      status: entry.approved ? 'APPROVED' as const : entry.inPractice ? 'IN_PROGRESS' as const : 'PENDING' as const,
      approved: entry.approved,
      approvedAt: entry.approvedAt?.toISOString() ?? null,
      inPractice: entry.inPractice,
      practiceHours: entry.practiceHours,
      notes: entry.notes,
      technique: techniqueWithRanks(entry.technique),
    })),
    rankAwardedAt: student.rankHistory[0]?.promotedAt.toISOString() ?? null,
    attendancePercent: Math.min(100, Math.round((attendedCount / TARGET_ATTENDANCES) * 100)),
    attendedCount,
    targetAttendances: TARGET_ATTENDANCES,
    nextRankName: nextBeltRank?.name ?? null,
    nextRankKyuDan: nextBeltRank?.kyuDan ?? null,
    nextRankBeltColor: nextBeltRank?.beltColor ?? null,
    nextRankRequiredKatas: nextBeltRank?._count.katas ?? 0,
    planId: student.plan?.id ?? null,
    planName: student.plan?.name ?? null,
    planMonthlyHours: student.plan?.monthlyHours ?? null,
    isUnlimitedPlan: student.plan?.isUnlimited ?? false,
    planStartDate: student.planStartDate?.toISOString() ?? null,
    scholarshipType: student.scholarshipType as ScholarshipType,
    scholarshipNote: student.scholarshipNote,
    isCompetitor: student.isCompetitor,
    activeScheduleIds: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.id),
    activeScheduleNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
    registration: buildStudentRegistrationView({
      registrationData: student.registrationData,
      enrollments: student.enrollments,
    }),
  }
}

export async function getAdminAttendance(userId: string): Promise<AdminAttendanceRecord[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const records = await db.attendance.findMany({
    where: scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } },
    orderBy: { date: 'desc' },
    take: 100,
    select: {
      id: true,
      present: true,
      notes: true,
      date: true,
      hoursTrained: true,
      sessionType: true,
      status: true,
      student: { select: { firstName: true, lastName: true } },
      confirmedBy: { select: { name: true } },
      session: {
        select: {
          class: { select: { name: true, branch: { select: { name: true } } } },
        },
      },
    },
  })

  return records.map((record) => ({
    id: record.id,
    studentName: `${record.student.firstName} ${record.student.lastName}`,
    className: record.session?.class.name ?? null,
    branchName: record.session?.class.branch.name ?? null,
    date: record.date.toISOString(),
    present: record.present,
    hoursTrained: record.hoursTrained,
    sessionType: record.sessionType,
    status: record.status,
    confirmedByName: record.confirmedBy?.name ?? null,
    notes: record.notes,
  }))
}

export async function getAdminAttendanceBoard(userId: string): Promise<InstructorAttendanceBoardData | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const attendances = await db.attendance.findMany({
    where: scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } },
    orderBy: { date: 'desc' },
    take: 200,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      confirmedBy: { select: { name: true } },
    },
  })

  const records: AttendanceRecord[] = attendances.map((attendance) => ({
    id: attendance.id,
    studentId: attendance.student.id,
    studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
    date: attendance.date.toISOString(),
    hoursTrained: attendance.hoursTrained,
    sessionType: attendance.sessionType,
    status: attendance.status,
    present: attendance.present,
    confirmedByName: attendance.confirmedBy?.name ?? null,
    notes: attendance.notes,
    punchedAt: attendance.punchedAt.toISOString(),
  }))

  const availableDates = [...new Set(records.map(({ date }) => date.slice(0, 10)))].sort().reverse()

  return {
    pendingCount: records.filter(({ status }) => status === 'PENDING').length,
    confirmedCount: records.filter(({ status }) => status === 'CONFIRMED').length,
    totalHours: Number(records.filter(({ status }) => status === 'CONFIRMED').reduce((sum, { hoursTrained }) => sum + hoursTrained, 0).toFixed(1)),
    instructorName: 'Administración',
    records,
    availableDates,
  }
}

export async function getAdminUpcomingBirthdays(userId: string): Promise<DashboardBirthday[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const [students, instructors] = await Promise.all([
    db.student.findMany({
      where: {
        ...(scopeSchoolFilter(scope)),
        status: StudentStatus.ACTIVE,
      },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, currentRank: true },
    }),
    db.user.findMany({
      where: {
        roles: { has: 'INSTRUCTOR' },
        ...(scopeSchoolFilter(scope)),
        instructorProfile: { isNot: null },
      },
      select: { id: true, name: true, instructorProfile: { select: { bio: true } } },
    }),
  ])

  const ranks = await db.beltRank.findMany({ select: { name: true, kyuDan: true } })
  const rankByName = new Map(ranks.map((rank) => [rank.name, rank]))

  return computeBirthdays([
    ...students.map((student) => {
      const rank = rankByName.get(student.currentRank ?? '')
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        role: 'student' as const,
        birthDate: student.dateOfBirth,
        detail: rank ? `${rank.name} (${rank.kyuDan ?? ''})`.trim() : 'Alumno',
      }
    }),
    ...instructors.map((instructor) => ({
      id: instructor.id,
      name: instructor.name ?? 'Instructor',
      role: 'instructor' as const,
      birthDate: new Date(),
      detail: instructor.instructorProfile?.bio?.slice(0, 40) ?? 'Sensei',
    })),
  ])
}

export async function getAdminPlans(userId: string): Promise<PlanSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const plans = await db.plan.findMany({
    where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      monthlyHours: true,
      price: true,
      isUnlimited: true,
      active: true,
      sortOrder: true,
      _count: { select: { students: true } },
    },
  })

  return plans.map(({ _count, price, ...plan }) => ({
    ...plan,
    price: price?.toNumber() ?? null,
    studentCount: _count.students,
  }))
}

export async function getAdminInstructors(userId: string): Promise<AdminInstructor[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const instructors = await db.user.findMany({
    where: {
      roles: { has: 'INSTRUCTOR' },
      ...(scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] }),
    },
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, email: true },
  })

  return instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name ?? instructor.email,
  }))
}

export async function getAdminSchedules(userId: string): Promise<AdminScheduleSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const classes = await db.class.findMany({
    where: scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      audience: true,
      active: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      branch: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { enrollments: { where: { status: ClassEnrollmentStatus.ACTIVE } } } },
      enrollments: { where: { status: ClassEnrollmentStatus.ACTIVE }, select: { studentId: true } },
    },
  })

  return classes.map(({ branch, instructor, _count, enrollments, startTime, endTime, ...scheduledClass }) => ({
    ...scheduledClass,
    startTime: formatTime(startTime),
    endTime: formatTime(endTime),
    branchId: branch.id,
    branchName: branch.name,
    instructorId: instructor?.id ?? null,
    instructorName: instructor?.name ?? null,
    activeStudentCount: _count.enrollments,
    enrolledStudentIds: enrollments.map(({ studentId }) => studentId),
  }))
}

export async function getAdminBalanceReport(userId: string): Promise<AdminBalanceRow[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const { start, end } = monthRange(new Date())

  const students = await db.student.findMany({
    where: {
      ...scopeSchoolFilter(scope),
      status: StudentStatus.ACTIVE,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberNumber: true,
      currentRank: true,
      scholarshipType: true,
      isCompetitor: true,
      plan: {
        select: {
          id: true,
          name: true,
          monthlyHours: true,
          isUnlimited: true,
        },
      },
      attendances: {
        where: { date: { gte: start, lt: end } },
        select: { present: true, status: true, hoursTrained: true, isOutOfSchedule: true },
      },
    },
  })

  return students.map((student) => {
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

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      memberNumber: student.memberNumber,
      currentRank: student.currentRank,
      planId: student.plan?.id ?? null,
      planName: student.plan?.name ?? null,
      planMonthlyHours: student.plan?.monthlyHours ?? null,
      isUnlimited: student.plan?.isUnlimited ?? false,
      scholarshipType: student.scholarshipType as ScholarshipType,
      isCompetitor: student.isCompetitor,
      confirmedHours: Number(confirmedHours.toFixed(2)),
      balanceDiff: balance.diff,
      balanceLevel: balance.level,
      balanceAlert: balance.alert,
      balanceMessage: balance.message,
      outOfScheduleCount: student.attendances.filter((attendance) => attendance.isOutOfSchedule && attendance.status === 'CONFIRMED').length,
    }
  })
}