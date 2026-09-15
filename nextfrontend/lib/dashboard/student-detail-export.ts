import * as XLSX from 'xlsx'
import type { AdminStudentDetail } from '@/types/dashboard'

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino' }
const SCHOLARSHIP_LABELS: Record<string, string> = {
  NONE: 'Sin beca',
  ECONOMIC: 'Beca económica',
  MERIT: 'Beca por mérito',
  COMPETITOR: 'Competidor',
}
const ACCOUNT_LABELS: Record<string, string> = {
  ACTIVO: 'Activa',
  INVITADO: 'Pendiente de registro',
  SIN_CUENTA: 'Sin cuenta',
}
const ORIGIN_LABELS: Record<string, string> = {
  FORM: 'Formulario web',
  ASSISTANT: 'Asistente virtual',
  MANUAL: 'Registro manual',
}
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PROFILE_PHOTO: 'Foto de perfil',
  IDENTITY: 'Documento de identidad',
  BIRTH_CERTIFICATE: 'Acta de nacimiento',
  PASSPORT: 'Pasaporte',
  MEDICAL_CERTIFICATE: 'Certificado médico',
  OTHER: 'Documento adicional',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En práctica',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazado',
  EXPIRED: 'Expirado',
}

function toDateLabel(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(date)
}

function toDateTimeLabel(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function ageFrom(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)))
}

function blockSheet(rows: (string | number | null)[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const width = Math.max(...rows.map((row) => row.length), 1)
  worksheet['!cols'] = Array.from({ length: width }, (_, index) => ({ wch: index === 0 ? 34 : 32 }))
  return worksheet
}

function buildPersonalSheet(detail: AdminStudentDetail): (string | number | null)[][] {
  const fullName = `${detail.firstName} ${detail.lastName}`.trim()
  const rows: (string | number | null)[][] = [
    ['Campo', 'Valor'],
    ['Matrícula', detail.memberNumber],
    ['Nombre completo', fullName],
    ['Fecha de nacimiento', toDateLabel(detail.dateOfBirth)],
    ['Edad', ageFrom(detail.dateOfBirth)],
    ['Género', detail.gender ? GENDER_LABELS[detail.gender] ?? detail.gender : null],
    ['Email', detail.email],
    ['Teléfono', detail.contactPhone],
    ['Sucursal', detail.branchName],
    ['Estado del expediente', detail.status],
    ['Estado de la cuenta', ACCOUNT_LABELS[detail.accountStatus] ?? detail.accountStatus],
    ['Grado actual', detail.currentRank],
    ['Fecha de alta', toDateTimeLabel(detail.enrollmentDate)],
    ['Grado otorgado', toDateTimeLabel(detail.rankAwardedAt)],
    ['Plan', detail.planName],
    ['Horas del plan', detail.isUnlimitedPlan ? 'Ilimitadas' : detail.planMonthlyHours],
    ['Inicio del plan', toDateLabel(detail.planStartDate)],
    ['Beca', SCHOLARSHIP_LABELS[detail.scholarshipType] ?? detail.scholarshipType],
    ['Nota de beca', detail.scholarshipNote],
    ['Competidor', detail.isCompetitor ? 'Sí' : 'No'],
    ['Horarios activos', detail.activeScheduleNames.join(' · ') || null],
    ['Asistencia', `${detail.attendancePercent ?? 0}% (${detail.attendedCount} de ${detail.targetAttendances})`],
    ['Contacto de emergencia', detail.emergencyContact],
    ['Información médica', detail.medicalInfo],
  ]
  return rows
}

function buildRegistrationSheet(detail: AdminStudentDetail): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [
    ['Sección', 'Campo', 'Valor'],
    ['Inscripción', 'Origen', ORIGIN_LABELS[detail.registration.origin] ?? detail.registration.origin],
    ['Inscripción', 'Estado', detail.registration.status],
    ['Inscripción', 'Fecha de inscripción', toDateTimeLabel(detail.registration.registeredAt)],
    ['Inscripción', 'Aspirante / referencia', detail.registration.applicantName],
  ]

  for (const group of detail.registration.groups) {
    for (const field of group.fields) {
      rows.push([group.title, field.label, field.value])
    }
  }

  for (const applicant of detail.registration.applicants) {
    rows.push(['Aspirantes de la solicitud', applicant.name, toDateLabel(applicant.dateOfBirth)])
  }

  return rows
}

function buildDocumentsSheet(detail: AdminStudentDetail): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [['Tipo', 'Archivo', 'Estado', 'Tamaño (KB)', 'Subido', 'Observaciones']]
  for (const document of detail.documents) {
    rows.push([
      DOCUMENT_TYPE_LABELS[document.type] ?? document.type,
      document.fileName,
      STATUS_LABELS[document.status] ?? document.status,
      document.fileSize ? Math.round(document.fileSize / 1024) : null,
      toDateLabel(document.uploadedAt),
      document.reviewNotes,
    ])
  }
  return rows
}

function buildTechniquesSheet(detail: AdminStudentDetail): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [['Kata / técnica', 'Kanji', 'Categoría', 'Estado', 'Aprobada', 'Horas de práctica', 'Notas']]
  for (const entry of detail.techniques) {
    rows.push([
      entry.technique.name,
      entry.technique.kanji,
      entry.technique.category,
      STATUS_LABELS[entry.status] ?? entry.status,
      entry.approved ? 'Sí' : 'No',
      entry.practiceHours,
      entry.notes,
    ])
  }
  return rows
}

function buildRankHistorySheet(detail: AdminStudentDetail): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [['Grado', 'Fecha', 'Promovido por', 'Examinador', 'Notas']]
  for (const entry of detail.rankHistory) {
    rows.push([entry.rankName, toDateTimeLabel(entry.promotedAt), entry.promoterName, entry.examinerName, entry.notes])
  }
  return rows
}

function buildAttendanceSheet(detail: AdminStudentDetail): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [['Fecha', 'Estado', 'Presente', 'Horas', 'Tipo', 'Clase', 'Confirmado por', 'Notas']]
  for (const entry of detail.attendanceHistory) {
    rows.push([
      toDateTimeLabel(entry.date),
      entry.status,
      entry.present ? 'Sí' : 'No',
      entry.hoursTrained,
      entry.sessionType,
      entry.className,
      entry.confirmedByName,
      entry.notes,
    ])
  }
  return rows
}

export function buildStudentDetailWorkbook(detail: AdminStudentDetail): Buffer {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, blockSheet(buildPersonalSheet(detail)), 'Datos personales')
  XLSX.utils.book_append_sheet(workbook, blockSheet(buildRegistrationSheet(detail)), 'Inscripción')
  XLSX.utils.book_append_sheet(workbook, blockSheet(buildDocumentsSheet(detail)), 'Documentos')
  XLSX.utils.book_append_sheet(workbook, blockSheet(buildTechniquesSheet(detail)), 'Katas y técnicas')
  XLSX.utils.book_append_sheet(workbook, blockSheet(buildRankHistorySheet(detail)), 'Historial de grados')
  XLSX.utils.book_append_sheet(workbook, blockSheet(buildAttendanceSheet(detail)), 'Asistencias')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export function studentFileName(detail: AdminStudentDetail): string {
  const base = `${detail.firstName}-${detail.lastName}`.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').toLowerCase()
  return base || detail.id
}
