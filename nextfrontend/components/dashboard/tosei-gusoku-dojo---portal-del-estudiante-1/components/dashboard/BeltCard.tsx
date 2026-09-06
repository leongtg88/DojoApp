'use client';

import React from 'react';
import Link from 'next/link';
import { BeltRank } from '@/types/dashboard';
import { ChevronRight } from 'lucide-react';

interface BeltCardProps {
  beltRank: BeltRank;
  studentName?: string;
  showLinkToGrade?: boolean;
}

export const BeltCard: React.FC<BeltCardProps> = ({
  beltRank,
  studentName = 'ALEJANDRO S.',
  showLinkToGrade = true,
}) => {
  return (
    <section className="relative overflow-hidden bg-[#EBE7E7] rounded-xl p-4 sm:p-5 shadow-sm border border-[#E5E2E1]">
      {/* Background Japanese Watermark */}
      <div className="absolute -right-6 -bottom-8 opacity-5 pointer-events-none select-none">
        <span className="font-display text-[7.5rem] font-black text-[#1C1B1B] leading-none">
          参級
        </span>
      </div>

      <div className="flex flex-col gap-3 relative z-10">
        {/* Header: Title & Progress Pill */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#666028] tracking-wider uppercase">
              Grado Actual
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black text-[#1C1B1B] leading-tight">
              {beltRank.currentRankName}{' '}
              <span className="font-sans text-sm sm:text-base text-[#5C403C] font-normal">
                ({beltRank.currentRankBeltColor})
              </span>
            </h2>
            <span className="text-[11px] font-semibold text-[#916F6B] tracking-wider mt-0.5">
              {beltRank.japaneseKanji} • {beltRank.romaji}
            </span>
          </div>

          <div className="bg-white px-2.5 py-1 rounded-full shadow-xs border border-[#E5E2E1] flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            <span className="text-xs font-extrabold text-[#DC2626]">
              {beltRank.progressPercent}% AVANCE
            </span>
          </div>
        </div>

        {/* Visual Belt Representation: Brown Belt (Cha-obi) with Stitches & Gold Embroidered Name */}
        <div className="w-full bg-white rounded-md p-1.5 shadow-inner border border-[#E5E2E1]/60">
          <div className="relative w-full h-8 sm:h-9 bg-[#5A3825] rounded-sm flex items-center justify-between px-3 overflow-hidden shadow-sm">
            {/* Obi stitching texture lines */}
            <div className="absolute inset-x-0 top-1.5 h-px bg-[#3F2518] opacity-75" />
            <div className="absolute inset-x-0 bottom-1.5 h-px bg-[#3F2518] opacity-75" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#4A2E1E] opacity-90" />

            {/* Left embroidery: Traditional Kanji & Student Name */}
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-3 h-5 bg-[#4A2E1E] shadow-xs rounded-xs flex items-center justify-center border border-[#381F13]">
                <span className="w-1 h-3.5 bg-[#381F13] rounded-xs" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-[#EEE49F] tracking-widest uppercase leading-tight font-extrabold select-none">
                  当世具足
                </span>
                <span className="text-[8px] text-[#EEE49F]/80 tracking-wider leading-none select-none">
                  {studentName}
                </span>
              </div>
            </div>

            {/* Right: Red rank stripes on the belt tip */}
            <div className="relative z-10 flex items-center gap-1">
              <span className="w-1.5 h-5 bg-[#DC2626] rounded-xs shadow-xs" />
            </div>
          </div>
        </div>

        {/* Progress towards Next Rank */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between items-center text-xs text-[#1C1B1B]">
            <span className="font-semibold">
              Siguiente: {beltRank.nextRankName}
            </span>
            <span className="font-bold text-[#666028]">
              {beltRank.completedRequirements} / {beltRank.totalRequirements} Requisitos
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#E5E2E1] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#DC2626] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${beltRank.progressPercent}%` }}
            />
          </div>

          {/* Time in Grade & Status */}
          <div className="flex justify-between items-center text-[#5C403C] text-[11px] pt-1">
            <span>
              Tiempo de permanencia: {beltRank.monthsInGrade} de{' '}
              {beltRank.totalEstimatedMonths} meses
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#6A642C] bg-[#EBE29D] px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">
                En tiempo
              </span>
              {showLinkToGrade && (
                <Link
                  href="/dashboard/estudiante/grado"
                  className="text-[#DC2626] font-bold inline-flex items-center gap-0.5 hover:underline"
                >
                  <span>Detalles</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
