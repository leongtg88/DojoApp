'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Role,
  AppRoute,
  BeltRank,
  Kata,
  RankKataRequirement,
  Student,
  StudentKata,
  KataStatus,
  ToastMessage,
  Instructor,
  AttendanceRecord,
  BirthdayItem,
} from '@/types';
import {
  INITIAL_RANKS,
  INITIAL_KATAS,
  INITIAL_REQUIREMENTS,
  INITIAL_STUDENTS,
  INITIAL_STUDENT_KATAS,
  INITIAL_INSTRUCTORS,
  INITIAL_ATTENDANCES,
} from '@/data/initialData';

export interface KataProgressItem {
  kata: Kata;
  requirement: RankKataRequirement;
  studentKata?: StudentKata;
  status: KataStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  notes?: string;
}

export interface StudentProgressData {
  currentRank: BeltRank | null;
  nextRank: BeltRank | null;
  isMaxRank: boolean;
  noNextRank: boolean;
  noKatasConfigured: boolean;
  totalRequired: number;
  masteredCount: number;
  percentage: number;
  isReadyForExam: boolean;
  katas: KataProgressItem[];
}

interface PendingReversion {
  studentId: string;
  kataId: string;
  newStatus: KataStatus;
  kataName: string;
}

interface DojoContextType {
  // State
  role: Role;
  setRole: (role: Role) => void;
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  ranks: BeltRank[];
  katas: Kata[];
  requirements: RankKataRequirement[];
  students: Student[];
  studentKatas: StudentKata[];
  instructors: Instructor[];
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  activeStudent: Student;
  activeInstructor: Instructor;
  
  // Progress calculations
  getStudentProgress: (studentId: string) => StudentProgressData;
  activeStudentProgress: StudentProgressData;
  
  // Actions
  updateKataStatus: (studentId: string, kataId: string, newStatus: KataStatus, notes?: string) => Promise<boolean>;
  confirmPendingReversion: () => void;
  cancelPendingReversion: () => void;
  pendingReversion: PendingReversion | null;
  
  assignRankToStudent: (studentId: string, newRankId: string, examDate: string, examiner: string) => void;
  promoteStudent: (studentId: string, newRankId: string, examDate: string, examiner: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  
  // Curriculum management
  addKataToRank: (rankId: string, kataId: string, requiredOrder?: number, required?: boolean) => void;
  removeKataFromRank: (rankId: string, kataId: string) => void;
  unassignKataFromRank: (rankId: string, kataId: string) => void;
  reorderKatasInRank: (rankId: string, orderedKataIds: string[]) => void;
  reorderKataInRank: (rankId: string, kataId: string, direction: 'up' | 'down') => void;
  assignKatasToRank: (rankId: string, kataIds: string[]) => void;
  
  // Rank CRUD
  createRank: (rank: Omit<BeltRank, 'id'>) => void;
  updateRank: (rankId: string, data: Partial<BeltRank>) => void;
  deleteRank: (rankId: string) => void;
  
  // Kata CRUD
  createKata: (kata: Omit<Kata, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateKata: (kataId: string, data: Partial<Kata>) => void;
  deleteKata: (kataId: string) => void;
  
  // Toasts
  toast: ToastMessage | null;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;

  // Attendance Management
  attendances: AttendanceRecord[];
  punchAttendance: (params: {
    studentId?: string;
    date: string;
    hoursTrained: number;
    sessionType?: string;
    notes?: string;
  }) => void;
  confirmAttendance: (attendanceId: string, senseiId?: string, senseiName?: string) => void;
  confirmAllPendingAttendances: (dateFilter?: string) => void;
  rejectAttendance: (attendanceId: string, reason?: string) => void;
  deleteAttendance: (attendanceId: string) => void;
  updateAttendance: (
    attendanceId: string,
    data: {
      date?: string;
      hoursTrained?: number;
      sessionType?: string;
      notes?: string;
      status?: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA';
    }
  ) => void;

  // Birthdays
  upcomingBirthdays: BirthdayItem[];
  todayBirthdays: BirthdayItem[];

  // Reset demo data
  resetAllData: () => void;
}

const DojoContext = createContext<DojoContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'tosei_gusoku_v2_';

export function DojoProvider({ children }: { children: React.ReactNode }) {
  // Navigation & Role
  const [role, setRoleState] = useState<Role>('student');
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('student-dashboard');

  // Entities initialized with localStorage if present
  const [ranks, setRanks] = useState<BeltRank[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}ranks`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_RANKS;
  });

  const [katas, setKatas] = useState<Kata[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}katas`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_KATAS;
  });

  const [requirements, setRequirements] = useState<RankKataRequirement[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}requirements`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_REQUIREMENTS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}students`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_STUDENTS;
  });

  const [studentKatas, setStudentKatas] = useState<StudentKata[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}studentKatas`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_STUDENT_KATAS;
  });

  const [instructors] = useState<Instructor[]>(INITIAL_INSTRUCTORS);

  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}attendances`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_ATTENDANCES;
  });

  // Active student & instructor
  const [activeStudentId, setActiveStudentId] = useState<string>('student-sofia');
  const activeInstructor = instructors[0];

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Reversion confirmation modal
  const [pendingReversion, setPendingReversion] = useState<PendingReversion | null>(null);

  // Save to localStorage
  const persist = <T,>(key: string, value: T) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  };

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, title, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  };

  const dismissToast = () => setToast(null);

  // Switch role and update route contextually
  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole === 'student') {
      setCurrentRoute('student-dashboard');
    } else if (newRole === 'instructor') {
      setCurrentRoute('instructor-eval');
    } else if (newRole === 'admin') {
      setCurrentRoute('admin-curriculum');
    }
    showToast('Rol cambiado', `Ahora estás navegando como ${newRole === 'student' ? 'Estudiante (Sofía)' : newRole === 'instructor' ? 'Instructor (Sensei Castillo)' : 'Administrador del Dojo'}.`, 'info');
  };

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === activeStudentId) || students[0];
  }, [students, activeStudentId]);

  // Next rank helper
  const getNextRank = (currentRankId: string, currentRanksList: BeltRank[]): BeltRank | null => {
    const current = currentRanksList.find((r) => r.id === currentRankId);
    if (!current || current.isMaximumRank) return null;

    // Filter ranks in same school, sorted by order
    const sorted = [...currentRanksList]
      .filter((r) => r.schoolId === current.schoolId)
      .sort((a, b) => a.order - b.order);

    const next = sorted.find((r) => r.order > current.order);
    return next || null;
  };

  // Calculate Student Progress strictly per prompt rules:
  // 1. Progress bar shows ONLY the required katas of the NEXT rank.
  // 2. Formula: percentage = (mastered required katas / total required katas for next rank) * 100
  // 3. Current rank katas do NOT count for progress bar.
  // 4. If max rank, no progress calculated and no future requirements shown.
  const getStudentProgress = useCallback((studentId: string): StudentProgressData => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return {
        currentRank: null,
        nextRank: null,
        isMaxRank: false,
        noNextRank: true,
        noKatasConfigured: false,
        totalRequired: 0,
        masteredCount: 0,
        percentage: 0,
        isReadyForExam: false,
        katas: [],
      };
    }

    const currentRank = ranks.find((r) => r.id === student.currentRankId) || null;
    const isMaxRank = currentRank?.isMaximumRank || false;

    if (isMaxRank) {
      return {
        currentRank,
        nextRank: null,
        isMaxRank: true,
        noNextRank: true,
        noKatasConfigured: false,
        totalRequired: 0,
        masteredCount: 0,
        percentage: 100,
        isReadyForExam: false,
        katas: [],
      };
    }

    const nextRank = currentRank ? getNextRank(currentRank.id, ranks) : null;
    if (!nextRank) {
      return {
        currentRank,
        nextRank: null,
        isMaxRank: false,
        noNextRank: true,
        noKatasConfigured: false,
        totalRequired: 0,
        masteredCount: 0,
        percentage: 0,
        isReadyForExam: false,
        katas: [],
      };
    }

    // Requirements for the NEXT rank
    const nextRankReqs = requirements
      .filter((req) => req.rankId === nextRank.id)
      .sort((a, b) => a.requiredOrder - b.requiredOrder);

    if (nextRankReqs.length === 0) {
      return {
        currentRank,
        nextRank,
        isMaxRank: false,
        noNextRank: false,
        noKatasConfigured: true,
        totalRequired: 0,
        masteredCount: 0,
        percentage: 0,
        isReadyForExam: false,
        katas: [],
      };
    }

    // Map each required kata with the student's status
    const katasProgress: KataProgressItem[] = nextRankReqs
      .map((req) => {
        const kataDef = katas.find((k) => k.id === req.kataId);
        if (!kataDef) return null;
        const sk = studentKatas.find(
          (item) => item.studentId === student.id && item.kataId === req.kataId
        );
        return {
          kata: kataDef,
          requirement: req,
          studentKata: sk,
          status: sk?.status || 'NO_INICIADA',
          approvedAt: sk?.approvedAt || null,
          approvedBy: sk?.approvedBy || null,
          notes: sk?.notes,
        };
      })
      .filter(Boolean) as KataProgressItem[];

    const totalRequired = katasProgress.length;
    const masteredCount = katasProgress.filter((item) => item.status === 'APROBADA').length;
    const percentage = totalRequired > 0 ? Number(((masteredCount / totalRequired) * 100).toFixed(1)) : 0;
    const isReadyForExam = masteredCount === totalRequired && totalRequired > 0;

    return {
      currentRank,
      nextRank,
      isMaxRank: false,
      noNextRank: false,
      noKatasConfigured: false,
      totalRequired,
      masteredCount,
      percentage,
      isReadyForExam,
      katas: katasProgress,
    };
  }, [students, ranks, requirements, studentKatas, katas]);

  const activeStudentProgress = useMemo(() => {
    return getStudentProgress(activeStudentId);
  }, [activeStudentId, getStudentProgress]);

  // Apply Kata Status Update directly
  const applyKataStatusUpdate = (
    studentId: string,
    kataId: string,
    newStatus: KataStatus,
    notes?: string
  ) => {
    const now = new Date().toISOString();
    const existingIndex = studentKatas.findIndex(
      (sk) => sk.studentId === studentId && sk.kataId === kataId
    );

    let updatedList: StudentKata[];

    if (existingIndex >= 0) {
      const existing = studentKatas[existingIndex];
      const isNowDominada = newStatus === 'APROBADA';
      const updated: StudentKata = {
        ...existing,
        status: newStatus,
        approvedAt: isNowDominada ? (existing.approvedAt || now) : null,
        approvedBy: isNowDominada ? (existing.approvedBy || activeInstructor.id) : null,
        notes: notes !== undefined ? notes : existing.notes,
        updatedAt: now,
      };
      updatedList = [...studentKatas];
      updatedList[existingIndex] = updated;
    } else {
      const isNowDominada = newStatus === 'APROBADA';
      const newRecord: StudentKata = {
        id: `sk-${studentId}-${kataId}-${Date.now()}`,
        studentId,
        kataId,
        status: newStatus,
        approvedAt: isNowDominada ? now : null,
        approvedBy: isNowDominada ? activeInstructor.id : null,
        notes: notes || undefined,
        updatedAt: now,
      };
      updatedList = [...studentKatas, newRecord];
    }

    setStudentKatas(updatedList);
    persist('studentKatas', updatedList);

    const kataDef = katas.find((k) => k.id === kataId);
    const statusLabels: Record<KataStatus, string> = {
      NO_INICIADA: 'Por practicar',
      EN_PRACTICA: 'En progreso',
      APROBADA: 'Dominada',
    };
    showToast(
      'Estado de kata actualizado',
      `${kataDef?.name || 'Kata'} cambió a "${statusLabels[newStatus]}". Registro guardado en tatami.`,
      'success'
    );
  };

  // Update status with confirmation when reverting APROBADA
  const updateKataStatus = async (
    studentId: string,
    kataId: string,
    newStatus: KataStatus,
    notes?: string
  ): Promise<boolean> => {
    const existing = studentKatas.find(
      (sk) => sk.studentId === studentId && sk.kataId === kataId
    );
    const currentStatus = existing?.status || 'NO_INICIADA';

    // Rule: "Si cambia desde APROBADA a otro estado, solicitar confirmación porque se eliminará la fecha de aprobación."
    if (currentStatus === 'APROBADA' && newStatus !== 'APROBADA') {
      const kataDef = katas.find((k) => k.id === kataId);
      setPendingReversion({
        studentId,
        kataId,
        newStatus,
        kataName: kataDef?.name || 'esta kata',
      });
      return false;
    }

    applyKataStatusUpdate(studentId, kataId, newStatus, notes);
    return true;
  };

  const confirmPendingReversion = () => {
    if (!pendingReversion) return;
    const { studentId, kataId, newStatus } = pendingReversion;
    setPendingReversion(null);
    applyKataStatusUpdate(studentId, kataId, newStatus);
  };

  const cancelPendingReversion = () => {
    setPendingReversion(null);
    showToast('Acción cancelada', 'El estado de la kata se mantiene como Dominada con su fecha original.', 'info');
  };

  // Rule: "Cuando el administrador asigna un nuevo grado al alumno, su siguiente objetivo se vuelve el grado posterior a ese nuevo grado."
  const assignRankToStudent = (
    studentId: string,
    newRankId: string,
    examDate: string,
    examiner: string
  ) => {
    const targetRank = ranks.find((r) => r.id === newRankId);
    if (!targetRank) return;

    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          currentRankId: newRankId,
          rankAwardedDate: examDate,
          assignedSenseiName: examiner,
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    persist('students', updatedStudents);

    // Calculate next target for user notification
    const nextRank = getNextRank(newRankId, ranks);
    const targetMessage = nextRank
      ? `Nuevo objetivo: ${targetRank.name} -> Siguiente meta: ${nextRank.name} (${nextRank.kyuDan}).`
      : `${targetRank.name} es el grado máximo alcanzado. ¡Felicitaciones!`;

    showToast(
      'Grado otorgado con éxito',
      `Expediente actualizado. ${targetMessage}`,
      'success'
    );
  };

  // Curriculum management
  const addKataToRank = (rankId: string, kataId: string, requiredOrder?: number, required = true) => {
    const rankReqs = requirements.filter((r) => r.rankId === rankId);
    const order = requiredOrder || rankReqs.length + 1;
    const newReq: RankKataRequirement = {
      id: `req-${rankId}-${kataId}-${Date.now()}`,
      rankId,
      kataId,
      requiredOrder: order,
      required,
      createdAt: new Date().toISOString(),
    };
    const updated = [...requirements, newReq];
    setRequirements(updated);
    persist('requirements', updated);
    showToast('Kata asociada', 'La kata se ha incorporado al plan oficial del grado.', 'success');
  };

  const removeKataFromRank = (rankId: string, kataId: string) => {
    const updated = requirements.filter(
      (r) => !(r.rankId === rankId && r.kataId === kataId)
    );
    setRequirements(updated);
    persist('requirements', updated);
    showToast('Kata desasignada', 'Se removió la kata del temario de este grado.', 'info');
  };

  const reorderKatasInRank = (rankId: string, orderedKataIds: string[]) => {
    const updated = requirements.map((req) => {
      if (req.rankId === rankId) {
        const newOrder = orderedKataIds.indexOf(req.kataId);
        if (newOrder !== -1) {
          return { ...req, requiredOrder: newOrder + 1 };
        }
      }
      return req;
    });
    setRequirements(updated);
    persist('requirements', updated);
    showToast('Orden actualizado', 'La secuencia pedagógica de las katas ha sido guardada.', 'success');
  };

  const unassignKataFromRank = (rankId: string, kataId: string) => {
    removeKataFromRank(rankId, kataId);
  };

  const assignKatasToRank = (rankId: string, kataIds: string[]) => {
    const otherReqs = requirements.filter((r) => r.rankId !== rankId);
    const newReqs: RankKataRequirement[] = kataIds.map((kataId, idx) => ({
      id: `req-${rankId}-${kataId}-${Date.now()}-${idx}`,
      rankId,
      kataId,
      requiredOrder: idx + 1,
      required: true,
      createdAt: new Date().toISOString(),
    }));
    const updated = [...otherReqs, ...newReqs];
    setRequirements(updated);
    persist('requirements', updated);
    showToast('Plan de katas actualizado', `Se asignaron ${kataIds.length} katas al grado.`, 'success');
  };

  const reorderKataInRank = (rankId: string, kataId: string, direction: 'up' | 'down') => {
    const rankReqs = requirements
      .filter((r) => r.rankId === rankId)
      .sort((a, b) => a.requiredOrder - b.requiredOrder);
    
    const currentIndex = rankReqs.findIndex((r) => r.kataId === kataId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === rankReqs.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const itemA = rankReqs[currentIndex];
    const itemB = rankReqs[targetIndex];

    const updated = requirements.map((r) => {
      if (r.id === itemA.id) return { ...r, requiredOrder: itemB.requiredOrder };
      if (r.id === itemB.id) return { ...r, requiredOrder: itemA.requiredOrder };
      return r;
    });

    setRequirements(updated);
    persist('requirements', updated);
  };

  // Rank CRUD
  const createRank = (rankData: Omit<BeltRank, 'id'>) => {
    const newRank: BeltRank = {
      ...rankData,
      id: `rank-custom-${Date.now()}`,
    };
    const updated = [...ranks, newRank].sort((a, b) => a.order - b.order);
    setRanks(updated);
    persist('ranks', updated);
    showToast('Grado creado', `Se ha registrado el nuevo grado "${newRank.name}".`, 'success');
  };

  const updateRank = (rankId: string, data: Partial<BeltRank>) => {
    const updated = ranks.map((r) => (r.id === rankId ? { ...r, ...data } : r));
    setRanks(updated);
    persist('ranks', updated);
    showToast('Grado actualizado', 'Los cambios en el grado han sido guardados.', 'success');
  };

  const deleteRank = (rankId: string) => {
    const updated = ranks.filter((r) => r.id !== rankId);
    setRanks(updated);
    persist('ranks', updated);
    // Also remove associated requirements
    const updatedReqs = requirements.filter((req) => req.rankId !== rankId);
    setRequirements(updatedReqs);
    persist('requirements', updatedReqs);
    showToast('Grado eliminado', 'El grado y sus asociaciones fueron eliminados.', 'info');
  };

  // Kata CRUD
  const createKata = (kataData: Omit<Kata, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newKata: Kata = {
      ...kataData,
      id: `kata-custom-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...katas, newKata];
    setKatas(updated);
    persist('katas', updated);
    showToast('Kata añadida al catálogo', `"${newKata.name}" está disponible para asignar a cualquier grado.`, 'success');
  };

  const updateKata = (kataId: string, data: Partial<Kata>) => {
    const now = new Date().toISOString();
    const updated = katas.map((k) => (k.id === kataId ? { ...k, ...data, updatedAt: now } : k));
    setKatas(updated);
    persist('katas', updated);
    showToast('Kata actualizada', 'Los datos técnicos de la kata fueron guardados.', 'success');
  };

  const deleteKata = (kataId: string) => {
    const updated = katas.filter((k) => k.id !== kataId);
    setKatas(updated);
    persist('katas', updated);
    const updatedReqs = requirements.filter((r) => r.kataId !== kataId);
    setRequirements(updatedReqs);
    persist('requirements', updatedReqs);
    showToast('Kata eliminada', 'La kata fue retirada del catálogo y de los planes.', 'info');
  };

  // Attendance Actions
  const punchAttendance = ({
    studentId,
    date,
    hoursTrained,
    sessionType = 'Kihon & Katas',
    notes = '',
  }: {
    studentId?: string;
    date: string;
    hoursTrained: number;
    sessionType?: string;
    notes?: string;
  }) => {
    const targetStudentId = studentId || activeStudentId;
    const targetStudent = students.find((s) => s.id === targetStudentId) || activeStudent;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentMatricula: targetStudent.matricula,
      studentAvatar: targetStudent.avatar,
      date,
      hoursTrained: Number(hoursTrained),
      sessionType: sessionType || 'Entrenamiento General',
      status: 'PENDIENTE',
      punchedAt: new Date().toISOString(),
      notes,
    };

    const updated = [newRecord, ...attendances];
    setAttendances(updated);
    persist('attendances', updated);
    showToast(
      'Asistencia registrada',
      `Marcaste ${hoursTrained}h de práctica para el ${date}. Pendiente de confirmación por el Sensei.`,
      'info'
    );
  };

  const confirmAttendance = (attendanceId: string, senseiId?: string, senseiName?: string) => {
    const sId = senseiId || activeInstructor.id;
    const sName = senseiName || activeInstructor.name;
    const now = new Date().toISOString();

    let targetStudentId = '';
    const updated = attendances.map((att) => {
      if (att.id === attendanceId) {
        targetStudentId = att.studentId;
        return {
          ...att,
          status: 'CONFIRMADA' as const,
          confirmedAt: now,
          confirmedBySenseiId: sId,
          confirmedBySenseiName: sName,
        };
      }
      return att;
    });

    setAttendances(updated);
    persist('attendances', updated);

    // Recalculate student attendances
    if (targetStudentId) {
      const studentConfirmedCount = updated.filter(
        (a) => a.studentId === targetStudentId && a.status === 'CONFIRMADA'
      ).length;

      const updatedStudents = students.map((s) => {
        if (s.id === targetStudentId) {
          const count = studentConfirmedCount;
          const target = s.targetAttendances || 30;
          const pct = Math.min(100, Math.round((count / target) * 100));
          return {
            ...s,
            attendancesCount: count,
            attendancePercentage: pct,
          };
        }
        return s;
      });

      setStudents(updatedStudents);
      persist('students', updatedStudents);
    }

    showToast('Asistencia confirmada', 'La sesión ha sido validada y agregada al registro oficial.', 'success');
  };

  const confirmAllPendingAttendances = (dateFilter?: string) => {
    const sId = activeInstructor.id;
    const sName = activeInstructor.name;
    const now = new Date().toISOString();

    const affectedStudentIds = new Set<string>();
    let countConfirmed = 0;

    const updated = attendances.map((att) => {
      const matchesDate = !dateFilter || att.date === dateFilter;
      if (att.status === 'PENDIENTE' && matchesDate) {
        affectedStudentIds.add(att.studentId);
        countConfirmed++;
        return {
          ...att,
          status: 'CONFIRMADA' as const,
          confirmedAt: now,
          confirmedBySenseiId: sId,
          confirmedBySenseiName: sName,
        };
      }
      return att;
    });

    if (countConfirmed === 0) {
      showToast('Sin pendientes', 'No hay asistencias pendientes por confirmar.', 'info');
      return;
    }

    setAttendances(updated);
    persist('attendances', updated);

    // Update affected students
    const updatedStudents = students.map((s) => {
      if (affectedStudentIds.has(s.id)) {
        const studentConfirmedCount = updated.filter(
          (a) => a.studentId === s.id && a.status === 'CONFIRMADA'
        ).length;
        const target = s.targetAttendances || 30;
        const pct = Math.min(100, Math.round((studentConfirmedCount / target) * 100));
        return {
          ...s,
          attendancesCount: studentConfirmedCount,
          attendancePercentage: pct,
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    persist('students', updatedStudents);

    showToast(
      'Asistencias confirmadas',
      `Se confirmaron exitosamente ${countConfirmed} registros de entrenamiento.`,
      'success'
    );
  };

  const rejectAttendance = (attendanceId: string, reason?: string) => {
    const updated = attendances.map((att) => {
      if (att.id === attendanceId) {
        return {
          ...att,
          status: 'RECHAZADA' as const,
          notes: reason ? `${att.notes ? att.notes + ' - ' : ''}Observación Sensei: ${reason}` : att.notes,
        };
      }
      return att;
    });
    setAttendances(updated);
    persist('attendances', updated);
    showToast('Asistencia rechazada', 'Se notificó la observación al estudiante.', 'info');
  };

  const deleteAttendance = (attendanceId: string) => {
    const updated = attendances.filter((att) => att.id !== attendanceId);
    setAttendances(updated);
    persist('attendances', updated);
    showToast('Registro eliminado', 'La asistencia fue removida del historial.', 'info');
  };

  const updateAttendance = (
    attendanceId: string,
    data: {
      date?: string;
      hoursTrained?: number;
      sessionType?: string;
      notes?: string;
      status?: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA';
    }
  ) => {
    let affectedStudentId = '';
    const updated = attendances.map((att) => {
      if (att.id === attendanceId) {
        affectedStudentId = att.studentId;
        const willBeConfirmed = data.status === 'CONFIRMADA';
        return {
          ...att,
          ...(data.date !== undefined ? { date: data.date } : {}),
          ...(data.hoursTrained !== undefined ? { hoursTrained: Number(data.hoursTrained) } : {}),
          ...(data.sessionType !== undefined ? { sessionType: data.sessionType } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(willBeConfirmed && !att.confirmedBySenseiName
            ? {
                confirmedAt: new Date().toISOString(),
                confirmedBySenseiId: activeInstructor.id,
                confirmedBySenseiName: activeInstructor.name,
              }
            : {}),
        };
      }
      return att;
    });

    setAttendances(updated);
    persist('attendances', updated);

    // If affected student, recalculate attendance stats
    if (affectedStudentId) {
      const studentConfirmedCount = updated.filter(
        (a) => a.studentId === affectedStudentId && a.status === 'CONFIRMADA'
      ).length;

      const updatedStudents = students.map((s) => {
        if (s.id === affectedStudentId) {
          const target = s.targetAttendances || 30;
          const pct = Math.min(100, Math.round((studentConfirmedCount / target) * 100));
          return {
            ...s,
            attendancesCount: studentConfirmedCount,
            attendancePercentage: pct,
          };
        }
        return s;
      });

      setStudents(updatedStudents);
      persist('students', updatedStudents);
    }

    showToast('Asistencia rectificada', 'Los datos de la asistencia fueron corregidos y guardados.', 'success');
  };

  // Birthdays calculation
  const { todayBirthdays, upcomingBirthdays } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    const allPeople: Array<{
      id: string;
      name: string;
      role: 'student' | 'instructor';
      avatar: string;
      birthDate: string;
      detail: string;
    }> = [
      ...students.map((s) => {
        const rank = ranks.find((r) => r.id === s.currentRankId);
        return {
          id: s.id,
          name: s.name,
          role: 'student' as const,
          avatar: s.avatar,
          birthDate: s.birthDate || '2005-09-15',
          detail: rank ? `${rank.name} (${rank.kyuDan})` : 'Alumno',
        };
      }),
      ...instructors.map((ins) => ({
        id: ins.id,
        name: ins.name,
        role: 'instructor' as const,
        avatar: ins.avatar,
        birthDate: ins.birthDate || '1980-09-08',
        detail: `${ins.title} • ${ins.dan}`,
      })),
    ];

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const items: BirthdayItem[] = allPeople.map((person) => {
      const parts = person.birthDate.split('-');
      const birthYear = parseInt(parts[0], 10) || 2000;
      const birthMonth = (parseInt(parts[1], 10) || 1) - 1; // 0-indexed
      const birthDay = parseInt(parts[2], 10) || 1;

      // Check if birthday already passed this calendar year
      let nextBday = new Date(currentYear, birthMonth, birthDay);
      const todayDateOnly = new Date(currentYear, currentMonth, currentDay);
      if (nextBday < todayDateOnly) {
        nextBday = new Date(currentYear + 1, birthMonth, birthDay);
      }

      const diffTime = nextBday.getTime() - todayDateOnly.getTime();
      const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const isToday = birthMonth === currentMonth && birthDay === currentDay;
      const turningAge = nextBday.getFullYear() - birthYear;

      return {
        id: person.id,
        name: person.name,
        role: person.role,
        avatar: person.avatar,
        birthDate: person.birthDate,
        turningAge,
        daysUntil,
        isToday,
        formattedDate: `${birthDay} de ${monthNames[birthMonth]}`,
        detail: person.detail,
      };
    });

    items.sort((a, b) => a.daysUntil - b.daysUntil);

    const todayList = items.filter((b) => b.isToday);
    const upcomingList = items.filter((b) => !b.isToday && b.daysUntil <= 60);

    return { todayBirthdays: todayList, upcomingBirthdays: upcomingList };
  }, [students, instructors, ranks]);

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}ranks`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}katas`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}requirements`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}students`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}studentKatas`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}attendances`);

    setRanks(INITIAL_RANKS);
    setKatas(INITIAL_KATAS);
    setRequirements(INITIAL_REQUIREMENTS);
    setStudents(INITIAL_STUDENTS);
    setStudentKatas(INITIAL_STUDENT_KATAS);
    setAttendances(INITIAL_ATTENDANCES);
    setActiveStudentId('student-sofia');
    showToast('Datos reiniciados', 'Se han restablecido los datos originales de demostración.', 'info');
  };

  return (
    <DojoContext.Provider
      value={{
        role,
        setRole,
        currentRoute,
        setCurrentRoute,
        ranks,
        katas,
        requirements,
        students,
        studentKatas,
        instructors,
        attendances,
        activeStudentId,
        setActiveStudentId,
        activeStudent,
        activeInstructor,
        getStudentProgress,
        activeStudentProgress,
        updateKataStatus,
        confirmPendingReversion,
        cancelPendingReversion,
        pendingReversion,
        assignRankToStudent,
        promoteStudent: assignRankToStudent,
        selectedStudentId: activeStudentId,
        setSelectedStudentId: setActiveStudentId,
        addKataToRank,
        removeKataFromRank,
        unassignKataFromRank,
        reorderKatasInRank,
        reorderKataInRank,
        assignKatasToRank,
        createRank,
        updateRank,
        deleteRank,
        createKata,
        updateKata,
        deleteKata,
        toast,
        showToast,
        dismissToast,
        punchAttendance,
        confirmAttendance,
        confirmAllPendingAttendances,
        rejectAttendance,
        deleteAttendance,
        updateAttendance,
        upcomingBirthdays,
        todayBirthdays,
        resetAllData,
      }}
    >
      {children}
    </DojoContext.Provider>
  );
}

export function useDojo() {
  const context = useContext(DojoContext);
  if (!context) {
    throw new Error('useDojo must be used within a DojoProvider');
  }
  return context;
}
