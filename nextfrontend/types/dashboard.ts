export type DashboardRole =
	| 'STUDENT'
	| 'INSTRUCTOR'
	| 'SCHOOL_ADMIN'
	| 'SUPERADMIN'

export type TechniqueStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED'

export type TechniqueCategory = 'KIHON' | 'KATA' | 'KUMITE' | 'BUNKAI'

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
}

export interface StudentTechnique {
	id: string
	name: string
	description: string | null
	category: TechniqueCategory
	status: TechniqueStatus
	approvedAt: string | null
	notes: string | null
	practiceHours: number
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
	memberNumber: string | null
	currentRank: string | null
	kyuDan: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
	status: string
	branchName: string
	activeClassNames: string[],
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
	applicants: { id: string; name: string; dateOfBirth: string }[]
}

export interface AdminBeltRankSummary {
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
	notes: string | null
	technique: AdminTechniqueSummary
}

export interface AdminStudentDetail {
	id: string
	firstName: string
	lastName: string
	memberNumber: string | null
	currentRank: string | null
	currentRankOrder: number | null
	status: string
	branchName: string
	contactPhone: string | null
	dateOfBirth: string | null
	enrollmentDate: string | null
	medicalInfo: string | null
	emergencyContact: string | null
	documents: StudentDocumentSummary[]
	rankHistory: AdminRankHistoryEntry[]
	availableRanks: AdminBeltRankSummary[]
	techniques: AdminStudentTechnique[]
	rankAwardedAt: string | null
	attendancePercent: number | null
	attendedCount: number
	targetAttendances: number
	nextRankName: string | null
	nextRankKyuDan: string | null
	nextRankBeltColor: string | null
	nextRankRequiredKatas: number
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
	score: number | null
	lastFeedback: string | null
	lastPracticeDate: string | null
	evaluatedBy: string | null
	rankName: string | null
	requiredForGrade: boolean
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
	minMonths: number
	overallPercent: number
	isEligible: boolean
}

export interface StudentKataProgressSummary {
	grado: GradoProgressData
	katas: KataProgressItem[]
}

export interface StudentPracticeNote {
	techniqueId: string
	notes: string
	lastFeedback: string | null
}


export type AttendanceStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

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
	rankId: string | null
}

export interface AdminCurriculumData {
	ranks: AdminBeltRankSummary[]
	techniques: AdminTechniqueSummary[]
}