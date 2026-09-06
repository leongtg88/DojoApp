'use client';

import React, { useState, useMemo } from 'react';
import { Student } from '@/types';
import { useDojo } from '@/context/DojoContext';
import { BeltRankIndicator } from './BeltRankIndicator';
import { Search, CheckCircle2, UserX, SlidersHorizontal } from 'lucide-react';
import Image from 'next/image';

interface StudentPickerProps {
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  layout?: 'carousel' | 'list';
  showSearch?: boolean;
  className?: string;
  id?: string;
}

export function StudentPicker({
  selectedStudentId,
  onSelectStudent,
  layout = 'carousel',
  showSearch = true,
  className = '',
  id,
}: StudentPickerProps) {
  const { students, ranks, getStudentProgress } = useDojo();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.matricula.toLowerCase().includes(term) ||
        s.location.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Carousel layout (like Image 3)
  if (layout === 'carousel') {
    return (
      <div id={id} className={`space-y-2.5 ${className}`}>
        {showSearch && (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar alumno por nombre, matrícula o sede..."
              className="w-full bg-[#161616] text-[#F5F5F5] border border-[#2A2A2A] rounded-xl pl-9 pr-10 py-2.5 text-xs shadow-xs focus:outline-none focus:border-[#00FFFF] transition-colors placeholder:text-gray-500"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 p-0.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Horizontal Carousel */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none select-none">
          {filteredStudents.map((student) => {
            const isSelected = student.id === selectedStudentId;
            const progress = getStudentProgress(student.id);
            const rank = ranks.find((r) => r.id === student.currentRankId);

            return (
              <button
                key={student.id}
                type="button"
                onClick={() => onSelectStudent(student.id)}
                className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E1E1E] shadow-md border-[#00FFFF] ring-1 ring-[#00FFFF]/40'
                    : 'bg-[#161616] hover:bg-[#1A1A1A] border-[#2A2A2A] shadow-xs'
                }`}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#2A2A2A]">
                  <Image
                    src={student.avatar}
                    alt={student.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#161616]"
                    style={{ backgroundColor: rank?.beltColor || '#FACC15' }}
                  />
                </div>

                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-bold text-white truncate leading-tight">
                    {student.name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      {rank?.kyuDan}
                    </span>
                    <span className="text-gray-600 text-[10px]">·</span>
                    <span
                      className={`text-[10px] font-bold ${
                        progress.percentage === 100
                          ? 'text-emerald-400'
                          : 'text-[#00FFFF]'
                      }`}
                    >
                      {progress.percentage}%
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[#00FFFF] ml-0.5 shrink-0" />
                )}
              </button>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2 px-3 bg-[#161616] border border-[#2A2A2A] rounded-lg">
              <UserX className="w-4 h-4 text-gray-500" />
              <span>No se encontraron alumnos con ese criterio.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vertical list layout (e.g. for student management directory)
  return (
    <div id={id} className={`space-y-3 ${className}`}>
      {showSearch && (
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar alumno por nombre, matrícula..."
            className="w-full bg-[#161616] text-[#F5F5F5] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2 text-xs shadow-xs focus:outline-none focus:border-[#00FFFF] placeholder:text-gray-500"
          />
        </div>
      )}

      <div className="divide-y divide-[#222222] bg-[#161616] rounded-xl border border-[#2A2A2A] shadow-lg overflow-hidden">
        {filteredStudents.map((student) => {
          const isSelected = student.id === selectedStudentId;
          const progress = getStudentProgress(student.id);
          const rank = ranks.find((r) => r.id === student.currentRankId);

          return (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelectStudent(student.id)}
              className={`w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer ${
                isSelected ? 'bg-[#1E1E1E]' : 'hover:bg-[#1A1A1A]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#2A2A2A]">
                  <Image
                    src={student.avatar}
                    alt={student.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {student.name}
                    </span>
                    <span className="text-[10px] bg-[#222222] text-gray-300 px-1.5 py-0.2 rounded font-mono border border-[#2A2A2A]">
                      {student.matricula}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <BeltRankIndicator rank={rank} size="sm" />
                    <span className="text-[11px] text-gray-400">
                      {rank?.name} ({rank?.kyuDan})
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[#00FFFF] block">
                  {progress.percentage}%
                </span>
                <span className="text-[10px] text-gray-500">
                  {progress.masteredCount}/{progress.totalRequired} katas
                </span>
              </div>
            </button>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-400 space-y-1">
            <UserX className="w-6 h-6 text-gray-600 mx-auto mb-1" />
            <p className="font-bold text-gray-300">Sin alumnos coincidentes</p>
            <p>Intenta con otro término de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
