'use client';

import React, { useState } from 'react';
import {
  mockStudentProfile,
  mockBeltRank,
  mockTechniques,
  mockSchedules,
} from '@/data/mock-data';
import { BeltCard } from '@/components/dashboard/BeltCard';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { UpcomingClassesList } from '@/components/dashboard/UpcomingClassesList';
import { FocusTechniquesList } from '@/components/dashboard/FocusTechniquesList';
import { BadgeCheck, SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function StudentResumenPage() {
  const [profile] = useState(mockStudentProfile);
  const [beltRank] = useState(mockBeltRank);
  const [techniques, setTechniques] = useState(mockTechniques);
  const [schedules, setSchedules] = useState(mockSchedules);

  // States to demonstrate requested empty states gracefully
  const [simulateEmptySchedule, setSimulateEmptySchedule] = useState(false);
  const [simulateEmptyTechniques, setSimulateEmptyTechniques] = useState(false);

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-5 max-w-4xl mx-auto">
      {/* Saludo Personalizado y Perfil Rápido */}
      <section className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-[#E5E2E1]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#EBE7E7] border border-[#E5E2E1] flex items-center justify-center font-display text-base font-bold text-[#1C1B1B]">
              AS
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-[#666028] font-bold">
                Kasshin
              </span>
              <span className="w-1 h-1 rounded-full bg-[#916F6B]/40" />
              <span className="text-[10px] text-[#916F6B] font-semibold">
                Activo
              </span>
            </div>
            <h1 className="font-display text-lg sm:text-xl text-[#1C1B1B] font-extrabold truncate">
              Bienvenido, {profile.firstName}
            </h1>
            <p className="text-xs text-[#5C403C] truncate">
              {profile.branch} • {profile.statusText}
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2" title="Alumno verificado del Honbu Dojo">
          <BadgeCheck className="w-5 h-5 text-[#666028]" />
        </div>
      </section>

      {/* Tarjeta de Grado Actual (Destacada y Marcial) */}
      <BeltCard
        beltRank={beltRank}
        studentName={`${profile.firstName[0]}. ${profile.lastName.split(' ')[0]}`.toUpperCase()}
      />

      {/* Métricas Compactas (Grid 2x2 / 4 cols) */}
      <MetricsGrid
        attendanceRate={beltRank.criteria.attendancePercent}
        attendedClasses={11}
        totalClasses={12}
        nextClassTime="Hoy, 19:00"
        nextClassTitle="Kihon & Bunkai"
        joinedDate="12 Mar '22"
        antiquity={profile.joinedAntiquity}
        masteredTechniques={
          techniques.filter((t) => t.status === 'Dominada').length + 12
        }
        totalTechniques={20}
      />

      {/* Sección: Próximas Clases */}
      <UpcomingClassesList
        schedules={simulateEmptySchedule ? [] : schedules}
      />

      {/* Sección: Mis Técnicas Actuales (En Enfoque) */}
      <FocusTechniquesList
        techniques={simulateEmptyTechniques ? [] : techniques}
      />

      {/* Control panel for testing empty states seamlessly */}
      <div className="mt-4 p-3 bg-[#F0EDEC]/70 rounded-xl border border-[#E5E2E1] flex items-center justify-between flex-wrap gap-2 text-xs text-[#5C403C]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#666028]" />
          <span className="font-semibold text-[#1C1B1B]">
            Simulador de estados vacíos para revisión:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSimulateEmptySchedule(!simulateEmptySchedule)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-colors ${
              simulateEmptySchedule
                ? 'bg-[#DC2626] text-white'
                : 'bg-white border border-[#E5E2E1] hover:bg-[#EBE7E7]'
            }`}
          >
            {simulateEmptySchedule ? 'Restaurar Clases' : 'Vaciar Clases'}
          </button>
          <button
            type="button"
            onClick={() => setSimulateEmptyTechniques(!simulateEmptyTechniques)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-colors ${
              simulateEmptyTechniques
                ? 'bg-[#DC2626] text-white'
                : 'bg-white border border-[#E5E2E1] hover:bg-[#EBE7E7]'
            }`}
          >
            {simulateEmptyTechniques ? 'Restaurar Técnicas' : 'Vaciar Técnicas'}
          </button>
        </div>
      </div>
    </div>
  );
}
