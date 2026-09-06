'use client';

import React, { useState } from 'react';
import {
  mockBeltRank,
  mockTechniques,
  mockStudentProfile,
} from '@/data/mock-data';
import { SyllabusSection } from '@/components/dashboard/SyllabusSection';
import {
  Award,
  Hourglass,
  CalendarCheck,
  CheckCircle,
  Clock,
  History,
  ShieldAlert,
  Trophy,
  SlidersHorizontal,
} from 'lucide-react';

export default function MiGradoPage() {
  const [beltRank, setBeltRank] = useState(mockBeltRank);
  const [techniques] = useState(mockTechniques);
  const [isMaxRankDemo, setIsMaxRankDemo] = useState(false);

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-5 max-w-4xl mx-auto">
      {/* Banner de Grado y Rango Marcial (Lacquered Tatami Obsidian Card) */}
      <section className="relative overflow-hidden bg-[#1C1B1B] text-white rounded-xl p-4 sm:p-6 shadow-lg border border-black/40">
        <div className="absolute -right-6 -top-10 select-none pointer-events-none opacity-5 font-display text-[8.5rem] font-black leading-none text-white">
          参
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          {/* Top Pass Badges */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span className="text-[10px] sm:text-xs tracking-wider uppercase text-white/90 font-bold">
                Plan Oficial de Grado
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/60 tracking-widest uppercase font-mono">
              Budo Pass {beltRank.budoPassId}
            </span>
          </div>

          {/* Grade Names */}
          <div className="pt-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {isMaxRankDemo ? 'Cinturón Negro (1er Dan)' : beltRank.currentRankName}
              </h1>
              <span className="font-display text-sm sm:text-base text-[#D1C886] font-bold">
                {isMaxRankDemo ? '初段 (黒帯)' : beltRank.japaneseKanji}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/80 uppercase tracking-widest mt-0.5">
              {isMaxRankDemo
                ? 'Shodan • Cinturón Negro (Kuro-obi)'
                : `${beltRank.romaji} • ${beltRank.currentRankBeltColor}`}
            </p>
          </div>

          {/* Graphic Belt (Cha-obi stitched belt) */}
          <div className="pt-1 pb-1">
            <div className="relative w-full h-10 bg-[#0F0F0F] rounded-md shadow-inner flex items-center px-3 overflow-hidden border border-white/10">
              {/* Obi base color */}
              <div
                className={`absolute inset-0 transition-colors ${
                  isMaxRankDemo ? 'bg-[#151515]' : 'bg-[#5A3825]'
                } opacity-95`}
              />
              {/* Stitched linear seams */}
              <div className="absolute inset-x-0 top-2 h-px bg-black/40 opacity-70" />
              <div className="absolute inset-x-0 bottom-2 h-px bg-black/40 opacity-70" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-black/30 opacity-90" />

              {/* Knot & Traditional Gold Embroidery */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-6 bg-black/40 shadow-xs rounded-xs flex items-center justify-center border border-black/30">
                    <span className="w-1.5 h-4 bg-black/60 rounded-xs" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#EEE49F] tracking-widest uppercase leading-tight font-extrabold select-none">
                      当世具足
                    </span>
                    <span className="text-[8px] text-[#EEE49F]/80 tracking-widest leading-none select-none font-mono">
                      ALEJANDRO S.
                    </span>
                  </div>
                </div>

                {/* Rank stripe */}
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-6 bg-[#DC2626] shadow-xs" />
                  {isMaxRankDemo && (
                    <span className="w-1.5 h-6 bg-[#EEE49F] shadow-xs" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Siguiente Grado y Barra de Progreso */}
          {isMaxRankDemo ? (
            <div className="p-3 bg-white/10 rounded-lg border border-[#EEE49F]/30 flex items-center gap-2 mt-1">
              <Trophy className="w-5 h-5 text-[#EEE49F] shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#EEE49F] uppercase">
                  Grado Máximo de Alumno Alcanzado
                </span>
                <span className="text-[11px] text-white/80">
                  Has culminado el programa Kyu de formación base. Tu preparación continúa en el linaje Yudansha (Cinturones Negros).
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-1 flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70 uppercase font-semibold">
                    Próximo Objetivo
                  </span>
                  <span className="text-xs sm:text-sm text-white font-bold">
                    {beltRank.nextRankName}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-lg sm:text-xl font-extrabold text-[#FFDAD6]">
                    {beltRank.progressPercent}%
                  </span>
                  <span className="text-xs text-white/60 font-semibold">
                    ({beltRank.completedRequirements}/{beltRank.totalRequirements})
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-[#DC2626] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${beltRank.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-white/80 text-[11px] pt-1">
                <div className="flex items-center gap-1">
                  <Hourglass className="w-3.5 h-3.5 text-[#EEE49F]" />
                  <span>{beltRank.monthsInGrade} meses cursados</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-[#FFDAD6]" />
                  <span>Restan ~{beltRank.remainingMonths} meses para examen</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Criterios de Postulación para Examen (Panel Compacto) */}
      <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#E5E2E1]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E2E1]/60">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-[#B70011] rounded-sm" />
            <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B]">
              Criterios de Postulación
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EBE29D] text-[#6A642C] font-bold">
            {beltRank.examinationSession}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {/* Asistencia */}
          <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#5C403C] uppercase font-bold">
                Asistencia
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-[#666028]" />
            </div>
            <div className="mt-2">
              <span className="font-display text-base sm:text-lg font-extrabold text-[#1C1B1B]">
                {beltRank.criteria.attendancePercent}%
              </span>
              <span className="block text-[10px] text-[#5C403C]">
                Mínimo {beltRank.criteria.minAttendancePercent}%
              </span>
            </div>
          </div>

          {/* Horas de Tatami */}
          <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#5C403C] uppercase font-bold">
                Dojo
              </span>
              <Clock className="w-3.5 h-3.5 text-[#00617F]" />
            </div>
            <div className="mt-2">
              <span className="font-display text-base sm:text-lg font-extrabold text-[#1C1B1B]">
                {beltRank.criteria.dojoHoursCompleted}
                <span className="text-xs font-normal text-[#5C403C]">
                  /{beltRank.criteria.dojoHoursRequired}h
                </span>
              </span>
              <span className="block text-[10px] text-[#5C403C]">
                Faltan {beltRank.criteria.dojoHoursRequired - beltRank.criteria.dojoHoursCompleted}h
              </span>
            </div>
          </div>

          {/* Tiempo de Permanencia */}
          <div className="bg-[#F6F3F2] p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#5C403C] uppercase font-bold">
                Tiempo
              </span>
              <History className="w-3.5 h-3.5 text-[#666028]" />
            </div>
            <div className="mt-2">
              <span className="font-display text-base sm:text-lg font-extrabold text-[#1C1B1B]">
                {beltRank.criteria.monthsCompleted}
                <span className="text-xs font-normal text-[#5C403C]">
                  /{beltRank.criteria.monthsRequired}m
                </span>
              </span>
              <span className="block text-[10px] text-[#5C403C]">
                Mín. {beltRank.criteria.monthsRequired} meses
              </span>
            </div>
          </div>
        </div>

        {/* Estado informativo */}
        <div className="mt-3 p-2.5 bg-[#F0EDEC] rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#666028] shrink-0" />
          <p className="text-xs text-[#5C403C] leading-snug">
            En preparación regular. Registro activo para la convocatoria ordinaria de {beltRank.examinationSession}.
          </p>
        </div>
      </section>

      {/* Syllabus Oficial con Categorías y Feedback de Sensei */}
      <SyllabusSection techniques={techniques} />

      {/* Demo button for testing max grade message */}
      <div className="p-3 bg-[#F0EDEC]/70 rounded-xl border border-[#E5E2E1] flex items-center justify-between flex-wrap gap-2 text-xs text-[#5C403C]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#666028]" />
          <span className="font-semibold text-[#1C1B1B]">
            Demostración visual de requerimientos:
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMaxRankDemo(!isMaxRankDemo)}
          className="px-3 py-1 bg-white border border-[#E5E2E1] hover:bg-[#EBE7E7] text-[11px] font-bold uppercase rounded-md transition-colors"
        >
          {isMaxRankDemo ? 'Ver 3er Kyu Regular' : 'Simular Grado Máximo'}
        </button>
      </div>

      {/* Dojo Kun Footer Note */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E5E2E1] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1C1B1B] flex items-center justify-center text-white font-bold text-xs">
            道
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1C1B1B]">
              Dojo Kun • 常在戦場
            </span>
            <span className="text-[11px] text-[#5C403C]">
              La constancia forja el espíritu del cinturón negro.
            </span>
          </div>
        </div>
        <Award className="w-5 h-5 text-[#666028]" />
      </div>
    </div>
  );
}
