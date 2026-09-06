export type Role = 'student' | 'instructor' | 'admin';

export type KataStatus = 'POR_PRACTICAR' | 'EN_PROGRESO' | 'DOMINADA';

export type KataCategory = 'Básico' | 'Intermedio' | 'Avanzado' | 'Maestro';

export interface BeltRank {
  id: string;
  name: string; // e.g. "Cinturón Amarillo"
  kyuDan: string; // e.g. "9.º kyu", "1.º dan"
  japaneseName?: string; // e.g. "Kyukyu", "Shodan"
  kanji?: string; // e.g. "九級"
  order: number; // Sequential order of progression (1, 2, 3...)
  beltColor: string; // Hex color code or css color
  beltSecondaryColor?: string; // For stripes or special belts
  estimatedDurationMonths: number;
  schoolId: string;
  isMaximumRank: boolean;
  description?: string;
  minAttendancePercent?: number;
}

export interface Kata {
  id: string;
  name: string;
  japaneseName?: string;
  kanji?: string;
  description?: string;
  order: number; // Teaching order
  schoolId: string;
  movementsCount: number;
  category: KataCategory;
  embusen?: string; // Floor pattern e.g. "I", "H", "Cross"
  createdAt: string;
  updatedAt: string;
}

export interface RankKataRequirement {
  id: string;
  rankId: string;
  kataId: string;
  requiredOrder: number;
  required: boolean;
  createdAt: string;
}

export interface StudentKata {
  id: string;
  studentId: string;
  kataId: string;
  status: KataStatus;
  approvedAt: string | null; // ISO string when DOMINADA, null otherwise
  approvedBy: string | null; // instructor ID when DOMINADA, null otherwise
  notes?: string; // Sensei pedagogical feedback
  updatedAt: string;
}

export type AttendanceStatus = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentMatricula: string;
  studentAvatar: string;
  date: string; // YYYY-MM-DD
  hoursTrained: number; // e.g. 1, 1.5, 2
  sessionType: string; // e.g. "Kihon & Katas", "Kumite", "Perfeccionamiento"
  status: AttendanceStatus;
  punchedAt: string; // ISO string
  confirmedAt?: string | null;
  confirmedBySenseiId?: string | null;
  confirmedBySenseiName?: string | null;
  notes?: string;
}

export interface BirthdayItem {
  id: string;
  name: string;
  role: 'student' | 'instructor';
  avatar: string;
  birthDate: string; // YYYY-MM-DD
  turningAge: number;
  daysUntil: number; // 0 for today
  isToday: boolean;
  formattedDate: string; // e.g. "3 de Septiembre"
  detail: string; // e.g. "Cinturón Amarillo" or "Sensei 4.º Dan"
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  matricula: string;
  currentRankId: string;
  rankAwardedDate: string;
  assignedSenseiId: string;
  assignedSenseiName: string;
  age: number;
  birthDate: string; // YYYY-MM-DD e.g. "2005-09-15"
  joinedDojo: string;
  phone: string;
  email?: string;
  location: string;
  enrollmentDate?: string;
  attendancePercentage: number;
  attendancesCount: number;
  targetAttendances: number;
  isEligibleForExam: boolean;
  status: 'Activa' | 'Inactiva' | 'Licencia';
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  dan: string;
  avatar: string;
  roleDescription: string;
  birthDate: string; // YYYY-MM-DD e.g. "1982-10-04"
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export type AppRoute =
  | 'student-dashboard' // /dashboard
  | 'student-katas'     // /grado
  | 'student-schedule'  // /horario
  | 'student-profile'   // /mis-datos
  | 'instructor-eval'   // /instructor
  | 'instructor-students' // /instructor/alumnos
  | 'instructor-schedule' // /mi-horario
  | 'admin-curriculum'  // /grados & /admin
  | 'admin-students'    // /admin/alumnos
  | 'admin-student-detail' // /admin/alumnos/:alumnoId
  | 'deliverable-docs';  // Deliverable report
