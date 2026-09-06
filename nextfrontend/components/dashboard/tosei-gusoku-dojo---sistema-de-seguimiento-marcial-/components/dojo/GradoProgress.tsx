'use client';

import { Award, CheckCircle2, Shield } from 'lucide-react';
import { Kata, Student } from '@/types';

interface GradoProgressProps { student: Student; requiredKatas?: Kata[]; className?: string; }
const percent = (value: number, goal: number) => goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100;

export function GradoProgress({ student, requiredKatas = [], className = '' }: GradoProgressProps) {
  const kataIds = new Set(requiredKatas.map((kata) => kata.id));
  const approved = (student.katasProgress ?? []).filter((item) => kataIds.has(item.kataId) && item.status === 'APROBADA').length;
  const kataPercent = percent(approved, requiredKatas.length);
  const attendancePercent = percent(student.attendancesCount ?? 0, student.targetAttendances ?? 0);
  const monthsPercent = percent(student.monthsInRank ?? 0, student.targetMonths ?? 0);
  const overall = Math.round((kataPercent + attendancePercent + monthsPercent) / 3);
  const eligible = kataPercent === 100 && attendancePercent === 100 && monthsPercent === 100;
  const metrics = [{ label: 'Katas oficiales', detail: `${approved} de ${requiredKatas.length} aprobadas`, value: kataPercent }, { label: 'Asistencias', detail: `${student.attendancesCount ?? 0} de ${student.targetAttendances ?? 0}`, value: attendancePercent }, { label: 'Permanencia en grado', detail: `${student.monthsInRank ?? 0} de ${student.targetMonths ?? 0} meses`, value: monthsPercent }];

  return <section className={`rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-lg ${className}`}>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Progreso de grado</p><h2 className="mt-1 text-lg font-bold text-white">{student.rankName ?? 'Grado actual'} <span className="text-neutral-500">a</span> {student.nextRankName ?? 'siguiente grado'}</h2></div><div className="flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2"><span className="h-4 w-12 rounded-sm border border-white/30" style={{ backgroundColor: student.beltColor ?? '#eab308' }} /><span className="text-xs text-neutral-300">{overall}% preparado</span></div></div>
    <div className="mt-5 space-y-4">{metrics.map((metric) => <div key={metric.label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-medium text-neutral-200">{metric.label}</span><span className="text-neutral-400">{metric.detail} <b className="text-cyan-300">{metric.value}%</b></span></div><div className="h-2 overflow-hidden rounded-full bg-[#0d1117]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-700" style={{ width: `${metric.value}%` }} /></div></div>)}</div>
    <div className={`mt-5 flex items-center gap-3 rounded-md border p-3 ${eligible ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}>{eligible ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : <Shield className="h-5 w-5 shrink-0 text-cyan-400" />}<div><p className="text-sm font-bold">{eligible ? 'Elegible para Examen de Grado' : 'Preparación en curso'}</p><p className="text-xs opacity-80">{eligible ? 'Cumpliste los requisitos técnicos, de asistencia y permanencia.' : 'Completa las tres metas para solicitar tu evaluación.'}</p></div>{eligible && <Award className="ml-auto h-6 w-6 text-emerald-400" />}</div>
  </section>;
}