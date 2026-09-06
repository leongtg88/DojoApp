import { Kata, Student, StudentKataProgress } from '@/types';
import { KataProgressItem } from '@/context/DojoContext';

export function toStudentKataProgress(item: KataProgressItem): StudentKataProgress {
  return {
    kataId: item.kata.id,
    status: item.status,
    practiceHours: item.studentKata?.practiceHours ?? (item.status === 'APROBADA' ? 12 : item.status === 'EN_PRACTICA' ? 5 : 0),
    score: item.studentKata?.score,
    lastFeedback: item.notes,
    lastPracticeDate: item.studentKata?.lastPracticeDate ?? item.studentKata?.updatedAt,
    evaluatedBy: item.studentKata?.evaluatedBy,
  };
}

export function buildKataStudent(source: Student, progress: KataProgressItem[], currentRankName: string, beltColor: string, nextRankName: string): Student {
  return {
    ...source,
    rankName: source.rankName ?? currentRankName,
    beltColor: source.beltColor ?? beltColor,
    nextRankName: source.nextRankName ?? nextRankName,
    katasProgress: progress.map(toStudentKataProgress),
    monthsInRank: source.monthsInRank ?? 4,
    targetMonths: source.targetMonths ?? 6,
  };
}

export function kataDifficulty(kata: Kata): 'Básica' | 'Intermedia' | 'Avanzada' {
  if (kata.difficulty) return kata.difficulty;
  if (kata.category === 'Básico') return 'Básica';
  return kata.category === 'Avanzado' || kata.category === 'Maestro' ? 'Avanzada' : 'Intermedia';
}