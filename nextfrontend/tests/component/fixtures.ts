import type {
  AttendanceSummary,
  ClassSchedule,
  DashboardBeltRank,
  GradoProgressData,
  KataProgressItem,
  StudentDashboardSummary,
  StudentKataProgressSummary,
  StudentProfile,
  StudentTechnique,
} from '@/types/dashboard'

export function beltRank(overrides: Partial<DashboardBeltRank> = {}): DashboardBeltRank {
  return {
    id: 'rank-blanco',
    name: 'Blanco',
    order: 1,
    kyuDan: '11TH KYU',
    japaneseName: null,
    kanji: null,
    beltColor: '#FFFFFF',
    beltSecondaryColor: null,
    isMaximumRank: false,
    minMonths: 3,
    minAttendancePercent: 80,
    estimatedDurationMonths: 3,
    description: null,
    ...overrides,
  }
}

export function technique(overrides: Partial<StudentTechnique> = {}): StudentTechnique {
  return {
    id: 't1',
    name: 'Kata Ichi',
    description: null,
    category: 'KATA',
    kihonCategory: null,
    kumiteCategory: null,
    level: null,
    beltColor: null,
    beltSecondaryColor: null,
    status: 'PENDING',
    approvedAt: null,
    notes: null,
    practiceHours: 0,
    practiceRepetitions: 0,
    targetRepetitions: null,
    evaluation: null,
    ...overrides,
  }
}

export function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'student-1',
    firstName: 'Ana',
    lastName: 'Uno',
    gender: 'FEMALE',
    email: 'ana@test.dev',
    contactPhone: null,
    dateOfBirth: '2000-07-10T12:00:00.000Z',
    currentRank: beltRank(),
    photoKey: null,
    photoUrl: null,
    guardianName: null,
    guardianRelationship: null,
    guardianPhone: null,
    medicalInfo: null,
    emergencyContact: null,
    giSize: null,
    beltSize: null,
    enrollmentDate: '2024-01-01T00:00:00.000Z',
    whatsappOptIn: false,
    ...overrides,
  }
}

export function attendanceSummary(overrides: Partial<AttendanceSummary> = {}): AttendanceSummary {
  return { attendedSessions: 8, totalSessions: 10, percentage: 80, ...overrides }
}

export function classSchedule(overrides: Partial<ClassSchedule> = {}): ClassSchedule {
  return {
    id: 'c1',
    name: 'Karate Niños',
    description: null,
    dayOfWeek: 1,
    startTime: '19:00',
    endTime: '21:00',
    instructorName: 'Sensei',
    ...overrides,
  }
}

export function summary(overrides: Partial<StudentDashboardSummary> = {}): StudentDashboardSummary {
  return {
    profile: profile(),
    attendance: attendanceSummary(),
    techniques: [technique()],
    upcomingClasses: [classSchedule()],
    ...overrides,
  }
}

export function kataProgress(overrides: Partial<KataProgressItem> = {}): KataProgressItem {
  return {
    id: 't1',
    name: 'Kata Ichi',
    description: null,
    status: 'PENDING',
    practiceHours: 0,
    practiceRepetitions: 0,
    targetRepetitions: null,
    score: null,
    criteria: null,
    lastFeedback: null,
    lastPracticeDate: null,
    evaluatedBy: null,
    rankName: null,
    level: null,
    beltColor: null,
    beltSecondaryColor: null,
    requiredForGrade: true,
    ...overrides,
  }
}

export function grado(overrides: Partial<GradoProgressData> = {}): GradoProgressData {
  return {
    currentRankName: 'Blanco',
    currentRankOrder: 1,
    nextRankName: 'Amarillo',
    beltColor: '#FFFFFF',
    approvedKatas: 1,
    requiredKatas: 2,
    attendance: attendanceSummary(),
    minAttendancePercent: 80,
    attendedSessions: 8,
    pendingSessions: 0,
    monthsInRank: 2,
    monthsInRankEstimated: false,
    minMonths: 3,
    overallPercent: 60,
    isEligible: false,
    examDay: 'SATURDAY',
    nextExam: null,
    cuatrimestres: [],
    hoursRequirement: null,
    currentPeriod: null,
    maxAbsencesPerMonth: 2,
    examRightLost: false,
    bottleneck: 'KATAS',
    attendanceMonths: [],
    monthly: null,
    ...overrides,
  }
}

export function kataSummary(overrides: Partial<StudentKataProgressSummary> = {}): StudentKataProgressSummary {
  return { grado: grado(), katas: [kataProgress()], ...overrides }
}
