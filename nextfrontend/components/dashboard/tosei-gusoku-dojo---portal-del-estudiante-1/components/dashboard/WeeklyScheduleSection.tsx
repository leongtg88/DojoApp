'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  QrCode,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ClassSchedule } from '@/types/dashboard';

interface WeeklyScheduleSectionProps {
  schedules: ClassSchedule[];
}

export const WeeklyScheduleSection: React.FC<WeeklyScheduleSectionProps> = ({
  schedules,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isRecessMode, setIsRecessMode] = useState<boolean>(false);

  const days: { key: string; label: string; dateNum: number }[] = [
    { key: 'L', label: 'L', dateNum: 15 },
    { key: 'M', label: 'M', dateNum: 16 },
    { key: 'X', label: 'X', dateNum: 17 },
    { key: 'J', label: 'J', dateNum: 18 },
    { key: 'V', label: 'V', dateNum: 19 },
    { key: 'S', label: 'S', dateNum: 20 },
    { key: 'D', label: 'D', dateNum: 21 },
  ];

  const nextClass = schedules.find((s) => s.isNextClass) || schedules[0];

  const filteredSchedules = isRecessMode
    ? []
    : selectedDay === 'all'
    ? schedules
    : schedules.filter((s) => s.dayShort === selectedDay);

  return (
    <div className="space-y-4">
      {/* Header Bar: Week Info & Location */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#1C1B1B] tracking-tight">
            Mi Horario Semanal
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBE29D] text-[#6A642C] text-[10px] font-bold tracking-wider uppercase">
            En Curso
          </span>
        </div>
        <p className="text-xs text-[#5C403C] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
          <span>Programa Adulto Avanzado • Honbu Dojo - Roma Norte</span>
        </p>
      </div>

      {/* Week Selector Bar */}
      <div className="flex items-center justify-between bg-[#F0EDEC] p-1.5 rounded-xl shadow-xs border border-[#E5E2E1]">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center text-[#5C403C] hover:text-[#1C1B1B] rounded-lg hover:bg-white/80 transition-colors"
          title="Semana anterior"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#666028]" />
          <span className="text-xs font-bold text-[#1C1B1B] uppercase tracking-wider">
            Semana 14: 15 - 21 Abril
          </span>
        </div>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center text-[#5C403C] hover:text-[#1C1B1B] rounded-lg hover:bg-white/80 transition-colors"
          title="Semana siguiente"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Filter Chips */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedDay('all')}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
            selectedDay === 'all'
              ? 'bg-[#1C1B1B] text-white shadow-xs font-bold'
              : 'bg-[#F0EDEC] text-[#5C403C] hover:bg-[#E5E2E1]'
          }`}
        >
          <span className="text-[10px] uppercase opacity-80">Ver</span>
          <span className="text-xs font-bold">Todo</span>
        </button>

        {days.map((day) => {
          const isSelected = selectedDay === day.key;
          const hasClasses = schedules.some((s) => s.dayShort === day.key);

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDay(day.key)}
              className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
                isSelected
                  ? 'bg-[#DC2626] text-white shadow-md font-bold'
                  : hasClasses
                  ? 'bg-white text-[#1C1B1B] border border-[#E5E2E1] hover:bg-[#F6F3F2]'
                  : 'bg-[#F0EDEC]/60 text-[#916F6B] opacity-70'
              }`}
            >
              <span className="text-[10px] uppercase opacity-90">{day.label}</span>
              <span className="text-xs font-bold">{day.dateNum}</span>
            </button>
          );
        })}
      </div>

      {/* Highlighted Next Immediate Class Banner */}
      {!isRecessMode && nextClass && (
        <section className="relative overflow-hidden rounded-xl bg-white p-4 sm:p-5 shadow-xs border border-[#E5E2E1]">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#DC2626]" />
          <div className="flex flex-col gap-2 pl-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#DC2626]">
                  Próxima Clase Inmediata
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEE49F] text-[#1F1C00] text-[10px] font-bold uppercase">
                Hoy
              </span>
            </div>

            <div className="flex flex-col">
              <h2 className="font-display text-base sm:text-lg font-extrabold text-[#1C1B1B] leading-tight">
                {nextClass.title}
              </h2>
              <span className="text-xs text-[#5C403C] font-medium mt-0.5">
                {nextClass.day} • {nextClass.startTime} a {nextClass.endTime} hrs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 bg-[#F6F3F2] p-2.5 rounded-lg border border-[#E5E2E1]/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#666028] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#916F6B] uppercase font-bold">
                    Tatami
                  </span>
                  <span className="text-xs text-[#1C1B1B] font-semibold truncate">
                    {nextClass.branch}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#666028] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#916F6B] uppercase font-bold">
                    Instructor
                  </span>
                  <span className="text-xs text-[#1C1B1B] font-semibold truncate">
                    {nextClass.instructor}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#EBE29D]/30 px-3 py-2 rounded-lg mt-1 border border-[#EBE29D]/60">
              <AlertCircle className="w-4 h-4 text-[#6A642C] shrink-0" />
              <p className="text-xs text-[#6A642C] leading-snug">
                {nextClass.notes ||
                  'Llegar 15 min antes con karategi limpio y protecciones de puño.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Title & Recess Simulator Control */}
      <div className="flex items-center justify-between pt-1">
        <span className="font-display text-sm sm:text-base font-bold text-[#1C1B1B]">
          Sesiones de la Semana
        </span>
        <button
          type="button"
          onClick={() => setIsRecessMode(!isRecessMode)}
          className="text-xs font-bold text-[#00617F] hover:text-[#004D65] flex items-center gap-1.5 transition-colors bg-[#BFE8FF]/30 px-2.5 py-1 rounded-lg"
        >
          {isRecessMode ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Horario</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Simular Receso</span>
            </>
          )}
        </button>
      </div>

      {/* Schedule Items List OR Empty State */}
      {filteredSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E5E2E1] shadow-xs text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#EBE29D]/50 flex items-center justify-center text-[#666028]">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B]">
              No hay horarios asignados para tu programa
            </h3>
            <p className="text-xs text-[#5C403C]">
              {selectedDay !== 'all'
                ? `No hay clases programadas para el día ${selectedDay}. Selecciona otro día o pulsa "Ver Todo".`
                : 'En este período de calendario dojo no se registran entrenamientos regulares o te encuentras en período de receso institucional.'}
            </p>
          </div>
          {isRecessMode && (
            <button
              type="button"
              onClick={() => setIsRecessMode(false)}
              className="mt-1 px-4 py-2 bg-[#666028] text-white rounded-lg text-xs font-bold hover:bg-[#666028]/90 transition-colors"
            >
              Restaurar sesiones activas
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSchedules.map((sch) => (
            <div
              key={sch.id}
              className="flex flex-col bg-white p-4 rounded-xl shadow-xs border border-[#E5E2E1]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sch.isNextClass
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-[#E5E2E1] text-[#1C1B1B]'
                    }`}
                  >
                    {sch.day} {sch.dateNumber}
                  </span>
                  <span className="text-xs font-bold text-[#666028]">
                    {sch.startTime} - {sch.endTime} hrs
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase ${
                    sch.isNextClass
                      ? 'text-[#DC2626] flex items-center gap-1 font-extrabold'
                      : 'text-[#916F6B]'
                  }`}
                >
                  {sch.isNextClass && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  )}
                  {sch.statusBadge || 'Programada'}
                </span>
              </div>

              <h3 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B]">
                {sch.title}
              </h3>

              <div className="flex items-center gap-3 text-[#5C403C] text-xs mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#666028]" />
                  <span>{sch.branch}</span>
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#666028]" />
                  <span>
                    {sch.instructor}{' '}
                    {sch.instructorRank ? `(${sch.instructorRank.split('•')[0].trim()})` : ''}
                  </span>
                </span>
              </div>

              {sch.notes && (
                <div className="mt-2.5 pt-2 border-t border-[#E5E2E1]/60 flex items-center gap-1.5 text-[#666028] text-[11px]">
                  <Shield className="w-3 h-3 shrink-0" />
                  <span>{sch.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Protocolo de Asistencia & Normativa Card */}
      <div className="flex items-start gap-3 p-3.5 bg-[#F0EDEC] rounded-xl border border-[#E5E2E1]">
        <QrCode className="w-5 h-5 text-[#00617F] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1C1B1B]">
            Protocolo de Asistencia &amp; Normativa
          </span>
          <p className="text-xs text-[#5C403C] leading-relaxed">
            Registro de asistencia mediante QR en recepción al ingresar al dojo. En caso de inasistencia justificada, favor de notificar con al menos 2 horas de anticipación a través del portal de estudiantes.
          </p>
        </div>
      </div>
    </div>
  );
};
