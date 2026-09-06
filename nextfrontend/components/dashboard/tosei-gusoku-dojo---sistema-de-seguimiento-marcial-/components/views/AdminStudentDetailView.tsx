'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { BeltRankIndicator } from '../dojo/BeltRankIndicator';
import { AssignRankDialog } from '../dojo/AssignRankDialog';
import { KataBadge } from '../dojo/KataBadge';
import {
  User,
  Award,
  ChevronRight,
  Plus,
  ShieldCheck,
  Calendar,
  History,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Mail,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

export function AdminStudentDetailView() {
  const {
    activeStudent,
    activeStudentProgress,
    ranks,
    studentKatas,
    katas,
    promoteStudent,
    setCurrentRoute,
    showToast,
  } = useDojo();

  const [isAssignRankOpen, setIsAssignRankOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'katas' | 'payments' | 'attendance' | 'medical'>('katas');

  const currentRank = ranks.find((r) => r.id === activeStudent.currentRankId);

  // All historical mastered katas for this student across ANY rank
  const masteredHistory = studentKatas
    .filter((sk) => sk.studentId === activeStudent.id && sk.status === 'APROBADA')
    .map((sk) => ({
      sk,
      kata: katas.find((k) => k.id === sk.kataId),
    }))
    .filter((item): item is { sk: typeof studentKatas[0]; kata: typeof katas[0] } => Boolean(item.kata));

  const handleConfirmPromotion = (newRankId: string, examDate: string, examiner: string) => {
    const promotedRank = ranks.find((r) => r.id === newRankId);
    promoteStudent(activeStudent.id, newRankId, examDate, examiner);
    showToast(
      'Ascenso registrado con éxito',
      `${activeStudent.name} ha sido promovida a ${promotedRank?.name} (${promotedRank?.kyuDan}). Su meta curricular se recalculó automáticamente.`,
      'success'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <button
          type="button"
          onClick={() => setCurrentRoute('admin-curriculum')}
          className="hover:text-white cursor-pointer transition-colors"
        >
          Administración
        </button>
        <ChevronRight className="w-3 h-3 text-gray-600" />
        <button
          type="button"
          onClick={() => setCurrentRoute('admin-students')}
          className="hover:text-white cursor-pointer transition-colors"
        >
          Alumnos
        </button>
        <ChevronRight className="w-3 h-3 text-gray-600" />
        <span className="text-white font-semibold">{activeStudent.name}</span>
      </div>

      {/* Student Profile Card (Matching Image 5) */}
      <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#D10000]/40 shadow-xs shrink-0">
              <Image
                src={activeStudent.avatar}
                alt={activeStudent.name}
                fill
                sizes="64px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">
                  {activeStudent.name}
                </h2>
                <span className="text-xs bg-[#222222] text-gray-300 border border-[#333333] px-2 py-0.5 rounded font-mono font-bold">
                  {activeStudent.matricula}
                </span>
                <span className="text-[10px] uppercase font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded">
                  Activa
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  {activeStudent.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  {activeStudent.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  {activeStudent.email || 'sofia.martinez@dojo.com'}
                </span>
              </div>
            </div>
          </div>

          {/* Promotion Button */}
          <div className="shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAssignRankOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Asignar nuevo grado</span>
            </button>
          </div>
        </div>

        {/* Current Rank & Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#2A2A2A]">
          {/* Rank status */}
          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wider">
                Grado Actual
              </span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {currentRank?.name} ({currentRank?.kyuDan})
              </span>
              <span className="text-[11px] text-gray-400">
                Otorgado: {activeStudent.rankAwardedDate}
              </span>
            </div>
            <BeltRankIndicator rank={currentRank} size="sm" />
          </div>

          {/* Attendance progress */}
          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wider">
              Asistencia Requerida
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-white">
                {activeStudent.attendancePercentage}%
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40">
                Apta para examen
              </span>
            </div>
            <span className="text-[11px] text-gray-400 block mt-1">
              {activeStudent.attendancesCount} de {activeStudent.targetAttendances} asistencias registradas
            </span>
          </div>

          {/* Curriculum progress */}
          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <span className="text-[10px] uppercase font-bold text-gray-500 block tracking-wider">
              Siguiente Grado: {activeStudentProgress.nextRank?.name || 'Completado'}
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold text-[#00FFFF]">
                {activeStudentProgress.percentage}%
              </span>
              <span className="text-xs text-gray-400">
                {activeStudentProgress.masteredCount}/{activeStudentProgress.totalRequired} katas
              </span>
            </div>
            <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#D10000] h-full rounded-full"
                style={{ width: `${activeStudentProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Tabs */}
      <div className="space-y-4">
        <div className="border-b border-[#2A2A2A]">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('katas')}
              className={`pb-3 relative cursor-pointer transition-colors ${
                activeTab === 'katas'
                  ? 'text-[#00FFFF] font-bold border-b-2 border-[#00FFFF]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Katas e historial técnico
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 relative cursor-pointer transition-colors ${
                activeTab === 'attendance'
                  ? 'text-[#00FFFF] font-bold border-b-2 border-[#00FFFF]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Registro de asistencias
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`pb-3 relative cursor-pointer transition-colors ${
                activeTab === 'payments'
                  ? 'text-[#00FFFF] font-bold border-b-2 border-[#00FFFF]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Pagos y membresía
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('medical')}
              className={`pb-3 relative cursor-pointer transition-colors ${
                activeTab === 'medical'
                  ? 'text-[#00FFFF] font-bold border-b-2 border-[#00FFFF]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Ficha médica y dojo
            </button>
          </div>
        </div>

        {/* Tab 1: Katas e Historial Técnico (Matching Image 5) */}
        {activeTab === 'katas' && (
          <div className="space-y-4">
            {/* Katas en curso para el siguiente grado */}
            <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Katas Requeridas hacia {activeStudentProgress.nextRank?.name} ({activeStudentProgress.nextRank?.kyuDan})
                  </h4>
                  <p className="text-xs text-gray-400">
                    Solo estas katas determinan el {activeStudentProgress.percentage}% de avance al siguiente rango.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#00FFFF]">
                  {activeStudentProgress.masteredCount} de {activeStudentProgress.totalRequired} dominadas
                </span>
              </div>

              <div className="divide-y divide-[#2A2A2A] border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#161616]">
                {activeStudentProgress.katas.map((item) => (
                  <div
                    key={item.kata.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[#1A1A1A] text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-500">
                        #{item.requirement.requiredOrder}
                      </span>
                      <div>
                        <span className="font-bold text-white">
                          {item.kata.name}
                        </span>
                        {item.kata.kanji && (
                          <span className="text-gray-400 ml-1.5 font-serif">
                            {item.kata.kanji}
                          </span>
                        )}
                        <p className="text-[11px] text-gray-400">
                          {item.kata.category} · {item.kata.movementsCount} movimientos
                        </p>
                      </div>
                    </div>
                    <KataBadge status={item.status} approvedAt={item.approvedAt} />
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de Katas Dominadas (Historial completo acumulado) */}
            <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00FFFF]" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Historial de Katas Acreditadas ({masteredHistory.length})
                  </h4>
                </div>
                <span className="text-xs text-gray-400">
                  Registro permanente en expediente
                </span>
              </div>

              <div className="divide-y divide-[#2A2A2A] border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#161616]">
                {masteredHistory.map(({ sk, kata }) => (
                  <div
                    key={kata.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[#1A1A1A] text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00FFFF] shrink-0" />
                      <div>
                        <span className="font-bold text-white">
                          {kata.name}
                        </span>
                        <p className="text-[11px] text-gray-400">
                          {kata.category} · Evaluada por Sensei Roberto Castillo
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {sk.approvedAt ? new Date(sk.approvedAt).toLocaleDateString('es-DO') : 'Mayo 2026'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Asistencias */}
        {activeTab === 'attendance' && (
          <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A] space-y-3">
            <h4 className="text-sm font-bold text-white">Historial Reciente de Tatami</h4>
            <div className="divide-y divide-[#2A2A2A] text-xs text-gray-300">
              <div className="py-2.5 flex items-center justify-between">
                <span>Martes 1 de septiembre · 5:00 p. m.</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/40 px-2 py-0.5 rounded">Presente</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span>Jueves 27 de agosto · 5:00 p. m.</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/40 px-2 py-0.5 rounded">Presente</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span>Martes 25 de agosto · 5:00 p. m.</span>
                <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-900/40 px-2 py-0.5 rounded">Excusa Justificada</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pagos */}
        {activeTab === 'payments' && (
          <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A] space-y-3">
            <h4 className="text-sm font-bold text-white">Estado de Membresía</h4>
            <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/40 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400">Membresía Mensual: Al día</span>
              <span className="text-gray-400">Próximo vencimiento: 15 de octubre de 2026</span>
            </div>
          </div>
        )}

        {/* Tab 4: Médica */}
        {activeTab === 'medical' && (
          <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A] space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white">Certificado Médico y Contacto de Emergencia</h4>
            <p className="text-gray-400">Contacto de emergencia: Carlos Martínez (Padre) · Tel. +1 (809) 555-0199</p>
            <p className="text-gray-400">Alergias: Ninguna reportada. Apta para esfuerzo físico intenso en tatami.</p>
          </div>
        )}
      </div>

      {/* Componente Reutilizable 10: AssignRankDialog */}
      <AssignRankDialog
        student={activeStudent}
        isOpen={isAssignRankOpen}
        onClose={() => setIsAssignRankOpen(false)}
        ranks={ranks}
        onConfirmPromotion={handleConfirmPromotion}
      />
    </div>
  );
}
