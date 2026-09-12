import type { RegistrationGroup, StudentRegistrationView } from '@/types/dashboard'

type FieldSource = 'perfil' | 'formulario'

export interface RegistrationFieldSpec {
	group: string
	groupLabel: string
	key: string
	label: string
	from: FieldSource
}

export const REGISTRATION_FIELD_SPECS: RegistrationFieldSpec[] = [
	{ group: 'perfil', groupLabel: 'Perfil', key: 'sexo', label: 'Sexo', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'bloodType', label: 'Tipo de sangre', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'height', label: 'Altura (cm)', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'pantSize', label: 'Talla de pantalón', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'shirtSize', label: 'Talla de camiseta', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'nationalId', label: 'Número de cédula', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'address', label: 'Dirección', from: 'perfil' },
	{ group: 'perfil', groupLabel: 'Perfil', key: 'medicalInfo', label: 'Condición médica', from: 'perfil' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'tipoRegistro', label: 'Tipo de registro', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'nombreMadre', label: 'Nombre de la madre', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'telefonoMadre', label: 'Teléfono de la madre', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'nombrePadre', label: 'Nombre del padre', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'telefonoPadre', label: 'Teléfono del padre', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'direccionPadres', label: 'Dirección de los padres', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'condicionMedica', label: 'Condición médica', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'horasPractica', label: 'Horas de práctica por semana', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'espacioCasa', label: 'Espacio en casa', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'compromisoDiario', label: 'Compromiso diario', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'asistenciaPadre', label: 'Asistencia del padre', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'metodoMotivacion', label: 'Métodos de motivación', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'otroMetodoMotivacion', label: 'Otro método de motivación', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'razonesKarate', label: 'Razones para practicar karate', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'otraRazon', label: 'Otro motivo', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'compromisoObstaculos', label: 'Compromiso ante obstáculos', from: 'formulario' },
	{ group: 'formulario', groupLabel: 'Formulario', key: 'otroCompromiso', label: 'Otro compromiso', from: 'formulario' },
]

const PERFIL_KEYS = REGISTRATION_FIELD_SPECS.filter(({ from }) => from === 'perfil').map(({ key }) => key)

function looksLikeProfile(record: Record<string, unknown> | null | undefined): boolean {
	if (!record) return false
	return PERFIL_KEYS.some((key) => record[key] !== undefined && record[key] !== null && record[key] !== '')
}

function formatValue(value: unknown): string | number | null {
	if (value === undefined || value === null) return null
	if (typeof value === 'string') return value.trim() === '' ? null : value
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	if (value instanceof Date) return value.toISOString()
	if (Array.isArray(value)) {
		const parts = value.map((entry) => formatValue(entry)).filter((entry): entry is string | number => entry !== null)
		return parts.length > 0 ? parts.join(' · ') : null
	}
	try {
		return JSON.stringify(value)
	} catch {
		return null
	}
}

export function pickFieldValue(record: Record<string, unknown> | null | undefined, key: string): string | number | null {
	if (!record) return null
	return formatValue(record[key])
}

export interface EnrollmentFormSource {
	id: string
	origin: string
	status: string
	createdAt: Date | string
	applicantName?: string | null
	registrationData?: unknown
	applicants?: {
		id: string
		name: string
		dateOfBirth: Date | string | null
		studentId?: string | null
		profileData?: unknown
	}[]
}

export interface RegistrationViewInput {
	registrationData?: unknown
	enrollments?: EnrollmentFormSource[] | null
}

export function buildRegistrationGroups(profileData?: Record<string, unknown> | null, registrationData?: Record<string, unknown> | null): RegistrationGroup[] {
	const groupOrder = ['perfil', 'formulario']
	const byGroup = new Map<string, RegistrationGroup>()

	for (const spec of REGISTRATION_FIELD_SPECS) {
		const source = spec.from === 'perfil' ? profileData : registrationData
		const value = pickFieldValue(source, spec.key)
		if (value === null) continue
		let group = byGroup.get(spec.group)
		if (!group) {
			group = { title: spec.groupLabel, fields: [] }
			byGroup.set(spec.group, group)
		}
		group.fields.push({ label: spec.label, value })
	}

	return groupOrder.map((key) => byGroup.get(key)).filter((group): group is RegistrationGroup => Boolean(group && group.fields.length > 0))
}

export function pickBestEnrollment(enrollments: EnrollmentFormSource[] | null | undefined): EnrollmentFormSource | null {
	if (!enrollments || enrollments.length === 0) return null
	return (
		enrollments.find((enrollment) => enrollment.origin === 'FORM') ??
		enrollments.find((enrollment) => enrollment.status === 'ENROLLED') ??
		enrollments[0] ??
		null
	)
}

export function getBestEnrollmentFormData(enrollments: EnrollmentFormSource[] | null | undefined): Record<string, unknown> | null {
	const enrollment = pickBestEnrollment(enrollments ?? null)
	return (enrollment?.registrationData as Record<string, unknown> | null | undefined) ?? null
}

export function resolveRegistrationSources(input: RegistrationViewInput): {
	perfilData: Record<string, unknown> | null
	enrollmentFormData: Record<string, unknown> | null
} {
	const enrollment = pickBestEnrollment(input.enrollments ?? null)
	const enrollmentFormData = (enrollment?.registrationData as Record<string, unknown> | null | undefined) ?? null

	let perfilData = input.registrationData as Record<string, unknown> | null | undefined
	if (!looksLikeProfile(perfilData)) {
		const convertedApplicant = enrollment?.applicants?.find((applicant) => applicant.studentId) ?? enrollment?.applicants?.[0]
		const candidateProfile = (convertedApplicant as { profileData?: Record<string, unknown> | null } | undefined)?.profileData ?? null
		perfilData = looksLikeProfile(candidateProfile) ? candidateProfile : null
	}

	return {
		perfilData: perfilData ?? null,
		enrollmentFormData,
	}
}

export function buildStudentRegistrationView(input: RegistrationViewInput): StudentRegistrationView {
	const enrollment = pickBestEnrollment(input.enrollments ?? null)
	const { perfilData, enrollmentFormData } = resolveRegistrationSources(input)

	return {
		origin: enrollment ? (enrollment.origin === 'FORM' || enrollment.origin === 'ASSISTANT' ? enrollment.origin : 'MANUAL') : 'MANUAL',
		status: enrollment?.status ?? null,
		registeredAt: enrollment ? new Date(enrollment.createdAt).toISOString() : null,
		applicantName: enrollment?.applicantName ?? null,
		hasForm: Boolean(enrollmentFormData) || Boolean(perfilData),
		groups: buildRegistrationGroups(perfilData, enrollmentFormData),
		applicants: (enrollment?.applicants ?? []).map((applicant) => ({
			id: applicant.id,
			name: applicant.name,
			dateOfBirth: applicant.dateOfBirth ? new Date(applicant.dateOfBirth).toISOString() : null,
		})),
	}
}

export function buildRegistrationFlatValues(profileData?: Record<string, unknown> | null, registrationData?: Record<string, unknown> | null): Record<string, string | number | null> {
	const values: Record<string, string | number | null> = {}
	for (const spec of REGISTRATION_FIELD_SPECS) {
		const source = spec.from === 'perfil' ? profileData : registrationData
		values[spec.key] = pickFieldValue(source, spec.key)
	}
	return values
}