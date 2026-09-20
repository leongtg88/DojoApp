export type DashboardRole =
	| 'STUDENT'
	| 'INSTRUCTOR'
	| 'SCHOOL_ADMIN'
	| 'SUPERADMIN'

export interface RegistrationField {
	label: string
	value: string | number | null
}

export interface RegistrationGroup {
	title: string
	fields: RegistrationField[]
}

export interface RegistrationApplicant {
	id: string
	name: string
	dateOfBirth: string | null
}

export interface StudentRegistrationView {
	origin: 'FORM' | 'ASSISTANT' | 'MANUAL'
	status: string | null
	registeredAt: string | null
	applicantName: string | null
	hasForm: boolean
	groups: RegistrationGroup[]
	applicants: RegistrationApplicant[]
}

export type TechniqueStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED'

export type TechniqueCategory = 'KIHON' | 'KATA' | 'KUMITE' | 'BUNKAI'

export type PracticePlace = 'DOJO' | 'FUERA'

export interface TechniquePracticeLogEntry {
	id: string
	date: string
	repetitions: number
	place: PracticePlace
	notes: string | null
}

export interface DashboardBeltRank {
	id: string
	name: string
	order: number
	kyuDan: string | null
	japaneseName: string | null
	kanji: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	isMaximumRank: boolean
	minMonths: number | null
	minAttendancePercent: number | null
	estimatedDurationMonths: number | null
	description: string | null
}

export interface StudentProfile {
	id: string
	firstName: string
	lastName: string
	gender: string | null
	email: string | null
	contactPhone: string | null
	dateOfBirth: string
	currentRank: DashboardBeltRank | null
	photoKey: string | null
	medicalInfo: string | null
	emergencyContact: string | null
	enrollmentDate: string
}

export interface StudentDocumentSummary {
	id: string
	type: 'PROFILE_PHOTO' | 'IDENTITY' | 'BIRTH_CERTIFICATE' | 'PASSPORT' | 'MEDICAL_CERTIFICATE' | 'OTHER'
	status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
	fileName: string
	mimeType: string
	fileSize: number
	reviewNotes: string | null
	uploadedAt: string
	url?: string | null
}

export interface StudentTechnique {
	id: string
	name: string
	description: string | null
	category: TechniqueCategory
	level: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	status: TechniqueStatus
	approvedAt: string | null
	notes: string | null
	practiceHours: number
	practiceRepetitions: number
	targetRepetitions: number | null
	evaluation: TechniqueEvaluation | null
}

export interface TechniqueEvaluation {
	score: number
	feedback: string | null
	evaluatedAt: string
	evaluatorName: string | null
}

export interface TechniqueCatalogItem {
	id: string
	name: string
	description: string | null
	category: TechniqueCategory
}

export interface ClassSchedule {
	id: string
	name: string
	description: string | null
	dayOfWeek: number
	startTime: string
	endTime: string
	instructorName: string | null
}

export interface InstructorClassSummary extends ClassSchedule {
	branchName: string
	activeStudentCount: number
}

export interface InstructorStudentSummary {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	status: string
	classNames: string[]
	kyuDan: string | null
	beltColor: string | null
	masteredCount: number
	requiredCount: number
	attendancePercent: number
}

export interface InstructorAttendanceStudent {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	present: boolean
	notes: string | null
	status?: string | null
	justified?: boolean
}

export interface InstructorAttendanceRoster {
	classId: string
	className: string
	date: string
	students: InstructorAttendanceStudent[]
}

export interface InstructorTechniqueReview {
	student: Pick<InstructorStudentSummary, 'id' | 'firstName' | 'lastName' | 'currentRank'>
	techniques: StudentTechnique[]
	availableTechniques: TechniqueCatalogItem[]
}

export interface AdminStudentSummary {
	id: string
	firstName: string
	lastName: string
	gender: string | null
	memberNumber: string | null
	currentRank: string | null
	kyuDan: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	status: string
	email: string | null
	accountStatus: 'SIN_CUENTA' | 'INVITADO' | 'ACTIVO'
	branchName: string
	branchId: string | null
	dateOfBirth: string | null
	contactPhone: string | null
	medicalInfo: string | null
	emergencyContact: string | null
	activeClassNames: string[],
	activeScheduleIds: string[],
	planId: string | null,
	planName: string | null,
	scholarshipType: ScholarshipType,
	scholarshipNote: string | null,
	isCompetitor: boolean,
	needsPlan: boolean,
	needsSchedule: boolean,
	techniques: AdminTechniqueSummary[],
	studentCount: number
	kataMasteredCount: number
	kataTotalCount: number
	attendancePercent: number | null
	rankAwardedAt: string | null
	nextRankName: string | null
	nextRankKyuDan: string | null
	nextRankBeltColor: string | null
}

export interface AdminDashboardSummary {
	studentCount: number
	activeEnrollmentCount: number
	classCount: number
	pendingCases: {
		noPlan: number
		noSchedule: number
	}
}

export interface AdminInstructorCandidate {
	studentId: string
	userId: string
	name: string
	email: string
	memberNumber: string | null
	currentRank: string | null
	isInstructor: boolean
}

export interface AdminEnrollmentSummary {
	id: string
	applicantName: string | null
	contactEmail: string
	contactPhone: string | null
	interest: string | null
	schedule: string | null
	status: string
	createdAt: string
	createdAtLabel?: string
	applicants: { id: string; name: string; dateOfBirth: string; profileData?: { sexo?: string } | Record<string, unknown> | null }[]
}

export interface AdminBeltRankSummary {
	id: string
	program: 'ADULT' | 'YOUTH'
	name: string
	order: number
	kyuDan: string | null
	japaneseName: string | null
	kanji: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	isMaximumRank: boolean
	minMonths: number | null
	maxMonths: number | null
	minAttendancePercent: number | null
	estimatedDurationMonths: number | null
	description: string | null
	examDay: ExamDay | null
	techniqueCount: number
	studentCount: number
	techniques: AdminTechniqueSummary[]
}

export interface AdminRankHistoryEntry {
	id: string
	rankName: string
	rankOrder: number
	promotedAt: string
	promoterName: string | null
	examinerName: string | null
	notes: string | null
}

export interface AdminStudentTechnique {
	id: string
	status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED'
	approved: boolean
	approvedAt: string | null
	inPractice: boolean
	practiceHours: number
	practiceRepetitions: number
	notes: string | null
	technique: AdminTechniqueSummary
	practiceLogs: TechniquePracticeLogEntry[]
}

export interface AdminStudentAttendanceRecord {
	id: string
	date: string
	present: boolean
	hoursTrained: number
	sessionType: string | null
	status: string
	className: string | null
	confirmedByName: string | null
	notes: string | null
}

export interface AdminStudentDetail {
	id: string
	firstName: string
	lastName: string
	gender: string | null
	memberNumber: string | null
	currentRank: string | null
	currentRankOrder: number | null
	status: string
	branchName: string
	email: string | null
	accountStatus: 'SIN_CUENTA' | 'INVITADO' | 'ACTIVO'
	contactPhone: string | null
	dateOfBirth: string | null
	enrollmentDate: string | null
	medicalInfo: string | null
	emergencyContact: string | null
	documents: StudentDocumentSummary[]
	rankHistory: AdminRankHistoryEntry[]
	availableRanks: AdminBeltRankSummary[]
	techniques: AdminStudentTechnique[]
	attendanceHistory: AdminStudentAttendanceRecord[]
	rankAwardedAt: string | null
	attendancePercent: number | null
	attendedCount: number
	targetAttendances: number
	nextRankName: string | null
	nextRankKyuDan: string | null
	nextRankBeltColor: string | null
	nextRankRequiredKatas: number
	planId: string | null
	planName: string | null
	planMonthlyHours: number | null
	isUnlimitedPlan: boolean
	planStartDate: string | null
	scholarshipType: ScholarshipType
	scholarshipNote: string | null
	isCompetitor: boolean
	activeScheduleIds: string[]
	activeScheduleNames: string[]
	registration: StudentRegistrationView
}

export interface AdminAttendanceRecord {
	id: string
	studentName: string
	className: string | null
	branchName: string | null
	date: string
	present: boolean
	hoursTrained: number
	sessionType: string | null
	status: AttendanceStatus
	confirmedByName: string | null
	notes: string | null
}

export interface DashboardBirthday {
	id: string
	name: string
	dateOfBirth: string
	daysUntil: number
	role: 'student' | 'instructor'
	isToday: boolean
	detail: string | null
}

export interface AttendanceSummary {
	attendedSessions: number
	totalSessions: number
	percentage: number
}

export interface StudentAttendanceRecord {
	id: string
	date: string
	className: string
	present: boolean
	notes: string | null
}

export interface StudentDashboardSummary {
	profile: StudentProfile
	attendance: AttendanceSummary
	techniques: StudentTechnique[]
	upcomingClasses: ClassSchedule[]
}

export type KataStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED'

export interface KataProgressItem {
	id: string
	name: string
	description: string | null
	status: KataStatus
	practiceHours: number
	practiceRepetitions: number
	targetRepetitions: number | null
	score: number | null
	lastFeedback: string | null
	lastPracticeDate: string | null
	evaluatedBy: string | null
	rankName: string | null
	level: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	requiredForGrade: boolean
}

export type ExamDay = 'SATURDAY' | 'SUNDAY'

export type GradoMetric = 'KATAS' | 'PERMANENCIA' | 'HORAS'

export interface CuatrimestreProgress {
	year: number
	index: number
	label: string
	start: string
	end: string
	expectedKatas: number
	approvedKatas: number
	/** Horas mínimas del plan para este cuatrimestre (monthlyHours × meses). `null` si ilimitado o sin plan. */
	requiredHours: number | null
	/** Horas máximas que el horario del alumno permite en el cuatrimestre. */
	capacityHours: number
	/** Sesiones máximas que el horario del alumno permite en el cuatrimestre. */
	capacitySessions: number
	/** Horas de las clases asistidas en su horario de referencia. */
	classHours: number
	/** Clases asistidas en su horario de referencia. */
	classSessions: number
	/** Horas de entrenamiento que no es su clase regular (libre/casa + fuera de horario). */
	extraHours: number
	/** Clases de tipo class fuera de su horario de referencia. */
	extraClasses: number
	hoursMet: boolean
	hoursExempt: boolean
	absences: number
	monthAbsences: MonthAbsence[]
	maxMonthAbsences: number
	excessMonth: string | null
	exceededAbsenceLimit: boolean
	isCurrent: boolean
	isFuture: boolean
	examDate: string | null
	examTentative: boolean
}

export interface GradeHoursRequirement {
	/** Horas de las clases asistidas en el tramo del grado. */
	classHours: number
	requiredHours: number | null
	/** Meta ya descontado el crédito acumulado de grados previos. */
	effectiveRequiredHours: number | null
	/** Horas extra (casa/fuera de horario) del tramo, ponderables. */
	extraHours: number
	/** Crédito heredado de grados previos. */
	creditHours: number
	capacityHours: number
	label: string
	exempt: boolean
	met: boolean
}

export interface MonthAbsence {
	label: string
	count: number
	max: number
}

export interface CurrentPeriod {
	label: string
	classSessions: number
	capacitySessions: number
	classHours: number
	requiredHours: number | null
	extraHours: number
	extraClasses: number
	creditHours: number
	monthAbsences: MonthAbsence[]
	totalAbsences: number
	maxAbsencesTotal: number
	exempt: boolean
	met: boolean
}

export interface NextExamInfo {
	date: string
	examDay: ExamDay
	cuatrimestreLabel: string
	tentative: boolean
}

export interface GradoProgressData {
	currentRankName: string | null
	currentRankOrder: number | null
	nextRankName: string | null
	beltColor: string | null
	approvedKatas: number
	requiredKatas: number
	attendance: AttendanceSummary
	minAttendancePercent: number
	monthsInRank: number
	monthsInRankEstimated: boolean
	minMonths: number
	overallPercent: number
	isEligible: boolean
	examDay: ExamDay | null
	nextExam: NextExamInfo | null
	cuatrimestres: CuatrimestreProgress[]
	hoursRequirement: GradeHoursRequirement | null
	currentPeriod: CurrentPeriod | null
	maxAbsencesPerMonth: number
	examRightLost: boolean
	bottleneck: GradoMetric | null
}

export interface StudentKataProgressSummary {
	grado: GradoProgressData
	katas: KataProgressItem[]
}

export interface HolidaySummary {
	id: string
	name: string
	date: string
	recurring: boolean
}

export interface ExamConvocationSummary {
	id: string
	date: string
	examDay: ExamDay
	label: string | null
	notes: string | null
	confirmed: boolean
}

export interface StudentPracticeNote {
	techniqueId: string
	notes: string
	lastFeedback: string | null
}


export type AttendanceStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'JUSTIFIED'

export interface AttendanceRecord {
	id: string
	studentId: string
	studentName: string
	date: string
	hoursTrained: number
	sessionType: string | null
	status: AttendanceStatus
	present: boolean
	confirmedByName: string | null
	notes: string | null
	punchedAt: string
	isOutOfSchedule?: boolean
	className?: string | null
	sessionId?: string | null
}

export interface StudentPracticeTechniqueOption {
	id: string
	name: string
	category: TechniqueCategory
	targetRepetitions: number | null
	practiceRepetitions: number
}

export interface StudentAttendancePunchData {
	summary: {
		confirmedCount: number
		pendingCount: number
		totalHours: number
		targetAttendances: number
		attendancePercent: number
	}
	records: AttendanceRecord[]
	availableTechniques: StudentPracticeTechniqueOption[]
}

export interface InstructorAttendanceBoardData {
	pendingCount: number
	confirmedCount: number
	totalHours: number
	instructorName: string
	records: AttendanceRecord[]
	availableDates: string[]
}

export interface AdminTechniqueSummary {
	id: string
	name: string
	japaneseName: string | null
	kanji: string | null
	description: string | null
	category: TechniqueCategory
	order: number
	difficulty: string | null
	embusen: string | null
	movementsCount: number | null
	videoUrl: string | null
	repetitionsCount: number | null
	stance: string | null
	level: string | null
	kumiteType: string | null
	distance: string | null
	role: string | null
	applicationType: string | null
	originKataId: string | null
	originKataName: string | null
	rankIds: string[]
}

export interface AdminCurriculumData {
	ranks: AdminBeltRankSummary[]
	techniques: AdminTechniqueSummary[]
}

// ==================== Planes, horarios y balance ====================

export type ScholarshipType = 'NONE' | 'ECONOMIC' | 'MERIT' | 'COMPETITOR'

export interface PlanSummary {
	id: string
	name: string
	description: string | null
	monthlyHours: number
	price: number | null
	isUnlimited: boolean
	active: boolean
	sortOrder: number
	studentCount?: number
}

export type ScheduleAudience = 'ADULTS' | 'CHILDREN' | 'MIXED'

export interface ScheduleOption {
	id: string
	name: string
	audience: ScheduleAudience
	active: boolean
	dayOfWeek: number
	startTime: string
	endTime: string
	branchId: string
	branchName: string
	instructorId: string | null
	instructorName: string | null
	activeStudentCount?: number
}

export interface AdminScheduleSummary extends ScheduleOption {
	description: string | null
	enrolledStudentIds: string[]
}

export interface AdminInstructor {
	id: string
	name: string
}

export interface StudentPendingRecovery {
	id: string
	date: string
	className: string | null
}

export type BalanceLevel = 'OK' | 'LOW' | 'HIGH' | 'VERY_HIGH'

export interface StudentMonthlyStatus {
	plan: PlanSummary | null
	planStartDate: string | null
	scholarshipType: ScholarshipType
	scholarshipNote: string | null
	isCompetitor: boolean
	confirmedHours: number
	expectedHours: number | null
	balanceDiff: number | null
	balanceLevel: BalanceLevel
	balanceAlert: boolean
	balanceMessage: string
	pendingRecoveries: StudentPendingRecovery[]
	outOfScheduleCount: number
	needsPlan: boolean
	needsSchedule: boolean
}

export interface AdminBalanceRow {
	studentId: string
	studentName: string
	memberNumber: string | null
	currentRank: string | null
	planId: string | null
	planName: string | null
	planMonthlyHours: number | null
	isUnlimited: boolean
	scholarshipType: ScholarshipType
	isCompetitor: boolean
	confirmedHours: number
	balanceDiff: number | null
	balanceLevel: BalanceLevel
	balanceAlert: boolean
	balanceMessage: string
	outOfScheduleCount: number
}

export interface InstructorKataGradeItem {
	id: string
	name: string
	kanji: string | null
	japaneseName: string | null
	description: string | null
	assigned: boolean
	status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED'
}

export interface InstructorKataGrade {
	rankId: string
	rankName: string
	kyuDan: string | null
	order: number
	beltColor: string | null
	beltSecondaryColor: string | null
	isMaximumRank: boolean
	katas: InstructorKataGradeItem[]
}

export interface InstructorKataAssignmentData {
	studentId: string
	studentName: string
	currentRank: string | null
	grades: InstructorKataGrade[]
}

export interface InstructorStudentSearchResult {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	enrolledInClass: boolean
}