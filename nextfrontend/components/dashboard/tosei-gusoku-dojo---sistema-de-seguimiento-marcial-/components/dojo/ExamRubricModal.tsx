'use client';

import React from 'react';
import { Kata } from '@/types';
import { X, CheckCircle2, ClipboardCheck, BookOpen } from 'lucide-react';

interface ExamRubricModalProps {
  kata: Kata | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExamRubricModal({ kata, isOpen, onClose }: ExamRubricModalProps) {
  if (!isOpen || !kata) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#161616] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto border border-[#2A2A2A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/50 text-[#D10000] flex items-center justify-center shrink-0 border border-red-900/50">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pautas de Examen Oficial
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-[#00FFFF] uppercase tracking-wider">
                  {kata.name}
                </span>
                {kata.kanji && (
                  <span className="text-xs text-gray-400 font-serif">
                    {kata.kanji}
                  </span>
                )}
                <span className="text-[11px] bg-[#222222] text-gray-300 px-2 py-0.2 rounded font-medium border border-[#2A2A2A]">
                  {kata.movementsCount} movimientos
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar ventana"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#222222] text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pedagogical Description */}
        <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2A2A2A] text-xs text-gray-300 leading-relaxed flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
          <p>{kata.description || 'Criterios obligatorios de evaluación estipulados por el tribunal de cinturones de Santo Domingo Dojo.'}</p>
        </div>

        {/* Criterios de evaluación */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#2A2A2A]">
            <CheckCircle2 className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Postura y Estabilidad (Dachi)
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Firmeza absoluta en Zenkutsu dachi, Kokutsu dachi y Kiba dachi sin balanceo de talón al rotar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#2A2A2A]">
            <CheckCircle2 className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Potencia e Impacto (Kime & Hip Koshi)
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Rotación precisa de cadera en bloqueos y golpes. Contracción muscular instantánea en el punto focal.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#2A2A2A]">
            <CheckCircle2 className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Mirada y Presencia Marcial (Chudan Metsuke)
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                La vista debe preceder al movimiento antes de cualquier desplazamiento o cambio de frente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#2A2A2A]">
            <CheckCircle2 className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">
                Grito Marcial (Kiai)
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Ejecución sonora diafragmática en los puntos focales reglamentarios del embusen.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-[#222222]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
