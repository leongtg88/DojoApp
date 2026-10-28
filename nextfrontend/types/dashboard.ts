export type DashboardRole =
	| 'STUDENT'
	| 'GUARDIAN'
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

export type KihonCategory = 'DACHI' | 'TSUKI_WAZA' | 'UCHI_WAZA' | 'GERI_WAZA' | 'UKE_WAZA' | 'RENZOKU_WAZA' | 'IDO_KIHON'

export type KumiteCategory = 'GOHON_KUMITE' | 'SANBON_KUMITE' | 'IPPON_KUMITE' | 'JIYU_IPPON_KUMITE' | 'JIYU_KUMITE' | 'SHIAI_KUMITE'

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
	photoUrl?: string | null
	guardianName?: string | null
	guardianRelationship?: string | null
	guardianPhone?: string | null
	medicalInfo: string | null
	emergencyContact: string | null
	giSize: string | null
	beltSize: string | null
	enrollmentDate: string
	whatsappOptIn: boolean
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
	kihonCategory: KihonCategory | null
	kumiteCategory: KumiteCategory | null
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
	/** Notas por sub-criterio de kata (JSON). `null` para evaluaciones sin rúbrica. */
	criteria: Record<string, number> | null
	feedback: string | null
	evaluatedAt: string
	evaluatorName: string | null
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

/** Opción de horario para el selector de asistencia del instructor (incluye horarios de otros). */
export interface InstructorScheduleOption extends InstructorClassSummary {
	isOwnClass: boolean
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

export interface AttendanceJustificationSummary {
	id: string
	reason: string
	status: 'PENDING' | 'APPROVED' | 'REJECTED'
	reviewedByName: string | null
	reviewedAt: string | null
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
	justification?: AttendanceJustificationSummary | null
}

export interface InstructorAttendanceRoster {
	classId: string
	className: string
	date: string
	/** El horario consultado pertenece al instructor (puede guardar el pase de lista). */
	isOwnClass: boolean
	/** El pase de lista de esta clase/fecha ya fue guardado. */
	isPassTaken: boolean
	passTakenAt: string | null
	passTakenByName: string | null
	/** La fecha consultada coincide con el día de la semana de la clase. */
	dayMatches: boolean
	students: InstructorAttendanceStudent[]
}

export interface InstructorPendingJustification {
	id: string
	studentId: string
	studentName: string
	classId: string
	className: string
	date: string
	reason: string
	createdAt: string
}

export interface InstructorTechniqueReview {
	student: Pick<InstructorStudentSummary, 'id' | 'firstName' | 'lastName' | 'currentRank'> & { program: 'ADULT' | 'YOUTH' }
	techniques: StudentTechnique[]
	availableTechniques: AdminTechniqueSummary[]
	ranks: AdminBeltRankSummary[]
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
	giSize: string | null
	beltSize: string | null
	guardianManaged: boolean
	guardianName: string | null
	activeClassNames: string[],
	activeScheduleIds: string[],
	planId: string | null,
	planName: string | null,
	scholarshipType: ScholarshipType,
	scholarshipNote: string | null,
	isCompetitor: boolean,
	needsPlan: boolean,
	needsSchedule: boolean,
	countsForPending: boolean,
	techniques: AdminTechniqueSummary[],
	studentCount: number
	kataMasteredCount: number
	kataTotalCount: number
	pendingDocumentCount: number
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
		justifications: number
		/** Justificación pendiente más antigua: destino del enlace de Hoy. */
		oldestJustification: { classId: string; date: string } | null
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
	giSize: string | null
	beltSize: string | null
	guardianManaged: boolean
	guardianName: string | null
	documents: StudentDocumentSummary[]
	rankHistory: AdminRankHistoryEntry[]
	availableRanks: AdminBeltRankSummary[]
	catalogTechniques: AdminTechniqueSummary[]
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

export interface AdminAttendancePracticeLog {
	techniqueName: string
	repetitions: number
	place: 'DOJO' | 'FUERA'
}

export interface AdminAttendanceItem {
	id: string
	date: string
	present: boolean
	hoursTrained: number
	sessionType: string | null
	status: AttendanceStatus
	notes: string | null
	punchedAt: string
	confirmedAt: string | null
	confirmedByName: string | null
	className: string | null
	branchId: string | null
	branchName: string | null
	isOutOfSchedule: boolean
	practiceLogs: AdminAttendancePracticeLog[]
	student: {
		id: string
		firstName: string
		lastName: string
		memberNumber: string | null
		planName: string | null
	}
}

export interface AdminAttendanceBranch {
	id: string
	name: string
}

export type AdminExpectedAttendanceState = 'PRESENT' | 'ABSENT' | 'PUNCH' | 'NONE'

export interface AdminExpectedAttendanceStudent {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	state: AdminExpectedAttendanceState
	status: AttendanceStatus | null
	hoursTrained: number
	notes: string | null
	outOfSchedule: boolean
	justification: AttendanceJustificationSummary | null
}

export interface AdminExpectedAttendanceSummary {
	audited: number
	expected: number
	registered: number
	present: number
	absent: number
	noRecord: number
	justificationsPending: number
}

export interface AdminExpectedAttendanceInstructor {
	id: string
	name: string
	/** El instructor a cargo también tiene expediente de alumno e inscripción activa en la clase. */
	isEnrolled: boolean
	/** Grado actual del instructor cuando tiene expediente de alumno. */
	currentRank: string | null
}

/** Alumno inscrito que además es personal/instructor (rol INSTRUCTOR en su cuenta). */
export interface AdminExpectedAttendanceStaff {
	id: string
	name: string
	currentRank: string | null
}

export interface AdminExpectedAttendanceRoster {
	classId: string
	className: string
	branchName: string
	date: string
	dayMatches: boolean
	/** Día de la semana configurado para la clase (0=domingo). */
	classDayOfWeek: number
	/** El instructor ya cerró el pase de lista de esta clase/fecha. */
	passTaken: boolean
	passTakenAt: string | null
	passTakenByName: string | null
	/** Instructor a cargo de la clase. Se muestra aparte y no entra en la lista de alumnos. */
	instructor: AdminExpectedAttendanceInstructor | null
	/** Inscritos que son instructores/personal. Se muestran aparte y no cuentan como alumnos. */
	staff: AdminExpectedAttendanceStaff[]
	students: AdminExpectedAttendanceStudent[]
	summary: AdminExpectedAttendanceSummary
}

export interface DashboardBirthday {
	id: string
	name: string
	/** Clave "YYYY-MM-DD" del cumpleaños (fecha de calendario, sin hora). */
	dateOfBirth: string
	daysUntil: number
	role: 'student' | 'instructor'
	isToday: boolean
	detail: string | null
}

/** Qué pasa con el derecho a examen si el alumno repone después del cierre. */
export type AbsencePostClosePolicy = 'LOCK_AT_CLOSE' | 'RESTORE_ON_RECOVERY'

export interface AttendanceSummary {
	attendedSessions: number
	totalSessions: number
	percentage: number
	/** Faltas justificadas eximidas del % mínimo (máx. 2 por mes). */
	forgivenSessions?: number
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
	criteria: Record<string, number> | null
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

export type GradoMetric = 'KATAS' | 'PERMANENCIA' | 'HORAS' | 'ASISTENCIA'

export interface AttendanceMonthProgress {
	label: string
	/** Asistencias presentadas (tatami) en el mes, incluidas las justificadas eximidas. */
	attendedSessions: number
	/** Sesiones máximas que el horario permite en el mes (sin feriados). */
	capacitySessions: number
	/** Faltas justificadas eximidas del % (máx. 2 por mes). */
	forgivenSessions?: number
	/** Faltas repuestas que se acreditan en su mes original. */
	recoveredSessions?: number
	/** Total acreditado: repuestas + justificadas eximidas. */
	creditedSessions?: number
	/** Asistencia del mes en porcentaje. */
	percent: number
	/** Mínimo exigido por el grado. */
	required: number
	met: boolean
}

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
	/** Horas de tatami (clase regular + extra) en el cuatrimestre. */
	classHours: number
	/** Asistencias presentadas en el cuatrimestre (clase + punch, incluye PENDING). */
	classSessions: number
	/** Horas de entrenamiento en casa / libre (sin clase coincidente, classId null). */
	libreHours: number
	/** Clases de tipo class fuera de su horario de referencia (extra). */
	extraClasses: number
	hoursMet: boolean
	hoursExempt: boolean
	absences: number
	monthAbsences: MonthAbsence[]
	maxMonthAbsences: number
	excessMonth: string | null
	exceededAbsenceLimit: boolean
	/** Faltas 3.ª+ del cuatrimestre que siguen sin reponerse. */
	pendingRecoveries: number
	/** Reposiciones hechas después del cierre (no restauran bajo LOCK). */
	lateRecoveries: number
	/** Política vigente al cierre del cuatrimestre (o la actual si sigue abierto). */
	absencePolicy: AbsencePostClosePolicy
	isCurrent: boolean
	isFuture: boolean
	examDate: string | null
	examTentative: boolean
}

export interface GradeHoursRequirement {
	/** Horas de tatami (clase regular + extra) del tramo. Base del mínimo exigido para el examen. */
	classHours: number
	/** Horas de entrenamiento en casa / libre del tramo (no cuentan para el mínimo de tatami). */
	libreHours: number
	/** Horas totales de entrenamiento del tramo (tatami + libre). */
	totalHours: number
	requiredHours: number | null
	/** Meta ya descontado el crédito acumulado de grados previos. */
	effectiveRequiredHours: number | null
	/** Crédito heredado de grados previos. */
	creditHours: number
	capacityHours: number
	label: string
	exempt: boolean
	met: boolean
}

export interface MonthAbsence {
	label: string
	/** Total de faltas del mes, incluidas las repuestas. */
	count: number
	max: number
	/** Faltas del mes marcadas como repuestas. */
	recovered: number
	/** Faltas por encima del cupo mensual (informativo). */
	excess: number
	/** Faltas 3.ª+ sin reponer. */
	pendingRecovery: number
	/** Reposiciones hechas después del cierre del cuatrimestre. */
	lateRecovery: number
}

export interface CurrentPeriod {
	label: string
	classSessions: number
	capacitySessions: number
	classHours: number
	requiredHours: number | null
	libreHours: number
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
	/** Clases presentadas (confirmadas + PENDING) acumuladas en el grado. */
	attendedSessions: number
	/** Clases PENDING (punch sin confirmar) en el grado, para el aviso. */
	pendingSessions: number
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
	/** Política actual de la escuela para reposiciones posteriores al cierre. */
	absencePolicy: AbsencePostClosePolicy
	/** Hay faltas 3.ª+ sin reponer, pero el cuatrimestre aún no cierra. */
	examAtRisk: boolean
	examRightLost: boolean
	/** Faltas 3.ª+ sin reponer en el tramo del grado. */
	pendingRecoveries: number
	bottleneck: GradoMetric | null
	/** Asistencia por mes del tramo del examen (la elegibilidad exige el mínimo en cada uno). */
	attendanceMonths: AttendanceMonthProgress[]
	/** Progreso del mes en curso. Informativo: no cuenta para `overallPercent` ni elegibilidad. */
	monthly: MonthlyProgressInfo | null
}

export interface MonthlyProgressInfo {
	planName: string | null
	confirmedHours: number
	expectedHours: number | null
	percent: number
	balanceLevel: BalanceLevel
	isUnlimited: boolean
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


export type AttendanceStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'JUSTIFIED' | 'ABSENT'

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
	/** Si el instructor que consulta puede validar/confirmar este registro (pertenece a su grupo). */
	canValidate?: boolean
	practiceLogs?: Array<{
		id: string
		techniqueId: string | null
		techniqueName: string
		repetitions: number
		place: 'DOJO' | 'FUERA'
	}>
}

export interface StudentPracticeKataLevel {
	program: 'ADULT' | 'YOUTH'
	rankName: string
	kyuDan: string | null
	order: number
	level: string | null
	beltColor: string | null
	beltSecondaryColor: string | null
}

export interface StudentPracticeTechniqueOption {
	id: string
	name: string
	japaneseName: string | null
	category: TechniqueCategory
	/** Orden pedagógico dentro del grado (para listar por grado, no alfabético). */
	order: number
	kihonCategory: KihonCategory | null
	kumiteCategory: KumiteCategory | null
	targetRepetitions: number | null
	practiceRepetitions: number
	/** true si está en el expediente del alumno; sólo esas suman a su experiencia. */
	assigned: boolean
	/** Grados de introducción de la kata (uno por programa). Vacío si no es kata. */
	kataLevels: StudentPracticeKataLevel[]
}

export interface StudentAbsenceJustification {
	id: string
	classId: string
	className: string
	date: string
	reason: string
	status: 'PENDING' | 'APPROVED' | 'REJECTED'
	reviewedByName: string | null
	reviewedAt: string | null
	createdAt: string
	/** La falta justificada ya fue repuesta por el alumno. */
	recovered: boolean
	/** Fecha de la asistencia de reposición (fuera de horario). */
	recoveryDate: string | null
	/** La reposición se hizo después del cierre del cuatrimestre. */
	lateRecovery: boolean
}

export type OnlineRecoveryStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface OnlineRecoverySummary {
	id: string
	studentId: string
	studentName: string
	absenceId: string
	/** Fecha de la falta original (clave YYYY-MM-DD). */
	absenceDate: string
	/** La falta ya fue repuesta (por esta clase o por otra asistencia). */
	absenceRecovered: boolean
	className: string | null
	status: OnlineRecoveryStatus
	/** Fecha/hora acordada (instante ISO). */
	scheduledAt: string
	durationMinutes: number
	instructorId: string | null
	instructorName: string | null
	meetingUrl: string | null
	costAmount: number | null
	costCurrency: string
	costNote: string | null
	costInformedAt: string | null
	notes: string | null
	completedAt: string | null
}

export interface OnlineRecoveryCandidate {
	absenceId: string
	studentId: string
	studentName: string
	/** Fecha de la falta (clave YYYY-MM-DD). */
	date: string
	className: string | null
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
	justifications: StudentAbsenceJustification[]
	onlineRecoveries: OnlineRecoverySummary[]
	practiceTechniques: StudentPracticeTechniqueOption[]
	/** Programa del alumno según su edad; define el filtro por defecto. */
	program: 'ADULT' | 'YOUTH'
	/** Horarios de referencia del alumno, para sugerir la hora de la práctica. */
	schedule: ClassSchedule[]
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
	kihonCategory: KihonCategory | null
	kumiteCategory: KumiteCategory | null
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

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ReviewSummary {
	id: string
	authorName: string
	relationship: string | null
	email: string | null
	rating: number
	message: string
	status: ReviewStatus
	createdAt: string
	approvedAt: string | null
}

export type WhatsAppMessageDirection = 'INBOUND' | 'OUTBOUND'

export type WhatsAppMessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'RECEIVED' | 'FAILED'

export interface AdminWhatsAppMessage {
	id: string
	direction: WhatsAppMessageDirection
	fromNumber: string | null
	toNumber: string | null
	body: string | null
	templateName: string | null
	status: WhatsAppMessageStatus
	errorCode: string | null
	createdAt: string
	sentAt: string | null
}

export interface AdminWhatsAppConversation {
	id: string
	phone: string
	userId: string | null
	userName: string | null
	optIn: boolean
	lastInboundAt: string | null
	updatedAt: string
	lastMessage: string | null
	lastMessageAt: string | null
	lastDirection: WhatsAppMessageDirection | null
	withinServiceWindow: boolean
}

export interface AdminWhatsAppThread extends AdminWhatsAppConversation {
	messages: AdminWhatsAppMessage[]
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

export type BalanceLevel = 'OK' | 'LOW' | 'HIGH' | 'VERY_HIGH'

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
	/**
	 * Ids de todas las técnicas asignadas al alumno, incluidas las que no están
	 * enlazadas a ningún grado. Se preservan al guardar el modal para no borrarlas.
	 */
	assignedTechniqueIds: string[]
}

export interface InstructorStudentSearchResult {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	enrolledInClass: boolean
}

export interface InstructorAssignableStudent {
	id: string
	firstName: string
	lastName: string
	currentRank: string | null
	branchName: string
	activeClassNames: string[]
}