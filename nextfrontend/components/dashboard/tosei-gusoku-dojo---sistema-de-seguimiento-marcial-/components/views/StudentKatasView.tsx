'use client';

import { Award, ChevronRight } from 'lucide-react';
import { useDojo } from '@/context/DojoContext';
import { GradoProgress } from '../dojo/GradoProgress';
import { KataList } from '../dojo/KataList';
import { buildKataStudent } from '../dojo/studentKataModule';

export function StudentKatasView() {
  const { activeStudent, activeStudentProgress, katas, setCurrentRoute, updateKataStatus } = useDojo();
  const required = activeStudentProgress.katas.map((item) => item.kata);
  const student = buildKataStudent(activeStudent, activeStudentProgress.katas, activeStudentProgress.currentRank?.name ?? 'Grado actual', activeStudentProgress.currentRank?.beltColor ?? '#22d3ee', activeStudentProgress.nextRank?.name ?? 'Siguiente grado');
  const approved = student.katasProgress?.filter((item) => item.status === 'APROBADA').length ?? 0;
  const assigned = katas.filter((kata) => student.katasProgress?.some((item) => item.kataId === kata.id) && !required.some((requiredKata) => requiredKata.id === kata.id));

  return <main className="space-y-5"><div className="flex items-center gap-1 text-xs text-neutral-500"><button type="button" onClick={() => setCurrentRoute('student-dashboard')} className="hover:text-cyan-300">Inicio</button><ChevronRight className="h-3 w-3" /><span className="text-neutral-200">Katas y grado</span></div><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Syllabus personal</p><h1 className="mt-1 text-2xl font-bold text-white">Katas requeridas y progreso de grado</h1><p className="mt-1 text-sm text-neutral-400">{student.rankName} · {approved} de {required.length} katas aprobadas</p></div><Award className="h-8 w-8 text-emerald-400" /></header><GradoProgress student={student} requiredKatas={required} /><KataList katas={[...required, ...assigned]} progress={student.katasProgress} requiredKataIds={required.map((kata) => kata.id)} onStartPractice={(kataId) => updateKataStatus(activeStudent.id, kataId, 'EN_PRACTICA')} onSaveNote={(kataId, note) => { const current = student.katasProgress?.find((item) => item.kataId === kataId); updateKataStatus(activeStudent.id, kataId, current?.status ?? 'NO_INICIADA', note); }} /></main>;
}