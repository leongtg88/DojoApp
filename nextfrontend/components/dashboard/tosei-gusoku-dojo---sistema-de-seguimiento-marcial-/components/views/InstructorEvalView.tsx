'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { StudentPicker } from '../dojo/StudentPicker';
import { BeltRankIndicator } from '../dojo/BeltRankIndicator';
import { KataStatusControl } from '../dojo/KataStatusControl';
import { KataBadge } from '../dojo/KataBadge';
import { BirthdayWidget } from '../dojo/BirthdayWidget';
import { InstructorAttendanceBoard } from '../dojo/InstructorAttendanceBoard';
import { KataStatus } from '@/types';
import {
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Layers,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';
import Image from 'next/image';

export function InstructorEvalView() {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    activeStudent,
    activeStudentProgress,
    updateKataStatus,
    showToast,
    attendances,
  } = useDojo();

  const [instructorTab, setInstructorTab] = useState<'eval' | 'attendance'>('eval');
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [editingNoteKataId, setEditingNoteKataId] = useState<string | null>(null);

  const pendingAttendanceCount = attendances.filter((a) => a.status === 'PENDIENTE').length;

  const handleStatusChange = async (kataId: string, newStatus: KataStatus) => {
    await updateKataStatus(selectedStudentId, kataId, newStatus);
  };

  const handleSaveNote = (kataId: string) => {
    showToast(
      'Observación guardada',
      'El alumno podrá ver esta retroalimentación en su panel personal.',
      'info'
    );
    setEditingNoteKataId(null);
  };

  const handleSaveAll = () => {
    showToast(
      'Evaluación registrada exitosamente',
      `Se han sincronizado las calificaciones para ${activeStudent.name}.`,
      'success'
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#00FFFF] tracking-wider">
            Mesa de Evaluación del Sensei
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            EVALUACIÓN TÉCNICA Y TATAMI
          </h2>
          <p className="text-xs text-gray-400">
            Acredita katas oficiales y valida la asistencia diaria de tus alumnos en tatami.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300 bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg font-medium">
            Sensei Roberto Castillo (4.º Dan)
          </span>
        </div>
      </div>

      {/* Birthday Reminder */}
      <BirthdayWidget />

      {/* Tab Navigation for Instructor */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setInstructorTab('eval')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            instructorTab === 'eval'
              ? 'bg-[#D10000] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Evaluación Técnica de Katas</span>
        </button>

        <button
          type="button"
          onClick={() => setInstructorTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all relative ${
            instructorTab === 'attendance'
              ? 'bg-[#D10000] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Control de Asistencia del Tatami</span>
          {pendingAttendanceCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-mono font-bold animate-pulse">
              {pendingAttendanceCount} pendientes
            </span>
          )}
        </button>
      </div>

      {instructorTab === 'attendance' ? (
        <InstructorAttendanceBoard />
      ) : (
        <>
          {/* Student Selector Carousel (Matching Image 3) */}
          <div className="bg-[#161616] rounded-xl p-4 shadow-lg border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Seleccionar Karateka a Evaluar
              </span>
              <span className="text-xs text-gray-500">
                {students.length} alumnos matriculados
              </span>
            </div>

            <StudentPicker
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
              layout="carousel"
            />
          </div>

      {/* Active Student Detail Card */}
      <div className="bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#D10000]/40 shadow-xs shrink-0">
              <Image
                src={activeStudent.avatar}
                alt={activeStudent.name}
                fill
                sizes="56px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">
                  {activeStudent.name}
                </h3>
                <span className="text-xs bg-[#222222] text-gray-300 px-2 py-0.5 rounded font-mono border border-[#2A2A2A]">
                  {activeStudent.matricula}
                </span>
                <span className="text-[10px] uppercase font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Activo
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <BeltRankIndicator
                  rank={activeStudentProgress.currentRank}
                  size="sm"
                />
                <span className="text-xs text-gray-300">
                  {activeStudentProgress.currentRank?.name} ({activeStudentProgress.currentRank?.kyuDan})
                </span>
                <span className="text-gray-600">→</span>
                <span className="text-xs font-bold text-[#00FFFF]">
                  Meta: {activeStudentProgress.nextRank?.name} ({activeStudentProgress.nextRank?.kyuDan})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:text-right text-left text-xs bg-[#1A1A1A] p-3 rounded-lg border border-[#2A2A2A]">
            <div>
              <span className="text-gray-500 text-[10px] uppercase font-bold block">
                Asistencia Tatami
              </span>
              <span className="font-bold text-gray-200">
                {activeStudent.attendancePercentage}% ({activeStudent.attendancesCount} clases)
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase font-bold block">
                Sede / Horario
              </span>
              <span className="font-bold text-gray-200">
                {activeStudent.location}
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#222222]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-300">
              Progreso hacia {activeStudentProgress.nextRank?.name} {activeStudentProgress.nextRank?.kyuDan}:
            </span>
            <span className="font-bold text-[#00FFFF]">
              {activeStudentProgress.masteredCount} de {activeStudentProgress.totalRequired} katas dominadas ({activeStudentProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-[#111111] h-2.5 rounded-full overflow-hidden border border-[#2A2A2A]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                activeStudentProgress.percentage === 100
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-[#00A3A3] to-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.4)]'
              }`}
              style={{ width: `${activeStudentProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Katas Evaluation Workspace */}
      <div className="bg-[#161616] rounded-xl p-5 shadow-lg border border-[#2A2A2A] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Katas Requeridas para Acreditación
            </h3>
            <p className="text-xs text-gray-400">
              Selecciona el estado según la ejecución en tatami. Revertir una kata dominada pedirá confirmación.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#00FFFF] bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-800/40">
            {activeStudentProgress.katas.length} katas en syllabus
          </span>
        </div>

        {/* Empty state if student has no katas */}
        {activeStudentProgress.katas.length === 0 ? (
          <div className="p-8 text-center bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-200">
              Sin katas asignadas para este grado
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              El alumno se encuentra en un grado terminal o el dojo aún no ha vinculado las formas técnicas para el siguiente nivel.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeStudentProgress.katas.map((item, idx) => {
              const isEditingThisNote = editingNoteKataId === item.kata.id;

              return (
                <div
                  key={item.kata.id}
                  className="p-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#383838] transition-colors space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Kata title & metadata */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#252525] border border-[#333333] text-gray-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.requirement.requiredOrder || idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">
                            {item.kata.name}
                          </h4>
                          {item.kata.kanji && (
                            <span className="text-xs text-gray-400 font-serif">
                              {item.kata.kanji}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 bg-[#222222] border border-[#2A2A2A] px-2 py-0.5 rounded">
                            {item.kata.movementsCount} movimientos
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {item.kata.description || 'Forma oficial Shito-Ryu.'}
                        </p>
                      </div>
                    </div>

                    {/* Segmented status selector */}
                    <div className="shrink-0 self-start lg:self-center">
                      <KataStatusControl
                        currentStatus={item.status}
                        kataId={item.kata.id}
                        kataName={item.kata.name}
                        onStatusSelect={(status) =>
                          handleStatusChange(item.kata.id, status)
                        }
                      />
                    </div>
                  </div>

                  {/* Notes / Feedback for student */}
                  <div className="pt-2 border-t border-[#252525] flex items-start justify-between gap-2">
                    {isEditingThisNote ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          defaultValue={item.notes || ''}
                          placeholder="Añadir corrección técnica (ej. corregir zenkutsu dachi en el giro)..."
                          className="flex-1 bg-[#141414] border border-[#3A3A3A] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FFFF]"
                          id={`note-input-${item.kata.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(item.kata.id)}
                          className="px-3 py-1.5 bg-[#008080] hover:bg-[#009999] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNoteKataId(null)}
                          className="px-2.5 py-1.5 bg-[#252525] hover:bg-[#333333] text-gray-300 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                          <span className="italic text-gray-400">
                            {item.notes
                              ? `Observación: "${item.notes}"`
                              : 'Sin observaciones para esta kata.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingNoteKataId(item.kata.id)}
                          className="text-[11px] text-[#00FFFF] hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                        >
                          {item.notes ? 'Modificar' : '+ Añadir observación'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky Action Footer (Matching Image 3) */}
        <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-300">
              Resumen de evaluación:
            </span>
            <span className="text-xs font-bold text-[#00FFFF]">
              {activeStudentProgress.masteredCount} de {activeStudentProgress.totalRequired} dominadas ({activeStudentProgress.percentage}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStudentId(selectedStudentId)}
              className="px-3.5 py-2 rounded-lg bg-[#222222] border border-[#333333] text-gray-300 hover:bg-[#2A2A2A] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deshacer cambios</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-lg bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Evaluación Oficial</span>
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
