'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { StudentPicker } from '../dojo/StudentPicker';
import { BirthdayWidget } from '../dojo/BirthdayWidget';
import { InstructorAttendanceBoard } from '../dojo/InstructorAttendanceBoard';
import { Users, Award, Clock } from 'lucide-react';

export function AdminStudentsView() {
  const { selectedStudentId, setSelectedStudentId, setCurrentRoute, attendances } = useDojo();
  const [adminTab, setAdminTab] = useState<'students' | 'attendance'>('students');

  const pendingAttendanceCount = attendances.filter((a) => a.status === 'PENDIENTE').length;

  const handleSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentRoute('admin-student-detail');
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#D10000] tracking-wider">
            Panel de Administración del Dojo
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            GESTIÓN GENERAL Y CONTROL DE ASISTENCIAS
          </h2>
          <p className="text-xs text-gray-400">
            Consulta expedientes, progreso curricular, cumpleaños y registro de asistencias del tatami.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCurrentRoute('admin-student-detail');
          }}
          className="px-3.5 py-2 rounded-lg bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <Award className="w-4 h-4" />
          <span>Ver Ficha y Ascensos</span>
        </button>
      </div>

      {/* Birthday Reminder Widget */}
      <BirthdayWidget />

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setAdminTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'students'
              ? 'bg-[#D10000] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Padrón de Karatekas Matriculados</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'attendance'
              ? 'bg-[#D10000] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Auditoría de Asistencias en Tatami</span>
          {pendingAttendanceCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-mono font-bold animate-pulse">
              {pendingAttendanceCount}
            </span>
          )}
        </button>
      </div>

      {adminTab === 'attendance' ? (
        <InstructorAttendanceBoard />
      ) : (
        <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A]">
          <StudentPicker
            selectedStudentId={selectedStudentId}
            onSelectStudent={handleSelect}
            layout="list"
            showSearch={true}
          />
        </div>
      )}
    </div>
  );
}
