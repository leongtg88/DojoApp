'use client';

import React from 'react';
import {
  CalendarCheck2,
  Clock,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';

interface MetricsGridProps {
  attendanceRate?: number;
  attendedClasses?: number;
  totalClasses?: number;
  nextClassTime?: string;
  nextClassTitle?: string;
  joinedDate?: string;
  antiquity?: string;
  masteredTechniques?: number;
  totalTechniques?: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  attendanceRate = 92,
  attendedClasses = 11,
  totalClasses = 12,
  nextClassTime = 'Hoy, 19:00',
  nextClassTitle = 'Kihon & Bunkai',
  joinedDate = "12 Mar '22",
  antiquity = '2 años, 11 meses',
  masteredTechniques = 14,
  totalTechniques = 20,
}) => {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {/* Metric 1: Asistencia 30 días */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-[#E5E2E1] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#666028]">
          <CalendarCheck2 className="w-4 h-4" />
          <span className="text-[11px] font-semibold text-[#916F6B]">
            30 días
          </span>
        </div>
        <div className="flex flex-col mt-2.5">
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C1B1B] leading-none">
            {attendanceRate}%
          </span>
          <span className="text-xs text-[#5C403C] mt-1 font-medium">
            {attendedClasses} de {totalClasses} clases
          </span>
        </div>
      </div>

      {/* Metric 2: Próxima clase */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-[#E5E2E1] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#DC2626]">
          <Clock className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
        </div>
        <div className="flex flex-col mt-2.5">
          <span className="font-display text-lg sm:text-xl font-bold text-[#1C1B1B] leading-none">
            {nextClassTime}
          </span>
          <span className="text-xs text-[#5C403C] mt-1 truncate">
            {nextClassTitle}
          </span>
        </div>
      </div>

      {/* Metric 3: Fecha de ingreso */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-[#E5E2E1] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#666028]">
          <CalendarDays className="w-4 h-4" />
          <span className="text-[11px] font-semibold text-[#916F6B]">
            Ingreso
          </span>
        </div>
        <div className="flex flex-col mt-2.5">
          <span className="font-display text-lg sm:text-xl font-bold text-[#1C1B1B] leading-none">
            {joinedDate}
          </span>
          <span className="text-xs text-[#5C403C] mt-1">{antiquity}</span>
        </div>
      </div>

      {/* Metric 4: Técnicas Dominadas */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-[#E5E2E1] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#666028]">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px] font-semibold text-[#916F6B]">
            Kyu Pgm
          </span>
        </div>
        <div className="flex flex-col mt-2.5">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C1B1B] leading-none">
              {masteredTechniques}
            </span>
            <span className="text-xs text-[#916F6B]">/ {totalTechniques}</span>
          </div>
          <span className="text-xs text-[#5C403C] mt-1">Técnicas listas</span>
        </div>
      </div>
    </section>
  );
};
