'use client';

import React, { useState } from 'react';
import {
  CheckCheck,
  RotateCw,
  Clock,
  UserCheck,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { StudentTechnique, TechniqueCategory } from '@/types/dashboard';

interface SyllabusSectionProps {
  techniques: StudentTechnique[];
}

export const SyllabusSection: React.FC<SyllabusSectionProps> = ({
  techniques,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories: { id: string; label: string; count: number }[] = [
    {
      id: 'all',
      label: 'Todas',
      count: techniques.length,
    },
    {
      id: 'Kihon',
      label: 'Kihon',
      count: techniques.filter((t) => t.category === 'Kihon').length,
    },
    {
      id: 'Kata',
      label: 'Kata',
      count: techniques.filter((t) => t.category === 'Kata').length,
    },
    {
      id: 'Kumite',
      label: 'Kumite',
      count: techniques.filter((t) => t.category === 'Kumite').length,
    },
    {
      id: 'Bunkai',
      label: 'Bunkai',
      count: techniques.filter((t) => t.category === 'Bunkai').length,
    },
  ];

  const filteredTechniques =
    activeCategory === 'all'
      ? techniques
      : techniques.filter((t) => t.category === activeCategory);

  const getStatusBadge = (status: StudentTechnique['status']) => {
    switch (status) {
      case 'Dominada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBE29D] text-[#6A642C] text-[11px] font-bold">
            <CheckCheck className="w-3.5 h-3.5 text-[#666028]" />
            <span>Dominada</span>
          </span>
        );
      case 'En progreso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EEE49F] text-[#1F1C00] text-[11px] font-bold">
            <RotateCw className="w-3.5 h-3.5" />
            <span>En progreso</span>
          </span>
        );
      case 'Por practicar':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5E2E1] text-[#5C403C] text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Por practicar</span>
          </span>
        );
    }
  };

  const getCategoryColor = (category: TechniqueCategory) => {
    switch (category) {
      case 'Kata':
        return 'bg-[#666028]';
      case 'Kihon':
        return 'bg-[#00617F]';
      case 'Kumite':
        return 'bg-[#DC2626]';
      case 'Bunkai':
      default:
        return 'bg-[#B8B070]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter Pills */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 bg-[#DC2626] rounded-sm" />
          <h2 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B]">
            Syllabus Marcial Oficial
          </h2>
        </div>
        <span className="text-[11px] font-bold text-[#666028] uppercase tracking-wider">
          {techniques.length} Técnicas clave
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const isDisabled = cat.count === 0 && cat.id !== 'all';

          return (
            <button
              key={cat.id}
              type="button"
              disabled={isDisabled}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1C1B1B] text-white shadow-xs'
                  : isDisabled
                  ? 'bg-[#E5E2E1]/60 text-[#916F6B] opacity-50 cursor-not-allowed'
                  : 'bg-[#EBE7E7] text-[#5C403C] hover:bg-[#E5E2E1] hover:text-[#1C1B1B]'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-80">({cat.count})</span>
            </button>
          );
        })}
      </div>

      {/* Technique Cards List */}
      {filteredTechniques.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-[#E5E2E1] flex flex-col items-center gap-2.5">
          <Award className="w-9 h-9 text-[#916F6B]/60" />
          <h3 className="text-sm font-bold text-[#1C1B1B]">
            No hay técnicas en la categoría seleccionada
          </h3>
          <p className="text-xs text-[#5C403C] max-w-sm">
            Las aplicaciones de Bunkai se desbloquearán y evaluarán formalmente durante la preparación para 2do Kyu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTechniques.map((tech) => (
            <article
              key={tech.id}
              className="bg-white rounded-xl p-4 shadow-xs border border-[#E5E2E1] transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-1 h-10 rounded-xs shrink-0 ${getCategoryColor(
                      tech.category
                    )}`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#666028]">
                        {tech.category}
                      </span>
                      <span className="text-[#916F6B] text-[10px]">•</span>
                      <span className="text-[11px] text-[#5C403C]">
                        {tech.subCategory}
                      </span>
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#1C1B1B] flex items-center gap-1.5">
                      <span>{tech.name}</span>
                      {tech.kanjiName && (
                        <span className="font-normal text-xs text-[#916F6B]">
                          {tech.kanjiName}
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {getStatusBadge(tech.status)}
              </div>

              {/* Feedback / Sensei observation */}
              {(tech.senseiNotes || tech.focusPoints) && (
                <div className="mt-3 bg-[#F6F3F2] rounded-lg p-2.5 space-y-1.5 border border-[#E5E2E1]/60">
                  <div className="flex items-center justify-between text-xs text-[#5C403C]">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1B1B]">
                      <UserCheck className="w-3.5 h-3.5 text-[#666028]" />
                      <span>{tech.evaluatedBy || 'Observación Técnica de Tatami'}</span>
                    </div>
                    {tech.approvedAt && (
                      <span className="text-[10px] text-[#916F6B]">
                        {tech.approvedAt}
                      </span>
                    )}
                  </div>
                  {tech.senseiNotes && (
                    <p className="text-xs text-[#1C1B1B] italic bg-white/70 px-2 py-1 rounded border border-[#E5E2E1]/40 leading-relaxed">
                      &ldquo;{tech.senseiNotes}&rdquo;
                    </p>
                  )}
                  {tech.focusPoints && (
                    <p className="text-[11px] text-[#5C403C] pl-1">
                      <strong className="text-[#666028]">Puntos de foco:</strong>{' '}
                      {tech.focusPoints}
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
