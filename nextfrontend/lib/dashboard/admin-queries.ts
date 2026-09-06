import { db } from '@/lib/db'
import { computeBirthdays } from '@/lib/dashboard/birthdays'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import type {
  AdminDashboardSummary,
  AdminBeltRankSummary,
  AdminAttendanceRecord,
  AdminCurriculumData,
  AdminEnrollmentSummary,
  AdminStudentDetail,
  AdminStudentSummary,
  AdminTechniqueSummary,
  AttendanceRecord,
  DashboardBirthday,
  InstructorAttendanceBoardData,
} from '@/types/dashboard'

export async function getAdminDashboardSummary(userId: string): Promise<AdminDashboardSummary | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const studentWhere = scopeSchoolFilter(scope)
  const classWhere = scope.isSuperAdmin ? {} : { branch: { schoolId: scope.schoolId! } }

  const [studentCount, classCount, activeEnrollmentCount] = await Promise.all([
    db.student.count({ where: studentWhere }),
    db.class.count({ where: classWhere }),
    db.classEnrollment.count({
      where: {
        status: 'ACTIVE',
        ...(scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } }),
      },
    }),
  ])

  return { studentCount, classCount, activeEnrollmentCount }
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
      memberNumber: true,
      currentRank: true,
      status: true,
      branch: { select: { name: true } },
      classEnrollments: {
        where: { status: 'ACTIVE' },
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
              rankId: true,
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
      memberNumber: student.memberNumber,
      currentRank: student.currentRank,
      kyuDan: currentBeltRank?.kyuDan ?? null,
      beltColor: currentBeltRank?.beltColor ?? null,
      beltSecondaryColor: currentBeltRank?.beltSecondaryColor ?? null,
      status: student.status,
      branchName: student.branch.name,
      activeClassNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
      techniques: student.techniques.map(({ technique }) => ({ ...technique })),
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

export async function getAdminEnrollments(userId: string): Promise<AdminEnrollmentSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      ...(scopeSchoolFilter(scope)),
      status: 'PENDING',
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
	  applicants: { where: { studentId: null }, select: { id: true, name: true, dateOfBirth: true } },
    },
  })

  return enrollments.map((enrollment) => ({
    ...enrollment,
    createdAt: enrollment.createdAt.toISOString(),
    applicants: enrollment.applicants.map((applicant) => ({ ...applicant, dateOfBirth: applicant.dateOfBirth.toISOString() })),
  }))
}

export async function getAdminBeltRanks(userId: string): Promise<AdminBeltRankSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const ranks = await db.beltRank.findMany({
    where: scope.isSuperAdmin ? {} : { OR: [{ schoolId: scope.schoolId! }, { schoolId: null }] },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      order: true,
      kyuDan: true,
      japaneseName: true,
      kanji: true,
      beltColor: true,
      beltSecondaryColor: true,
      isMaximumRank: true,
      minMonths: true,
      minAttendancePercent: true,
      estimatedDurationMonths: true,
      description: true,
      techniques: { orderBy: { order: 'asc' }, select: { id: true, name: true, japaneseName: true, kanji: true, description: true, category: true, order: true, difficulty: true, embusen: true, movementsCount: true, videoUrl: true, rankId: true } },
      _count: { select: { promotions: true } },
    },
  })

  const rankNames = ranks.map(({ name }) => name)
  const studentCounts = await db.student.groupBy({
    by: ['currentRank'],
    where: {
      currentRank: { in: rankNames },
      ...(scopeSchoolFilter(scope)),
      status: 'ACTIVE',
    },
    _count: { _all: true },
  })
  const countByRankName = new Map(studentCounts.map(({ currentRank, _count }) => [currentRank, _count._all]))

  return ranks.map((rank) => ({
    id: rank.id,
    name: rank.name,
    order: rank.order,
    kyuDan: rank.kyuDan,
    japaneseName: rank.japaneseName,
    kanji: rank.kanji,
    beltColor: rank.beltColor,
    beltSecondaryColor: rank.beltSecondaryColor,
    isMaximumRank: rank.isMaximumRank,
    minMonths: rank.minMonths,
    minAttendancePercent: rank.minAttendancePercent,
    estimatedDurationMonths: rank.estimatedDurationMonths,
    description: rank.description,
    techniqueCount: rank.techniques.length,
    studentCount: countByRankName.get(rank.name) ?? 0,
    techniques: rank.techniques.map((technique) => ({ ...technique })),
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
    orderBy: [{ rankId: 'asc' }, { order: 'asc' }, { name: 'asc' }],
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
      rankId: true,
    },
  })

  return {
    ranks: ranks ?? [],
    techniques: techniques.map((technique) => ({ ...technique })) as AdminTechniqueSummary[],
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
      memberNumber: true,
      currentRank: true,
      status: true,
      schoolId: true,
      contactPhone: true,
      dateOfBirth: true,
      enrollmentDate: true,
      medicalInfo: true,
      emergencyContact: true,
      branch: { select: { name: true } },
    documents: {
    orderBy: { uploadedAt: 'desc' },
    select: { id: true, type: true, status: true, fileName: true, mimeType: true, fileSize: true, reviewNotes: true, uploadedAt: true },
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
              rankId: true,
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
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      order: true,
      kyuDan: true,
      japaneseName: true,
      kanji: true,
      beltColor: true,
      beltSecondaryColor: true,
      isMaximumRank: true,
      minMonths: true,
      minAttendancePercent: true,
      estimatedDurationMonths: true,
      description: true,
      techniques: { orderBy: { order: 'asc' }, select: { id: true, name: true, japaneseName: true, kanji: true, description: true, category: true, order: true, difficulty: true, embusen: true, movementsCount: true, videoUrl: true, rankId: true } },
      _count: { select: { techniques: true } },
    },
  })
  const currentRankOrder = ranks.find(({ name }) => name === student.currentRank)?.order ?? null
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
    contactPhone: student.contactPhone,
    dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
    enrollmentDate: student.enrollmentDate?.toISOString() ?? null,
    medicalInfo: student.medicalInfo,
    emergencyContact: student.emergencyContact,
	 documents: student.documents.map((document) => ({ ...document, uploadedAt: document.uploadedAt.toISOString() })),
    availableRanks: ranks.map((rank) => ({
      id: rank.id,
      name: rank.name,
      order: rank.order,
      kyuDan: rank.kyuDan,
      japaneseName: rank.japaneseName,
      kanji: rank.kanji,
      beltColor: rank.beltColor,
      beltSecondaryColor: rank.beltSecondaryColor,
      isMaximumRank: rank.isMaximumRank,
      minMonths: rank.minMonths,
      minAttendancePercent: rank.minAttendancePercent,
      estimatedDurationMonths: rank.estimatedDurationMonths,
      description: rank.description,
      techniqueCount: rank._count.techniques,
      studentCount: 0,
      techniques: rank.techniques.map((technique) => ({ ...technique })),
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
      technique: { ...entry.technique },
    })),
    rankAwardedAt: student.rankHistory[0]?.promotedAt.toISOString() ?? null,
    attendancePercent: Math.min(100, Math.round((attendedCount / TARGET_ATTENDANCES) * 100)),
    attendedCount,
    targetAttendances: TARGET_ATTENDANCES,
    nextRankName: nextBeltRank?.name ?? null,
    nextRankKyuDan: nextBeltRank?.kyuDan ?? null,
    nextRankBeltColor: nextBeltRank?.beltColor ?? null,
    nextRankRequiredKatas: nextBeltRank?._count.techniques ?? 0,
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
        status: 'ACTIVE',
      },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, currentRank: true },
    }),
    db.user.findMany({
      where: {
        role: 'INSTRUCTOR',
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