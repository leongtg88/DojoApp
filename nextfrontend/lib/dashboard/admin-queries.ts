import { db } from '@/lib/db'
import type {
  AdminDashboardSummary,
  AdminBeltRankSummary,
  AdminAttendanceRecord,
  AdminEnrollmentSummary,
  AdminStudentDetail,
  AdminStudentSummary,
  DashboardBirthday,
} from '@/types/dashboard'

interface AdminScope {
  isSuperAdmin: boolean
  schoolId: string | null
}

async function getAdminScope(userId: string): Promise<AdminScope | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, schoolId: true },
  })

  if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPERADMIN')) {
    return null
  }

  if (user.role === 'SCHOOL_ADMIN' && !user.schoolId) {
    return null
  }

  return {
    isSuperAdmin: user.role === 'SUPERADMIN',
    schoolId: user.schoolId,
  }
}

export async function getAdminDashboardSummary(userId: string): Promise<AdminDashboardSummary | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const studentWhere = scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }
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
    where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentRank: true,
      status: true,
      branch: { select: { name: true } },
      classEnrollments: {
        where: { status: 'ACTIVE' },
        select: { class: { select: { name: true } } },
      },
    },
  })

  return students.map((student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    currentRank: student.currentRank,
    status: student.status,
    branchName: student.branch.name,
    activeClassNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
  }))
}

export async function getAdminEnrollments(userId: string): Promise<AdminEnrollmentSummary[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }),
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
      _count: { select: { techniques: true } },
    },
  })

  return ranks.map((rank) => ({
    id: rank.id,
    name: rank.name,
    order: rank.order,
    techniqueCount: rank._count.techniques,
  }))
}

export async function getAdminStudentDetail(userId: string, studentId: string): Promise<AdminStudentDetail | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentRank: true,
      status: true,
      schoolId: true,
      contactPhone: true,
      branch: { select: { name: true } },
    documents: {
    orderBy: { uploadedAt: 'desc' },
    select: { id: true, type: true, status: true, fileName: true, mimeType: true, fileSize: true, reviewNotes: true, uploadedAt: true },
    },
      rankHistory: {
        orderBy: { promotedAt: 'desc' },
        select: {
          id: true,
          promotedAt: true,
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
      _count: { select: { techniques: true } },
    },
  })
  const currentRankOrder = ranks.find(({ name }) => name === student.currentRank)?.order ?? null

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    currentRank: student.currentRank,
    currentRankOrder,
    status: student.status,
    branchName: student.branch.name,
    contactPhone: student.contactPhone,
	 documents: student.documents.map((document) => ({ ...document, uploadedAt: document.uploadedAt.toISOString() })),
    availableRanks: ranks.map((rank) => ({
      id: rank.id,
      name: rank.name,
      order: rank.order,
      techniqueCount: rank._count.techniques,
    })),
    rankHistory: student.rankHistory.map((entry) => ({
      id: entry.id,
      rankName: entry.beltRank.name,
      rankOrder: entry.beltRank.order,
      promotedAt: entry.promotedAt.toISOString(),
      promoterName: entry.promoter?.name ?? null,
      notes: entry.notes,
    })),
  }
}

export async function getAdminAttendance(userId: string): Promise<AdminAttendanceRecord[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const records = await db.attendance.findMany({
    where: scope.isSuperAdmin ? {} : { session: { class: { branch: { schoolId: scope.schoolId! } } } },
    orderBy: { session: { date: 'desc' } },
    take: 100,
    select: {
      id: true,
      present: true,
      notes: true,
      student: { select: { firstName: true, lastName: true } },
      session: {
        select: {
          date: true,
          class: { select: { name: true, branch: { select: { name: true } } } },
        },
      },
    },
  })

  return records.map((record) => ({
    id: record.id,
    studentName: `${record.student.firstName} ${record.student.lastName}`,
    className: record.session.class.name,
    branchName: record.session.class.branch.name,
    date: record.session.date.toISOString(),
    present: record.present,
    notes: record.notes,
  }))
}

export async function getAdminUpcomingBirthdays(userId: string): Promise<DashboardBirthday[] | null> {
  const scope = await getAdminScope(userId)

  if (!scope) {
    return null
  }

  const students = await db.student.findMany({
    where: {
      ...(scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! }),
      status: 'ACTIVE',
    },
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
  })
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const millisecondsPerDay = 1000 * 60 * 60 * 24

  return students.map((student) => {
    const nextBirthday = new Date(today.getFullYear(), student.dateOfBirth.getMonth(), student.dateOfBirth.getDate())

    if (nextBirthday < startOfToday) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
    }

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      dateOfBirth: student.dateOfBirth.toISOString(),
      daysUntil: Math.round((nextBirthday.getTime() - startOfToday.getTime()) / millisecondsPerDay),
    }
  }).filter(({ daysUntil }) => daysUntil <= 30).sort((first, second) => first.daysUntil - second.daysUntil)
}