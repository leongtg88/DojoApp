import { db } from '@/lib/db'
import type {
  DashboardBirthday,
  InstructorAttendanceRoster,
  InstructorClassSummary,
  InstructorStudentSummary,
  InstructorTechniqueReview,
} from '@/types/dashboard'

export async function getInstructorClasses(userId: string): Promise<InstructorClassSummary[]> {
  const classes = await db.class.findMany({
    where: { instructorId: userId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      branch: { select: { name: true } },
      instructor: { select: { name: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { id: true },
      },
    },
  })

  return classes.map((scheduledClass) => ({
    id: scheduledClass.id,
    name: scheduledClass.name,
    description: scheduledClass.description,
    dayOfWeek: scheduledClass.dayOfWeek,
    startTime: scheduledClass.startTime,
    endTime: scheduledClass.endTime,
    instructorName: scheduledClass.instructor?.name ?? null,
    branchName: scheduledClass.branch.name,
    activeStudentCount: scheduledClass.enrollments.length,
  }))
}

export async function getInstructorStudents(userId: string): Promise<InstructorStudentSummary[]> {
  const students = await db.student.findMany({
    where: {
      classEnrollments: {
        some: {
          status: 'ACTIVE',
          class: { instructorId: userId },
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentRank: true,
      status: true,
      classEnrollments: {
        where: {
          status: 'ACTIVE',
          class: { instructorId: userId },
        },
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
    classNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
  }))
}

export async function getInstructorUpcomingBirthdays(userId: string): Promise<DashboardBirthday[]> {
  const students = await db.student.findMany({
    where: {
      status: 'ACTIVE',
      classEnrollments: {
        some: {
          status: 'ACTIVE',
          class: { instructorId: userId },
        },
      },
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

export async function getInstructorAttendanceRoster(
  userId: string,
  classId: string,
  date: string,
): Promise<InstructorAttendanceRoster | null> {
  const sessionDate = new Date(`${date}T00:00:00.000Z`)
  const assignedClass = await db.class.findFirst({
    where: { id: classId, instructorId: userId },
    select: {
      id: true,
      name: true,
      enrollments: {
        where: { status: 'ACTIVE' },
        orderBy: { student: { lastName: 'asc' } },
        select: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              currentRank: true,
            },
          },
        },
      },
    },
  })

  if (!assignedClass) {
    return null
  }

  const session = await db.classSession.findUnique({
    where: { classId_date: { classId, date: sessionDate } },
    select: {
      attendances: {
        select: { studentId: true, present: true, notes: true },
      },
    },
  })
  const attendanceByStudent = new Map(session?.attendances.map((attendance) => [attendance.studentId, attendance]))

  return {
    classId: assignedClass.id,
    className: assignedClass.name,
    date,
    students: assignedClass.enrollments.map(({ student }) => {
      const attendance = attendanceByStudent.get(student.id)
      return {
        ...student,
        present: attendance?.present ?? true,
        notes: attendance?.notes ?? null,
      }
    }),
  }
}

export async function getInstructorTechniqueReview(
  userId: string,
  studentId: string,
): Promise<InstructorTechniqueReview | null> {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      classEnrollments: {
        some: {
          status: 'ACTIVE',
          class: { instructorId: userId },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentRank: true,
      schoolId: true,
      techniques: {
        include: { technique: true, evaluation: { include: { evaluator: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!student) {
    return null
  }

  const availableTechniques = await db.technique.findMany({
    where: {
      OR: [{ schoolId: student.schoolId }, { schoolId: null }],
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, description: true, category: true },
  })

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      currentRank: student.currentRank,
    },
    techniques: student.techniques.map(({ approved, approvedAt, notes, technique, evaluation }) => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      category: technique.category,
      status: approved ? 'APPROVED' : 'PENDING',
      approvedAt: approvedAt?.toISOString() ?? null,
      notes,
      evaluation: evaluation ? {
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluatedAt: evaluation.evaluatedAt.toISOString(),
        evaluatorName: evaluation.evaluator.name,
      } : null,
    })),
    availableTechniques,
  }
}