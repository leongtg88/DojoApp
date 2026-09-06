import { db } from '@/lib/db'
import type {
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
        include: { technique: true },
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
    techniques: student.techniques.map(({ approved, approvedAt, notes, technique }) => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      category: technique.category,
      status: approved ? 'APPROVED' : 'PENDING',
      approvedAt: approvedAt?.toISOString() ?? null,
      notes,
    })),
    availableTechniques,
  }
}