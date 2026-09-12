import { REGISTRATION_FIELD_SPECS, pickBestEnrollment, resolveRegistrationSources, buildRegistrationFlatValues } from '@/lib/dashboard/registration-data'
import type { EnrollmentFormSource } from '@/lib/dashboard/registration-data'

export interface StudentExportSource {
	id: string
	firstName: string
	lastName: string
	gender: string | null
	memberNumber: string | null
	dateOfBirth: Date | string | null
	email: string | null
	contactPhone: string | null
	currentRank: string | null
	status: string
	enrollmentDate: Date | string | null
	scholarshipType: string
	isCompetitor: boolean
	branchName: string
	planName: string | null
	accountStatus: 'SIN_CUENTA' | 'INVITADO' | 'ACTIVO'
	activeClassNames: string[]
	registrationData?: Record<string, unknown> | null
	enrollments?: EnrollmentFormSource[] | null
}

export interface ExportColumn {
	key: string
	label: string
}

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino' }
const SCHOLARSHIP_LABELS: Record<string, string> = {
	NONE: 'Sin beca',
	ECONOMIC: 'Beca económica',
	MERIT: 'Beca por mérito',
	COMPETITOR: 'Competidor',
}
const ORIGIN_LABELS: Record<string, string> = {
	FORM: 'Formulario web',
	ASSISTANT: 'Asistente virtual',
	MANUAL: 'Registro manual',
}
const ACCOUNT_LABELS: Record<string, string> = {
	ACTIVO: 'Activa',
	INVITADO: 'Pendiente de registro',
	SIN_CUENTA: 'Sin cuenta',
}

export const STUDENT_EXPORT_COLUMNS: ExportColumn[] = [
	{ key: 'memberNumber', label: 'Matrícula' },
	{ key: 'firstName', label: 'Nombre' },
	{ key: 'lastName', label: 'Apellidos' },
	{ key: 'gender', label: 'Sexo' },
	{ key: 'dateOfBirth', label: 'Fecha de nacimiento' },
	{ key: 'email', label: 'Email' },
	{ key: 'contactPhone', label: 'Teléfono' },
	{ key: 'branchName', label: 'Sucursal' },
	{ key: 'currentRank', label: 'Grado actual' },
	{ key: 'status', label: 'Estado' },
	{ key: 'accountStatus', label: 'Cuenta' },
	{ key: 'planName', label: 'Plan' },
	{ key: 'scholarship', label: 'Beca' },
	{ key: 'activeClassNames', label: 'Horario(s)' },
	{ key: 'enrollmentDate', label: 'Fecha de alta' },
	{ key: 'registrationOrigin', label: 'Origen de inscripción' },
	{ key: 'registrationStatus', label: 'Estado de inscripción' },
	{ key: 'registrationDate', label: 'Fecha de inscripción' },
	{ key: 'registrationApplicants', label: 'Aspirantes de la solicitud' },
	...REGISTRATION_FIELD_SPECS.map((spec) => ({ key: spec.key, label: `${spec.groupLabel}: ${spec.label}` })),
]

function toISODate(value: Date | string | null | undefined): string | null {
	if (!value) return null
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return null
	return date.toISOString().slice(0, 10)
}

export function buildStudentExportRecord(source: StudentExportSource): Record<string, string | number | null> {
	const { perfilData, enrollmentFormData } = resolveRegistrationSources({
		registrationData: source.registrationData ?? null,
		enrollments: source.enrollments ?? null,
	})
	const enrollment = pickBestEnrollment(source.enrollments ?? null)

	const record: Record<string, string | number | null> = {
		memberNumber: source.memberNumber,
		firstName: source.firstName,
		lastName: source.lastName,
		gender: source.gender ? GENDER_LABELS[source.gender] ?? source.gender : null,
		dateOfBirth: toISODate(source.dateOfBirth),
		email: source.email,
		contactPhone: source.contactPhone,
		branchName: source.branchName,
		currentRank: source.currentRank,
		status: source.status,
		accountStatus: ACCOUNT_LABELS[source.accountStatus] ?? source.accountStatus,
		planName: source.planName,
		scholarship: SCHOLARSHIP_LABELS[source.scholarshipType] ?? source.scholarshipType,
		activeClassNames: source.activeClassNames.length > 0 ? source.activeClassNames.join(' · ') : null,
		enrollmentDate: toISODate(source.enrollmentDate),
		registrationOrigin: ORIGIN_LABELS[enrollment?.origin ?? ''] ?? 'Registro manual',
		registrationStatus: enrollment?.status ?? null,
		registrationDate: enrollment ? new Date(enrollment.createdAt).toISOString() : null,
		registrationApplicants:
			enrollment && enrollment.applicants && enrollment.applicants.length > 0
				? enrollment.applicants.map((applicant) => applicant.name).join(' · ')
				: null,
	}

	Object.assign(record, buildRegistrationFlatValues(perfilData, enrollmentFormData))
	return record
}

export function buildStudentExportRow(source: StudentExportSource): (string | number | null)[] {
	const record = buildStudentExportRecord(source)
	return STUDENT_EXPORT_COLUMNS.map((column) => record[column.key] ?? null)
}

export interface EnrollmentExportSource {
	id: string
	origin: string
	applicantName?: string | null
	contactEmail: string
	contactPhone?: string | null
	interest?: string | null
	schedule?: string | null
	quote?: string | null
	notes?: string | null
	createdAt?: Date | string | null
	registrationData?: Record<string, unknown> | null
	applicants?: { name: string; dateOfBirth: Date | string | null; profileData?: Record<string, unknown> | null }[]
}

export function buildEnrollmentExportRecord(source: EnrollmentExportSource): Record<string, unknown> {
	const applicants = (source.applicants ?? []).map((applicant) => ({
		name: applicant.name,
		dateOfBirth: toISODate(applicant.dateOfBirth),
		...buildRegistrationFlatValues(applicant.profileData ?? null, null),
	}))

	return {
		id: source.id,
		origin: ORIGIN_LABELS[source.origin] ?? source.origin,
		applicantName: source.applicantName ?? null,
		contactEmail: source.contactEmail,
		contactPhone: source.contactPhone ?? null,
		interest: source.interest ?? null,
		schedule: source.schedule ?? null,
		quote: source.quote ?? null,
		notes: source.notes ?? null,
		createdAt: source.createdAt ? new Date(source.createdAt).toISOString() : new Date().toISOString(),
		...buildRegistrationFlatValues(null, source.registrationData ?? null),
		applicants,
	}
}
