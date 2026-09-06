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
	currentRank: string | null
	status: string
	branchName: string
	activeClassNames: string[]
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
	techniqueCount: number
}

export interface AdminRankHistoryEntry {
	id: string
	rankName: string
	rankOrder: number
	promotedAt: string
	promoterName: string | null
	notes: string | null
}

export interface AdminStudentDetail {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	currentRankOrder: number | null
	status: string
	branchName: string
	contactPhone: string | null
	documents: StudentDocumentSummary[]
	rankHistory: AdminRankHistoryEntry[]
	availableRanks: AdminBeltRankSummary[]
}

export interface AdminAttendanceRecord {
	id: string
	studentName: string
	className: string
	branchName: string
	date: string
	present: boolean
	notes: string | null
}

export interface DashboardBirthday {
	id: string
	name: string
	dateOfBirth: string
	daysUntil: number
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
