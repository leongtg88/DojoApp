'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { GradoProgress } from '../dojo/GradoProgress';
import { KataBadge } from '../dojo/KataBadge';
import { BirthdayWidget } from '../dojo/BirthdayWidget';
import { StudentAttendancePunch } from '../dojo/StudentAttendancePunch';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  CalendarDays,
  Cake,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
} from 'lucide-react';

export function StudentDashboardView() {
  const {
    activeStudent,
    activeStudentProgress,
    setCurrentRoute,
    showToast,
  } = useDojo();

  const [activeTab, setActiveTab] = useState<'katas' | 'attendance'>('katas');

  const handleRequestReview = () => {
    showToast(
      'Solicitud de examen enviada',
      'Tu solicitud para evaluación de cinturón ha sido notificada al Sensei Roberto Castillo.',
      'success'
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Sub-Navigation Tabs */}
      <div className="w-full overflow-x-auto bg-[#111111] border border-[#2A2A2A] rounded-xl p-1 shadow-sm">
        <div className="flex items-center gap-1 min-w-max">
          <button
            type="button"
            onClick={() => setCurrentRoute('student-dashboard')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#222222] text-white shadow-xs text-xs font-bold border border-[#3A3A3A] cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#D10000]" />
            <span>Resumen</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentRoute('student-katas')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Mi grado y katas</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentRoute('student-schedule')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Mi horario</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentRoute('student-profile')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mis datos</span>
          </button>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#D10000] font-bold">
              Estudiante Activo
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              ¡Osu, {activeStudent.name.split(' ')[0]}!
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#1A1A1A] px-3.5 py-1.5 rounded-full self-start sm:self-auto border border-[#2A2A2A]">
            <Calendar className="w-4 h-4 text-[#D10000]" />
            <span className="text-xs text-gray-300 font-semibold">
              Próxima clase: Jueves, 5:00 p. m. - 6:00 p. m.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <MapPin className="w-3.5 h-3.5 text-[#00FFFF]" />
          <span>Dojo Principal Inoue Ha • {activeStudent.location}</span>
        </div>
      </div>

      {/* Recordatorio y Felicitación de Cumpleaños */}
      <BirthdayWidget />

      {/* Componente Reutilizable 3: GradoProgress */}
      <GradoProgress
        currentRank={activeStudentProgress.currentRank}
        nextRank={activeStudentProgress.nextRank}
        masteredCount={activeStudentProgress.masteredCount}
        requiredCount={activeStudentProgress.totalRequired}
        percentage={activeStudentProgress.percentage}
        isMaxRank={activeStudentProgress.isMaxRank}
        noNextRank={activeStudentProgress.noNextRank}
        noKatasConfigured={activeStudentProgress.noKatasConfigured}
        isReadyForExam={activeStudentProgress.isReadyForExam}
        onRequestExamReview={handleRequestReview}
      />

      {/* Pestañas de Vista: Katas del Grado vs Asistencias Punch In */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('katas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'katas'
              ? 'bg-[#D10000] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Katas del Programa Shito-Ryu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'attendance'
              ? 'bg-[#D10000] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Control de Asistencia (Punch In)</span>
        </button>
      </div>

      {activeTab === 'attendance' ? (
        <StudentAttendancePunch />
      ) : (
        <>
          {/* Secondary Operational Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Monthly Attendance */}
            <div
              onClick={() => setActiveTab('attendance')}
              className="bg-[#161616] rounded-xl p-4 shadow-lg border border-[#2A2A2A] hover:border-red-900/60 cursor-pointer transition-all flex items-start gap-3"
            >
              <div className="p-2.5 rounded-lg bg-teal-950/40 text-[#00FFFF] border border-teal-800/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-gray-500 font-bold block truncate">
                    Asistencia mensual
                  </span>
                  <span className="text-[11px] text-[#00FFFF] font-semibold flex items-center gap-1">
                    Punch In <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <span className="text-base font-bold text-white">
                  {activeStudent.attendancePercentage}%
                </span>
                <span className="text-xs text-gray-400 block mt-0.5">
                  {activeStudent.attendancesCount} de {activeStudent.targetAttendances} clases requeridas
                </span>
              </div>
            </div>

            {/* Next Evaluation */}
            <div className="bg-[#161616] rounded-xl p-4 shadow-lg border border-[#2A2A2A] flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-950/40 text-[#D10000] border border-red-800/40">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase text-gray-500 font-bold block truncate">
                  Próxima evaluación oficial
                </span>
                <span className="text-base font-bold text-white">
                  Noviembre 2026
                </span>
                <span className="text-xs text-gray-400 block mt-0.5">
                  Sesión proyectada de tatami
                </span>
              </div>
            </div>
          </div>

      {/* Próximas Katas a Dominar (Card Matching Image 1) */}
      {!activeStudentProgress.isMaxRank && activeStudentProgress.katas.length > 0 && (
        <div className="bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white">
                Próximas katas a dominar
              </h3>
              <p className="text-xs text-gray-400">
                Requerimientos oficiales Shito-Ryu Inoue Ha para{' '}
                {activeStudentProgress.nextRank?.name} ({activeStudentProgress.nextRank?.kyuDan})
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-300 bg-[#1A1A1A] border border-[#2A2A2A] px-2.5 py-1 rounded-lg">
              {activeStudentProgress.katas.length} registradas
            </span>
          </div>

          {/* Quick List (Preview 4 items) */}
          <div className="space-y-2.5">
            {activeStudentProgress.katas.slice(0, 4).map((item) => (
              <div
                key={item.kata.id}
                className="p-3.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-[#383838] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#252525] text-gray-300 px-1.5 py-0.5 rounded border border-[#333333]">
                      #{item.requirement.requiredOrder}
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      {item.kata.name}
                    </h4>
                    {item.approvedAt && (
                      <span className="text-[10px] text-green-400 font-medium">
                        Aprobada: {new Date(item.approvedAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {item.kata.description || 'Kata oficial Inoue Ha.'}
                  </p>
                </div>
                <div className="shrink-0 self-end sm:self-auto">
                  <KataBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentRoute('student-katas')}
              className="text-xs font-bold text-[#00FFFF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas las {activeStudentProgress.katas.length} katas del programa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Dojo Kun Footer Note */}
      <div className="pt-2 flex items-center justify-between text-gray-500 text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[10px]">
            Sistema Oficial de Seguimiento Marcial
          </span>
        </div>
        <span className="text-[11px]">Kyu Track v2.4</span>
      </div>
    </div>
  );
}
