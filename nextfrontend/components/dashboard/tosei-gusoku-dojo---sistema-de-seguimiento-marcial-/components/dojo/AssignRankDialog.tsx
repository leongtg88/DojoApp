'use client';

import React, { useState } from 'react';
import { Student, BeltRank } from '@/types';
import { X, Award, Info, Check } from 'lucide-react';

interface AssignRankDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  ranks: BeltRank[];
  onConfirmPromotion: (newRankId: string, examDate: string, examiner: string) => void;
}

export function AssignRankDialog({
  student,
  isOpen,
  onClose,
  ranks,
  onConfirmPromotion,
}: AssignRankDialogProps) {
  const currentRank = ranks.find((r) => r.id === student?.currentRankId);

  // Find ranks higher than current rank
  const eligibleRanks = ranks
    .filter((r) => !currentRank || r.order > currentRank.order)
    .sort((a, b) => a.order - b.order);

  const [userSelectedRankId, setUserSelectedRankId] = useState<string | null>(null);
  const selectedRankId = userSelectedRankId ?? (eligibleRanks[0]?.id || '');
  const [examDate, setExamDate] = useState<string>('3 de septiembre de 2026');
  const [examiner, setExaminer] = useState<string>(
    'Sensei Roberto Castillo (4.º Dan)'
  );

  if (!isOpen || !student) return null;

  const chosenRank = ranks.find((r) => r.id === selectedRankId);

  // Next rank after chosenRank
  const nextTargetRank = chosenRank
    ? ranks.find((r) => r.order === chosenRank.order + 1)
    : null;

  const handleConfirm = () => {
    if (!selectedRankId) return;
    onConfirmPromotion(selectedRankId, examDate, examiner);
    setUserSelectedRankId(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#161616] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-[#2A2A2A] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#111111] px-5 py-4 flex items-center justify-between border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-950/50 text-[#D10000] flex items-center justify-center border border-red-900/50">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Asignar nuevo grado
              </h3>
              <p className="text-xs text-gray-400">
                {student.name} · {student.matricula}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* Current Rank Badge */}
          <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500">
                Grado Actual en Expediente
              </span>
              <span className="text-xs font-bold text-white">
                {currentRank?.name} ({currentRank?.kyuDan})
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Otorgado: {student.rankAwardedDate}
            </span>
          </div>

          {/* New Rank Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rankSelect" className="text-xs font-bold text-gray-300">
              Seleccionar grado a otorgar
            </label>
            <select
              id="rankSelect"
              value={selectedRankId}
              onChange={(e) => setUserSelectedRankId(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-[#2A2A2A] text-white text-xs px-3 rounded-lg focus:outline-none focus:border-[#00FFFF] shadow-xs cursor-pointer"
            >
              {eligibleRanks.map((r, idx) => (
                <option key={r.id} value={r.id} className="bg-[#161616] text-white">
                  {r.name} ({r.kyuDan}) {idx === 0 ? '- Siguiente en syllabus' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Graduation Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="examDate" className="text-xs font-bold text-gray-300">
              Fecha de graduación / examen
            </label>
            <input
              id="examDate"
              type="text"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-[#2A2A2A] text-white text-xs px-3 rounded-lg focus:outline-none focus:border-[#00FFFF] shadow-xs"
            />
          </div>

          {/* Sensei Examiner */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="examiner" className="text-xs font-bold text-gray-300">
              Sensei examinador
            </label>
            <input
              id="examiner"
              type="text"
              value={examiner}
              onChange={(e) => setExaminer(e.target.value)}
              className="w-full h-10 bg-[#111111] border border-[#2A2A2A] text-white text-xs px-3 rounded-lg focus:outline-none focus:border-[#00FFFF] shadow-xs"
            />
          </div>

          {/* Explanatory Notice per prompt rule */}
          <div className="bg-[#1A1A1A] rounded-xl p-3.5 border border-[#D4AF37]/30 flex gap-2.5">
            <Info className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300 leading-relaxed space-y-1">
              <strong className="block font-bold text-[#D4AF37]">
                Efecto reglamentario en el avance:
              </strong>
              <p>
                Al confirmar el ascenso a{' '}
                <strong className="font-semibold text-white">
                  {chosenRank?.name} ({chosenRank?.kyuDan})
                </strong>
                , el progreso del alumno se actualizará de inmediato. Su siguiente meta pasará a ser automáticamente{' '}
                <strong className="font-semibold text-white">
                  {nextTargetRank
                    ? `${nextTargetRank.name} (${nextTargetRank.kyuDan})`
                    : 'el grado máximo final'}
                </strong>
                .
              </p>
              <p className="text-[11px] text-gray-400">
                El historial de katas anteriores se conserva en el expediente.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#111111] px-5 py-3.5 flex items-center justify-end gap-2.5 border-t border-[#2A2A2A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#222222] border border-[#333333] text-gray-300 hover:bg-[#2A2A2A] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirmar ascenso de grado</span>
          </button>
        </div>
      </div>
    </div>
  );
}
