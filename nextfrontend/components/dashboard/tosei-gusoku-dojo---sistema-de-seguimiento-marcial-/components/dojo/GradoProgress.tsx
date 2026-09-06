'use client';

import React from 'react';
import { BeltRank } from '@/types';
import { BeltRankIndicator } from './BeltRankIndicator';
import {
  Award,
  ArrowRight,
  Info,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface GradoProgressProps {
  currentRank: BeltRank | null;
  nextRank: BeltRank | null;
  masteredCount: number;
  requiredCount: number;
  percentage: number;
  isMaxRank?: boolean;
  noNextRank?: boolean;
  noKatasConfigured?: boolean;
  isReadyForExam?: boolean;
  onNavigateToKatas?: () => void;
  onRequestExamReview?: () => void;
  className?: string;
  id?: string;
}

export function GradoProgress({
  currentRank,
  nextRank,
  masteredCount,
  requiredCount,
  percentage,
  isMaxRank = false,
  noNextRank = false,
  noKatasConfigured = false,
  isReadyForExam = false,
  onNavigateToKatas,
  onRequestExamReview,
  className = '',
  id,
}: GradoProgressProps) {
  // Case 1: Maximum Rank achieved (e.g. 1.º Dan Shodan)
  if (isMaxRank) {
    return (
      <div
        id={id}
        className={`bg-gradient-to-b from-[#1A1A1A] to-[#111111] rounded-xl p-6 shadow-xl border border-[#D4AF37]/40 relative overflow-hidden flex flex-col items-center text-center ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] mb-3 shadow-xs border border-[#D4AF37]/50">
          <Award className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/40 mb-2">
          Grado Máximo Alcanzado
        </span>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {currentRank?.name || 'Cinturón Negro'} ({currentRank?.kyuDan || '1.º Dan'})
        </h3>
        <p className="text-sm text-gray-400 font-medium mt-1">
          {currentRank?.japaneseName} · {currentRank?.kanji}
        </p>

        {/* Obi representation */}
        <div className="w-48 my-4">
          <BeltRankIndicator rank={currentRank} size="lg" />
        </div>

        <p className="text-sm text-gray-300 max-w-lg leading-relaxed mt-1">
          Has alcanzado el grado máximo de formación básica en{' '}
          <strong className="font-semibold text-white">Shito-Ryu Inoue Ha</strong>.
          ¡Enhorabuena! A partir de este momento concluye el aprendizaje de kyu y comienza el verdadero camino marcial:
          perfecciona tu Budo y guía a las nuevas generaciones en el tatami.
        </p>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md bg-[#161616] p-3 rounded-lg mt-5 border border-[#2A2A2A] text-left">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Estatus</span>
            <span className="text-xs font-bold text-gray-200">Yudansha Activo</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Facultad</span>
            <span className="text-xs font-bold text-gray-200">Asistente Sensei</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Siguiente Escalón</span>
            <span className="text-xs font-bold text-gray-200">Nidan (2028)</span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: No katas configured for the next rank
  if (noKatasConfigured && nextRank) {
    return (
      <div
        id={id}
        className={`bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-base text-white">Mi grado actual</span>
          <span className="bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A] text-xs px-2.5 py-0.5 rounded-md font-semibold uppercase">
            Shito-Ryu Inoue Ha
          </span>
        </div>

        <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white block">
              {currentRank?.name} {currentRank?.kyuDan}
            </span>
            <span className="text-xs text-gray-400">
              {currentRank?.description || 'Rango formativo en curso'}
            </span>
          </div>
          <BeltRankIndicator rank={currentRank} size="md" />
        </div>

        <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-300">
              Próximo grado ({nextRank.name} {nextRank.kyuDan}) sin katas configuradas
            </h4>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              El administrador del dojo aún no ha vinculado las katas requeridas para este nivel en el plan curricular.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: No next rank at all
  if (noNextRank || !nextRank) {
    return (
      <div
        id={id}
        className={`bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] ${className}`}
      >
        <div className="flex items-center gap-3 text-gray-400">
          <ShieldAlert className="w-5 h-5 text-gray-500" />
          <span className="text-sm">No se ha establecido un grado objetivo en el dojo.</span>
        </div>
      </div>
    );
  }

  // Case 4: Standard / In-progress / Complete
  return (
    <div
      id={id}
      className={`bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base text-white">Mi grado actual</span>
        <span className="bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A] text-xs px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wider">
          Shito-Ryu Inoue Ha
        </span>
      </div>

      {/* Belt Visual Box */}
      <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white block">
              {currentRank?.name} {currentRank?.kyuDan}
            </span>
            <span className="text-xs text-gray-400">
              {currentRank?.description || 'Rango formativo inicial de base'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400 uppercase font-bold block">
              Meta próxima
            </span>
            <span className="text-sm font-bold text-[#D4AF37]">
              {nextRank.name} {nextRank.kyuDan}
            </span>
          </div>
        </div>

        {/* Large Belt Indicator */}
        <BeltRankIndicator rank={currentRank} size="lg" />
      </div>

      {/* Progress towards Next Rank */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-200">
            Hacia {nextRank.name} {nextRank.kyuDan}
          </span>
          <span className="text-sm font-bold text-[#00FFFF]">
            {masteredCount} de {requiredCount} katas requeridas ({percentage}%)
          </span>
        </div>

        {/* Progress Bar Track */}
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-[#111111] h-3 rounded-full overflow-hidden p-0.5 border border-[#2A2A2A]"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isReadyForExam
                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-[#00A3A3] to-[#00FFFF] shadow-[0_0_12px_rgba(0,255,255,0.35)]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Informative note per user specifications */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#1A1A1A]/80 border border-[#2A2A2A] text-gray-300 mt-2">
          <Info className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            El {percentage}% refleja exclusivamente las katas dominadas y evaluadas en el dojo para optar al pase oficial a{' '}
            <strong className="font-semibold text-white">
              {nextRank.name} {nextRank.kyuDan}
            </strong>
            . Las katas del grado actual no computan.
          </p>
        </div>
      </div>

      {/* Ready for Exam Alert Banner */}
      {isReadyForExam && (
        <div className="rounded-xl bg-gradient-to-r from-[#1E1912] to-[#161616] border border-[#D4AF37]/50 p-4 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37] text-black flex items-center justify-center shrink-0 shadow-xs font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  ¡Aviso de culminación técnica!
                </h4>
                <span className="text-[10px] uppercase font-bold bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/40">
                  Apto para examen
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Has dominado el 100% de las katas requeridas para tu siguiente grado. Cumples los requisitos para solicitar la mesa de evaluación oficial.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onRequestExamReview}
              className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-gray-200 hover:text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Solicitar revisión de grado</span>
            </button>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#D10000] hover:bg-[#b00000] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ver fecha de tatami</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
