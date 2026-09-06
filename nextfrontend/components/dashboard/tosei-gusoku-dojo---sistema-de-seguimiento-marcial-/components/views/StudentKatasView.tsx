'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { BeltRankIndicator } from '../dojo/BeltRankIndicator';
import { KataList } from '../dojo/KataList';
import {
  BookOpen,
  Award,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

export function StudentKatasView() {
  const {
    activeStudent,
    activeStudentProgress,
    setCurrentRoute,
    ranks,
    students,
    setSelectedStudentId,
    selectedStudentId,
  } = useDojo();

  // Find a student with max rank if user wants to test the Dan view
  const danStudent = students.find((s) => s.currentRankId === 'rank-7');

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Breadcrumb & simulation switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <button
            type="button"
            onClick={() => setCurrentRoute('student-dashboard')}
            className="hover:text-gray-200 cursor-pointer"
          >
            Inicio
          </button>
          <ChevronRight className="w-3 h-3 text-gray-600" />
          <span className="text-white font-semibold">Grado y katas</span>
        </div>

        {/* Demo test toggle: Switch between Sofia (9.º kyu) and Kenji (1.º Dan) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium">Probar estado:</span>
          {danStudent && (
            <button
              type="button"
              onClick={() => {
                if (selectedStudentId === danStudent.id) {
                  // switch back to Sofia
                  setSelectedStudentId('student-1');
                } else {
                  setSelectedStudentId(danStudent.id);
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStudentId === danStudent?.id
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#D4AF37] shadow-xs'
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-300 hover:bg-[#252525] hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {selectedStudentId === danStudent?.id
                  ? 'Volver a 9.º Kyu (Sofía)'
                  : 'Simular Estado 1.º Dan (Kenji)'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          MI GRADO Y KATAS
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          Programa técnico oficial Inoue Ha Karate-Do • Ciclo 2026
        </p>
      </div>

      {/* If Maximum Rank: Show Special Gold/Black Insignia View */}
      {activeStudentProgress.isMaxRank ? (
        <div className="bg-[#161616] rounded-xl p-8 shadow-xl border border-[#D4AF37]/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
              Yudansha Activo
            </span>
            <h3 className="text-2xl font-bold text-white mt-2">
              {activeStudentProgress.currentRank?.name} ({activeStudentProgress.currentRank?.kyuDan})
            </h3>
            <p className="text-sm text-gray-400 font-serif">
              {activeStudentProgress.currentRank?.japaneseName} • {activeStudentProgress.currentRank?.kanji}
            </p>
          </div>

          <div className="max-w-xs mx-auto">
            <BeltRankIndicator rank={activeStudentProgress.currentRank} size="lg" />
          </div>

          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Has completado toda la malla formativa de cinturones de color (kyu). Tu enfoque actual es el perfeccionamiento continuo, la práctica de katas maestras avanzadas y la mentoría a cinturones inferiores dentro del dojo.
          </p>

          <div className="pt-2">
            <span className="text-xs text-gray-500">
              No aplican barras de progreso porcentual hacia grados superiores de kyu.
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Progression Bento Hero (Matching Image 2) */}
          <div className="bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-4">
            {/* Rank progression visual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Current Rank Box */}
              <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wider">
                    Grado Actual
                  </span>
                  <span className="text-base font-bold text-white block mt-0.5">
                    {activeStudentProgress.currentRank?.name} {activeStudentProgress.currentRank?.kyuDan}
                  </span>
                  <span className="text-xs text-gray-400">
                    Otorgado en mayo 2026
                  </span>
                </div>
                <BeltRankIndicator rank={activeStudentProgress.currentRank} size="md" />
              </div>

              {/* Target Next Rank Box */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D10000] block tracking-wider">
                    Próximo Objetivo
                  </span>
                  <span className="text-base font-bold text-[#D10000] block mt-0.5">
                    {activeStudentProgress.nextRank?.name} {activeStudentProgress.nextRank?.kyuDan}
                  </span>
                  <span className="text-xs text-gray-400">
                    Proyección: Octubre 2026
                  </span>
                </div>
                <BeltRankIndicator rank={activeStudentProgress.nextRank} size="md" />
              </div>
            </div>

            {/* Dominio Curricular Requerido Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-[#222222]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-gray-200">
                  Dominio Curricular Requerido:
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#00FFFF]">
                  {activeStudentProgress.percentage}% ({activeStudentProgress.masteredCount} de {activeStudentProgress.totalRequired} katas dominadas)
                </span>
              </div>

              {/* Bar */}
              <div className="w-full bg-[#111111] h-3 rounded-full overflow-hidden p-0.5 border border-[#2A2A2A]">
                <div
                  className="bg-gradient-to-r from-[#00A3A3] to-[#00FFFF] shadow-[0_0_12px_rgba(0,255,255,0.35)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeStudentProgress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  Faltan{' '}
                  <strong className="text-white font-semibold">
                    {activeStudentProgress.totalRequired - activeStudentProgress.masteredCount} katas
                  </strong>{' '}
                  requeridas para optar a evaluación
                </span>
                <span className="text-[11px] text-gray-500">
                  {activeStudentProgress.totalRequired} katas totales en syllabus
                </span>
              </div>
            </div>

            {/* Explanatory Rule Banner */}
            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] flex items-start gap-2.5 text-xs text-gray-300">
              <Info className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Este progreso computa únicamente las katas asociadas formalmente a{' '}
                <strong className="text-white font-semibold">
                  {activeStudentProgress.nextRank?.name} {activeStudentProgress.nextRank?.kyuDan}
                </strong>
                . Las katas del grado actual u otros grados ya acreditados permanecen en el historial técnico y no alteran este porcentaje.
              </p>
            </div>
          </div>

          {/* Katas List Component */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Katas Requeridas ({activeStudentProgress.katas.length})
              </h3>
              <span className="text-xs text-gray-500">
                Haz clic en una kata para consultar su pauta
              </span>
            </div>

            <KataList
              items={activeStudentProgress.katas}
              mode="student"
              showFilters={true}
              emptyMessage="No hay katas configuradas para este nivel."
            />
          </div>
        </>
      )}

      {/* Philosophy Banner: Dojo Kun */}
      <div className="bg-[#161616] text-gray-300 rounded-xl p-5 border border-[#2A2A2A] space-y-2">
        <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block">
          Dojo Kun • Principios Fundamentales
        </span>
        <blockquote className="text-xs italic text-gray-300 leading-relaxed">
          &ldquo;Uno: Perfeccionar el carácter. Uno: Ser leal y puntual. Uno: Cultivar el espíritu de esfuerzo. Uno: Respetar las reglas de etiqueta. Uno: Abstenerse de comportamientos violentos.&rdquo;
        </blockquote>
        <span className="text-[11px] text-gray-500 block text-right font-serif">
          — 道場訓 Inoue Ha Shito-Ryu
        </span>
      </div>
    </div>
  );
}
