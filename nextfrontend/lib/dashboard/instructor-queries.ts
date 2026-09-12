import { db } from '@/lib/db'
import { computeBirthdays } from '@/lib/dashboard/birthdays'
import type {
  AttendanceRecord,
  DashboardBirthday,
  InstructorAttendanceBoardData,
  InstructorAttendanceRoster,
  InstructorClassSummary,
  InstructorKataAssignmentData,
  InstructorStudentSearchResult,
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
      schoolId: true,
      status: true,
      classEnrollments: {
        where: {
          status: 'ACTIVE',
          class: { instructorId: userId },
        },
        select: { class: { select: { name: true } } },
      },
      techniques: {
        select: { approved: true, practiceHours: true },
      },
      attendances: {
        select: { status: true, present: true, hoursTrained: true },
      },
    },
  })

  const ranks = await db.beltRank.findMany({
    where: { OR: [{ schoolId: students[0]?.schoolId ?? '__none__' }, { schoolId: null }] },
    select: { name: true, kyuDan: true, beltColor: true, order: true },
  })
  const rankByName = new Map(ranks.map((rank) => [rank.name, rank]))

  return students.map((student) => {
    const rank = rankByName.get(student.currentRank ?? '')
    const masteredCount = student.techniques.filter(({ approved }) => approved).length
    const requiredCount = student.techniques.length
    const confirmedCount = student.attendances.filter(({ status }) => status === 'CONFIRMED').length
    const attendancePercent = Math.min(100, Math.round((confirmedCount / 30) * 100))

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      currentRank: student.currentRank,
      status: student.status,
      classNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
      kyuDan: rank?.kyuDan ?? null,
      beltColor: rank?.beltColor ?? null,
      masteredCount,
      requiredCount,
      attendancePercent,
    }
  })
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
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true, currentRank: true },
  })
  const ranks = await db.beltRank.findMany({ select: { name: true, kyuDan: true } })
  const rankByName = new Map(ranks.map((rank) => [rank.name, rank]))

  return computeBirthdays(
    students.map((student) => {
      const rank = rankByName.get(student.currentRank ?? '')
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        role: 'student' as const,
        birthDate: student.dateOfBirth,
        detail: rank ? `${rank.name} (${rank.kyuDan ?? ''})`.trim() : 'Alumno',
      }
    }),
  )
}

export async function getInstructorAttendanceBoard(userId: string): Promise<InstructorAttendanceBoardData> {
  const instructor = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  const attendances = await db.attendance.findMany({
    where: {
      student: {
        classEnrollments: {
          some: {
            status: 'ACTIVE',
            class: { instructorId: userId },
          },
        },
      },
    },
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
    instructorName: instructor?.name ?? 'Instructor',
    records,
    availableDates,
  }
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
        select: { studentId: true, present: true, status: true, notes: true },
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
        status: attendance?.status ?? null,
        justified: attendance?.status === 'JUSTIFIED',
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
    techniques: student.techniques.map(({ approved, approvedAt, inPractice, notes, practiceHours, technique, evaluation }) => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      category: technique.category,
      status: approved ? 'APPROVED' : inPractice ? 'IN_PROGRESS' : 'PENDING',
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
    availableTechniques,
  }
}

/**
 * Datos del modal "Asignar katas al expediente": catálogo agrupado por grado
 * (BeltRank) con sus katas requeridas y el estado de asignación del alumno.
 */
export async function getInstructorKataAssignment(
  userId: string,
  studentId: string,
): Promise<InstructorKataAssignmentData | null> {
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
      kyuDan: true,
      order: true,
      isMaximumRank: true,
      katas: {
        orderBy: { order: 'asc' },
        select: {
          kata: {
            select: {
              id: true,
              name: true,
              japaneseName: true,
              kanji: true,
              description: true,
            },
          },
        },
      },
    },
  })

  const assigned = await db.studentTechnique.findMany({
    where: { studentId: student.id },
    select: { techniqueId: true, approved: true, inPractice: true },
  })
  const assignedByTechnique = new Map(
    assigned.map((entry) => [
      entry.techniqueId,
      entry.approved ? 'APPROVED' : entry.inPractice ? 'IN_PROGRESS' : 'PENDING',
    ] as const),
  )

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    currentRank: student.currentRank,
    grades: ranks.map((rank) => ({
      rankId: rank.id,
      rankName: rank.name,
      kyuDan: rank.kyuDan,
      order: rank.order,
      isMaximumRank: rank.isMaximumRank,
      katas: rank.katas.map(({ kata }) => ({
        id: kata.id,
        name: kata.name,
        kanji: kata.kanji,
        japaneseName: kata.japaneseName,
        description: kata.description,
        assigned: assignedByTechnique.has(kata.id),
        status: assignedByTechnique.get(kata.id) ?? 'PENDING',
      })),
    })),
  }
}

/** Búsqueda de alumnos de la misma escuela para agregarlos al pase de lista. */
export async function getInstructorStudentsSearch(
  userId: string,
  query: string,
): Promise<InstructorStudentSearchResult[]> {
  const instructor = await db.user.findUnique({
    where: { id: userId },
    select: { schoolId: true },
  })

  if (!instructor?.schoolId) {
    return []
  }

  const classIds = await db.class.findMany({
    where: { instructorId: userId },
    select: { id: true },
  })
  const enrollments = await db.classEnrollment.findMany({
    where: { classId: { in: classIds.map(({ id }) => id) }, status: 'ACTIVE' },
    select: { studentId: true },
  })
  const enrolledSet = new Set(enrollments.map(({ studentId }) => studentId))

  const students = await db.student.findMany({
    where: {
      schoolId: instructor.schoolId,
      status: 'ACTIVE',
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { memberNumber: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 30,
    select: { id: true, firstName: true, lastName: true, currentRank: true },
  })

  return students.map((student) => ({
    ...student,
    enrolledInClass: enrolledSet.has(student.id),
  }))
}