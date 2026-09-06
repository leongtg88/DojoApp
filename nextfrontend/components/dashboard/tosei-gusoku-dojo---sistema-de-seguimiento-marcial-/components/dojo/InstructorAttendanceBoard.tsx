'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useDojo } from '@/context/DojoContext';
import { AttendanceRecord } from '@/types';
import {
  CheckCheck,
  CheckCircle2,
  Clock,
  Filter,
  Calendar,
  XCircle,
  Hourglass,
  Users,
  Flame,
  Award,
  ChevronDown,
  Pencil,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

export function InstructorAttendanceBoard() {
  const {
    attendances,
    confirmAttendance,
    confirmAllPendingAttendances,
    rejectAttendance,
    deleteAttendance,
    updateAttendance,
    activeInstructor,
    students,
  } = useDojo();

  const [dateFilter, setDateFilter] = useState<string>('TODAS'); // 'TODAS' | 'HOY' | specific date
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'CONFIRMADA'>('ALL');
  const [rejectModalRecordId, setRejectModalRecordId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Edit attendance state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editHours, setEditHours] = useState<number>(1.5);
  const [editSessionType, setEditSessionType] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA'>('PENDIENTE');

  const todayStr = new Date().toISOString().split('T')[0];

  // Unique dates in attendance list
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(attendances.map((a) => a.date))).sort().reverse();
    return dates;
  }, [attendances]);

  // Filtered attendances
  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      // Date filter
      if (dateFilter === 'HOY' && att.date !== todayStr) return false;
      if (dateFilter !== 'TODAS' && dateFilter !== 'HOY' && att.date !== dateFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && att.status !== statusFilter) return false;

      return true;
    });
  }, [attendances, dateFilter, statusFilter, todayStr]);

  // Pending counts
  const totalPending = attendances.filter((a) => a.status === 'PENDIENTE').length;
  const pendingForCurrentFilter = filteredAttendances.filter((a) => a.status === 'PENDIENTE').length;

  // Stats
  const totalHoursTrained = attendances
    .filter((a) => a.status === 'CONFIRMADA')
    .reduce((acc, curr) => acc + curr.hoursTrained, 0);

  const handleConfirmAll = () => {
    const filterArg = dateFilter === 'HOY' ? todayStr : dateFilter !== 'TODAS' ? dateFilter : undefined;
    confirmAllPendingAttendances(filterArg);
  };

  const handleConfirmSingle = (id: string) => {
    confirmAttendance(id, activeInstructor.id, activeInstructor.name);
  };

  const handleOpenReject = (id: string) => {
    setRejectModalRecordId(id);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalRecordId) return;
    rejectAttendance(rejectModalRecordId, rejectReason.trim());
    setRejectModalRecordId(null);
  };

  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditHours(record.hoursTrained);
    setEditSessionType(record.sessionType);
    setEditNotes(record.notes || '');
    setEditStatus(record.status);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    updateAttendance(editingRecord.id, {
      date: editDate,
      hoursTrained: editHours,
      sessionType: editSessionType,
      notes: editNotes.trim(),
      status: editStatus,
    });
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Por Validar</span>
            <Hourglass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300">{totalPending}</span>
            <span className="text-xs text-gray-400">alumnos puncharon</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Esperando firma del Sensei</p>
        </div>

        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Confirmadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {attendances.filter((a) => a.status === 'CONFIRMADA').length}
            </span>
            <span className="text-xs text-gray-400">sesiones</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Histórico del dojo</p>
        </div>

        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Horas de Tatami</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalHoursTrained.toFixed(1)}h</span>
            <span className="text-xs text-gray-400">acumuladas</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Kihon, Katas y Kumite</p>
        </div>

        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Instructor a Cargo</span>
            <Award className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white truncate">{activeInstructor.name}</p>
          <p className="text-xs text-gray-400">{activeInstructor.title} • {activeInstructor.dan}</p>
        </div>
      </div>

      {/* Control Bar: Filtros y Botón de Confirmación Masiva */}
      <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro de Fecha */}
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-400">Fecha:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-[#161b22]">Todas las fechas</option>
              <option value="HOY" className="bg-[#161b22]">Hoy ({todayStr})</option>
              {availableDates.map((d) => (
                <option key={d} value={d} className="bg-[#161b22]">{d}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center gap-1 bg-[#0d1117] border border-neutral-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'ALL' ? 'bg-neutral-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas ({filteredAttendances.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDIENTE')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                statusFilter === 'PENDIENTE'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-gray-400 hover:text-amber-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Pendientes ({totalPending})
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMADA')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'CONFIRMADA'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-gray-400 hover:text-emerald-300'
              }`}
            >
              Confirmadas
            </button>
          </div>
        </div>

        {/* Botón Principal: Confirmar Todas las Asistencias del Día */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleConfirmAll}
            disabled={totalPending === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${
              totalPending > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 active:scale-95'
                : 'bg-neutral-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>
              {totalPending > 0
                ? `Confirmar Todas las Asistencias (${pendingForCurrentFilter})`
                : 'No hay Asistencias Pendientes'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabla / Lista de Registros */}
      <div className="bg-[#161b22] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-bold text-white">Registro de Asistencia del Tatami</h4>
          </div>
          <span className="text-xs text-gray-400">{filteredAttendances.length} registros listados</span>
        </div>

        {filteredAttendances.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No se encontraron registros con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredAttendances.map((att) => {
              const isConfirmed = att.status === 'CONFIRMADA';
              const isPending = att.status === 'PENDIENTE';
              const studentObj = students.find((s) => s.id === att.studentId);

              return (
                <div
                  key={att.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isPending ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]' : 'hover:bg-neutral-800/30'
                  }`}
                >
                  {/* Info Alumno y Sesión */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border border-neutral-700 shrink-0">
                      <Image
                        src={att.studentAvatar}
                        alt={att.studentName}
                        fill
                        sizes="44px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{att.studentName}</span>
                        <span className="text-xs font-mono text-gray-400 bg-neutral-800/80 px-1.5 py-0.2 rounded">
                          {att.studentMatricula}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                            isConfirmed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {isConfirmed && <CheckCircle2 className="w-3 h-3" />}
                          {isPending && <Hourglass className="w-3 h-3 animate-spin" />}
                          <span>{att.status}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className="font-mono text-gray-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          {att.date}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {att.hoursTrained} horas entrenadas
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">{att.sessionType}</span>
                      </div>

                      {att.notes && (
                        <p className="text-xs text-gray-400 mt-1 bg-neutral-900/60 px-2 py-1 rounded border border-neutral-800">
                          {att.notes}
                        </p>
                      )}

                      {isConfirmed && att.confirmedBySenseiName && (
                        <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmado por {att.confirmedBySenseiName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones para el Sensei */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap justify-end">
                    {/* Botón Editar lo registrado por el alumno */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(att)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold transition-all hover:border-cyan-400 cursor-pointer shadow-xs active:scale-95"
                      title="Editar y rectificar lo registrado por el alumno (fecha, horas, tipo, notas)"
                    >
                      <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Editar</span>
                    </button>

                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirmSingle(att.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Aprobar asistencia y sumar al historial del alumno"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReject(att.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-gray-400 hover:text-red-400 text-xs transition-colors cursor-pointer"
                          title="Rechazar u observar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Observar</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono hidden sm:inline">ID: {att.id.slice(0, 8)}</span>
                        <button
                          type="button"
                          onClick={() => deleteAttendance(att.id)}
                          className="text-gray-500 hover:text-red-400 text-xs p-1.5 rounded hover:bg-neutral-800 cursor-pointer"
                          title="Remover del historial"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edición de Asistencia (Instructor / Admin) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] border border-neutral-700 rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-700">
                  <Image
                    src={editingRecord.studentAvatar}
                    alt={editingRecord.studentName}
                    fill
                    sizes="40px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Rectificar Asistencia de Alumno</span>
                  </h3>
                  <p className="text-xs text-cyan-400 font-medium">
                    {editingRecord.studentName} • {editingRecord.studentMatricula}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Corrige los datos ingresados por el alumno en caso de error en la fecha, cantidad de horas o tipo de sesión.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Fecha de la sesión */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Fecha de la Clase / Sesión
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Horas entrenadas */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Horas de Tatami Entrenadas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={editHours}
                    onChange={(e) => setEditHours(parseFloat(e.target.value) || 0.5)}
                    className="w-28 bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1.0, 1.5, 2.0, 2.5, 3.0].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setEditHours(h)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                          editHours === h
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'border-neutral-700 text-gray-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tipo de Práctica */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Tipo de Práctica / Especialidad
                </label>
                <select
                  value={editSessionType}
                  onChange={(e) => setEditSessionType(e.target.value)}
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Kihon & Katas">Kihon & Katas</option>
                  <option value="Bunkai & Kumite">Bunkai & Kumite</option>
                  <option value="Acondicionamiento Físico">Acondicionamiento Físico</option>
                  <option value="Perfeccionamiento Shito-Ryu">Perfeccionamiento Shito-Ryu</option>
                  <option value="Clase Especial / Seminario">Clase Especial / Seminario</option>
                  <option value="Entrenamiento Libre">Entrenamiento Libre</option>
                </select>
              </div>

              {/* Estado de la Asistencia */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Estado Oficial en el Dojo
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="PENDIENTE">PENDIENTE (Aún en revisión)</option>
                  <option value="CONFIRMADA">CONFIRMADA (Aprobada y computable para examen)</option>
                  <option value="RECHAZADA">RECHAZADA (Con observación)</option>
                </select>
              </div>

              {/* Notas u Observaciones */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Notas u Observaciones del Sensei / Alumno
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: Corregido horario por Sensei - alumno entrenó 1.5 horas en el segundo turno..."
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Se recalcularán las estadísticas del alumno al guardar.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Corrección</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Observación / Rechazo */}
      {rejectModalRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Observar Asistencia del Alumno</span>
            </h3>
            <p className="text-xs text-gray-400">
              Indica la razón por la cual no se convalida esta sesión (ej. horario no coincidió, retiro temprano, etc.).
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Escribe la observación del Sensei..."
              rows={3}
              className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalRecordId(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
              >
                Guardar Observación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
