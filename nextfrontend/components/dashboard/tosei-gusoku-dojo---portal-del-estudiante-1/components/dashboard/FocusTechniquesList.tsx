'use client';

import React from 'react';
import Link from 'next/link';
import { Award, CheckCheck, RotateCw, Clock, Info, ChevronRight } from 'lucide-react';
import { StudentTechnique } from '@/types/dashboard';

interface FocusTechniquesListProps {
  techniques: StudentTechnique[];
}

export const FocusTechniquesList: React.FC<FocusTechniquesListProps> = ({
  techniques,
}) => {
  const displayTechniques = techniques.slice(0, 3);

  const getStatusBadge = (status: StudentTechnique['status']) => {
    switch (status) {
      case 'Dominada':
        return (
          <span className="bg-[#EEE49F] text-[#1F1C00] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-[#666028]" />
            <span>Dominada</span>
          </span>
        );
      case 'En progreso':
        return (
          <span className="bg-[#EBE29D] text-[#6A642C] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" />
            <span>En progreso</span>
          </span>
        );
      case 'Por practicar':
      default:
        return (
          <span className="bg-[#E5E2E1] text-[#5C403C] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Por practicar</span>
          </span>
        );
    }
  };

  if (!displayTechniques || displayTechniques.length === 0) {
    return (
      <section className="flex flex-col gap-2 mt-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#666028]" />
            <h3 className="font-display text-xs sm:text-sm uppercase tracking-wide text-[#1C1B1B] font-extrabold">
              Técnicas en Enfoque
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 text-center border border-[#E5E2E1] flex flex-col items-center gap-2">
          <Award className="w-8 h-8 text-[#916F6B]/60" />
          <p className="text-xs font-semibold text-[#1C1B1B]">
            No tienes técnicas asignadas en enfoque
          </p>
          <p className="text-[11px] text-[#5C403C]">
            Tu Sensei actualizará las katas y kihon requeridos para tu siguiente evaluación de grado.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2.5 mt-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#666028]" />
          <h3 className="font-display text-xs sm:text-sm uppercase tracking-wide text-[#1C1B1B] font-extrabold">
            Técnicas en Enfoque
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#916F6B]">
            {displayTechniques.length} seleccionadas
          </span>
          <Link
            href="/dashboard/estudiante/grado"
            className="text-[11px] font-bold text-[#DC2626] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Ver syllabus</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {displayTechniques.map((tech) => {
          return (
            <div
              key={tech.id}
              className="bg-white rounded-xl p-4 shadow-xs border border-[#E5E2E1] flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#666028] uppercase tracking-wider">
                    {tech.category} {tech.subCategory ? `• ${tech.subCategory}` : ''}
                  </span>
                  <h4 className="font-display text-sm sm:text-base font-extrabold text-[#1C1B1B]">
                    {tech.name}{' '}
                    {tech.kanjiName && (
                      <span className="text-xs font-normal text-[#916F6B]">
                        ({tech.kanjiName})
                      </span>
                    )}
                  </h4>
                </div>
                {getStatusBadge(tech.status)}
              </div>

              {/* Note / Feedback */}
              {tech.senseiNotes && (
                <div className="bg-[#EBE7E7] p-2.5 rounded-lg flex items-start gap-2 border border-[#E5E2E1]/60">
                  <Info className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#1C1B1B] font-medium leading-tight">
                    {tech.senseiNotes}
                  </p>
                </div>
              )}

              {/* Footer info */}
              <div className="flex items-center justify-between text-[#916F6B] text-[11px] pt-1">
                <span>
                  {tech.status === 'Dominada'
                    ? 'Evaluación formal aprobada'
                    : 'En práctica regular de tatami'}
                </span>
                <span className="font-semibold text-[#1C1B1B]">
                  {tech.evaluatedBy || 'Sensei Tanaka'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
