import { db } from '@/lib/db'
import type {
  StudentAttendanceRecord,
  StudentDashboardSummary,
  TechniqueStatus,
} from '@/types/dashboard'

function techniqueStatus(approved: boolean): TechniqueStatus {
  return approved ? 'APPROVED' : 'PENDING'
}

export async function getStudentDashboardSummary(
  userId: string,
): Promise<StudentDashboardSummary | null> {
  const student = await db.student.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true } },
      techniques: {
        include: { technique: true },
        orderBy: { createdAt: 'desc' },
      },
      attendances: { select: { present: true } },
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
        select: { id: true, name: true, order: true },
      })
    : null

  const attendedSessions = student.attendances.filter(({ present }) => present).length
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
    },
    attendance: {
      attendedSessions,
      totalSessions,
      percentage: totalSessions === 0 ? 0 : Math.round((attendedSessions / totalSessions) * 100),
    },
    techniques: student.techniques.map(({ approved, approvedAt, notes, technique }) => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      category: technique.category,
      status: techniqueStatus(approved),
      approvedAt: approvedAt?.toISOString() ?? null,
      notes,
    })),
    upcomingClasses: [],
  }
}

export async function getStudentAttendanceHistory(userId: string): Promise<StudentAttendanceRecord[] | null> {
  const student = await db.student.findUnique({
    where: { userId },
    select: {
      attendances: {
        orderBy: { session: { date: 'desc' } },
        select: {
          id: true,
          present: true,
          notes: true,
          session: {
            select: {
              date: true,
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
    date: attendance.session.date.toISOString(),
    className: attendance.session.class.name,
    present: attendance.present,
    notes: attendance.notes,
  }))
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