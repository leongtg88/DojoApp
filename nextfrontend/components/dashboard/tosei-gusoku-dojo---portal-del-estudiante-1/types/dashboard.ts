export type DocumentStatus =
  | 'Pendiente de carga'
  | 'En revisión'
  | 'Aprobado'
  | 'Requiere actualización'
  | 'Rechazado';

export interface IdentityDocument {
  id: string;
  type:
    | 'Cédula de identidad'
    | 'Pasaporte'
    | 'Partida de nacimiento'
    | 'Foto tipo carnet'
    | 'Certificado médico anual'
    | 'Documento adicional';
  fileName?: string;
  status: DocumentStatus;
  uploadedAt?: string;
  fileUrl?: string;
  fileSize?: string;
  rejectionReason?: string;
}

export type TechniqueStatus = 'Dominada' | 'En progreso' | 'Por practicar';
export type TechniqueCategory = 'Kihon' | 'Kata' | 'Kumite' | 'Bunkai';

export interface StudentTechnique {
  id: string;
  name: string;
  kanjiName?: string;
  category: TechniqueCategory;
  subCategory?: string;
  status: TechniqueStatus;
  approvedAt?: string;
  evaluatedBy?: string;
  senseiNotes?: string;
  focusPoints?: string;
}

export interface BeltCriteria {
  attendancePercent: number;
  minAttendancePercent: number;
  dojoHoursCompleted: number;
  dojoHoursRequired: number;
  monthsCompleted: number;
  monthsRequired: number;
}

export interface BeltRank {
  currentRankName: string;
  currentRankBeltColor: string;
  beltHex: string;
  japaneseKanji: string;
  romaji: string;
  nextRankName: string;
  progressPercent: number;
  completedRequirements: number;
  totalRequirements: number;
  monthsInGrade: number;
  totalEstimatedMonths: number;
  remainingMonths: number;
  budoPassId: string;
  examinationSession: string;
  isMaxRank?: boolean;
  criteria: BeltCriteria;
}

export interface ClassSchedule {
  id: string;
  day: string;
  dayShort: 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
  dateNumber: number;
  title: string;
  startTime: string;
  endTime: string;
  instructor: string;
  instructorRank?: string;
  branch: string;
  program: string;
  isNextClass?: boolean;
  statusBadge?: string;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  bloodType?: string;
}

export interface MedicalInfo {
  cardiovascularCondition: string;
  allergies?: string;
  physicalObservations: string;
}

export interface UniformAndSizes {
  karategi: string;
  pantSize: string;
  height: number;
  weight: number;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  role: 'STUDENT';
  branch: string;
  statusText: string;
  statusDojo: string; // e.g. "Kasshin"
  program: 'Adulto Avanzado' | 'Juvenil' | 'Infantil';
  joinedDate: string;
  joinedAntiquity: string;
  birthDate: string;
  age: number;
  gender?: string;
  phone: string;
  email: string;
  address?: string;
  emergencyContact: EmergencyContact;
  medicalInfo: MedicalInfo;
  uniformAndSizes: UniformAndSizes;
}
