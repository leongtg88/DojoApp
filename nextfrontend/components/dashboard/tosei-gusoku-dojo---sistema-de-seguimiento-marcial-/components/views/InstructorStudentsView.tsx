'use client';

import React from 'react';
import { useDojo } from '@/context/DojoContext';
import { StudentPicker } from '../dojo/StudentPicker';
import { Users, Sparkles, ArrowRight } from 'lucide-react';

export function InstructorStudentsView() {
  const { selectedStudentId, setSelectedStudentId, setCurrentRoute } = useDojo();

  const handleSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentRoute('instructor-eval');
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#00FFFF] tracking-wider">
            Supervisión Técnica
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            DIRECTORIO DE ALUMNOS DEL SENSEI
          </h2>
          <p className="text-xs text-gray-400">
            Selecciona un alumno para evaluar su ejecución técnica y calificar sus katas.
          </p>
        </div>
      </div>

      <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A]">
        <StudentPicker
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelect}
          layout="list"
          showSearch={true}
        />
      </div>
    </div>
  );
}
