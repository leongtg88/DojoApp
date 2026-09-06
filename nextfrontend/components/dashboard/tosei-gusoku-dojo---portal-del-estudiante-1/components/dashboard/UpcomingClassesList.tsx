'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle, ChevronRight, UserCheck } from 'lucide-react';
import { ClassSchedule } from '@/types/dashboard';

interface UpcomingClassesListProps {
  schedules: ClassSchedule[];
  onViewAllClick?: () => void;
}

export const UpcomingClassesList: React.FC<UpcomingClassesListProps> = ({
  schedules,
  onViewAllClick,
}) => {
  const [registeredMap, setRegisteredMap] = useState<Record<string, boolean>>({
    'sch-1': true,
    'sch-2': true,
  });

  const toggleRegister = (id: string) => {
    setRegisteredMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!schedules || schedules.length === 0) {
    return (
      <section className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#DC2626]" />
            <h3 className="font-display text-xs sm:text-sm uppercase tracking-wide text-[#1C1B1B] font-extrabold">
              Próximas Clases
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 text-center border border-[#E5E2E1] flex flex-col items-center gap-2">
          <Calendar className="w-8 h-8 text-[#916F6B]/60" />
          <p className="text-xs font-semibold text-[#1C1B1B]">
            No hay clases programadas para esta semana
          </p>
          <p className="text-[11px] text-[#5C403C]">
            Revisa la sección de horarios para consultar convocatorias de seminarios o dojo abierto.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2.5 mt-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#DC2626]" />
          <h3 className="font-display text-xs sm:text-sm uppercase tracking-wide text-[#1C1B1B] font-extrabold">
            Próximas Clases
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#666028]">Semana 9</span>
          <Link
            href="/dashboard/estudiante/horario"
            className="text-[11px] font-bold text-[#DC2626] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Ver horario</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {schedules.slice(0, 2).map((item, index) => {
          const isPrimary = index === 0;
          const isRegistered = registeredMap[item.id] ?? false;

          return (
            <div
              key={item.id}
              className={`rounded-xl p-4 shadow-xs border transition-all ${
                isPrimary
                  ? 'bg-white border-[#E5E2E1] relative overflow-hidden'
                  : 'bg-[#F6F3F2] border-[#E5E2E1]/70'
              }`}
            >
              {isPrimary && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DC2626]" />
              )}

              {/* Class Header info */}
              <div className="flex justify-between items-start mb-1.5 pl-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isPrimary ? (
                    <span className="bg-[#EBE29D] text-[#6A642C] text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Próxima Sesión
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#5C403C]">
                      {item.day} • {item.startTime} - {item.endTime}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-[#916F6B]">
                    {item.branch}
                  </span>
                </div>
                {isPrimary && (
                  <span className="text-xs font-bold text-[#1C1B1B]">
                    {item.day} • {item.startTime} - {item.endTime}
                  </span>
                )}
                {!isPrimary && (
                  <span className="text-xs font-bold text-[#666028]">
                    Dojo Sur
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="flex flex-col pl-1">
                <h4 className="font-display text-sm sm:text-base font-extrabold text-[#1C1B1B]">
                  {item.title}
                </h4>
                <p className="text-xs text-[#5C403C] mt-0.5 leading-relaxed">
                  {item.notes || 'Énfasis en distancia Ma-ai y respuesta inmediata desde shizentai.'}
                </p>
              </div>

              {/* Footer: Sensei & Action */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E5E2E1]/60 pl-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#EBE7E7] flex items-center justify-center text-[#1C1B1B] text-[10px] font-bold">
                    {item.instructor
                      .split(' ')
                      .slice(1, 3)
                      .map((n) => n[0])
                      .join('') || 'HT'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1C1B1B] leading-tight">
                      {item.instructor}
                    </span>
                    <span className="text-[10px] text-[#916F6B] leading-tight">
                      {item.instructorRank || 'Instructor'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRegister(item.id)}
                  className={`text-[11px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 shadow-xs ${
                    isRegistered
                      ? 'bg-[#DC2626] text-white hover:bg-[#B70011]'
                      : 'bg-white text-[#1C1B1B] border border-[#E5E2E1] hover:bg-[#F6F3F2]'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isRegistered ? 'Registrado' : 'Confirmar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
