'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { AttendanceRecord } from '@/types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Plus,
  Hourglass,
  ShieldCheck,
  Flame,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';

export function StudentAttendancePunch() {
  const { activeStudent, attendances, punchAttendance, updateAttendance, deleteAttendance } = useDojo();

  // Reference date default: today (current date in YYYY-MM-DD format)
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [hours, setHours] = useState<number>(1.5);
  const [sessionType, setSessionType] = useState<string>('Kihon & Katas');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit pending attendance state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editHours, setEditHours] = useState<number>(1.5);
  const [editSessionType, setEditSessionType] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Filter student attendances
  const myAttendances = attendances.filter((a) => a.studentId === activeStudent.id);
  const confirmedCount = myAttendances.filter((a) => a.status === 'CONFIRMADA').length;
  const pendingCount = myAttendances.filter((a) => a.status === 'PENDIENTE').length;
  const totalHours = myAttendances
    .filter((a) => a.status === 'CONFIRMADA')
    .reduce((acc, curr) => acc + curr.hoursTrained, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hours <= 0) return;

    setIsSubmitting(true);
    punchAttendance({
      studentId: activeStudent.id,
      date: selectedDate,
      hoursTrained: hours,
      sessionType,
      notes: notes.trim(),
    });
    setNotes('');
    setIsSubmitting(false);
  };

  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditHours(record.hoursTrained);
    setEditSessionType(record.sessionType);
    setEditNotes(record.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    updateAttendance(editingRecord.id, {
      date: editDate,
      hoursTrained: editHours,
      sessionType: editSessionType,
      notes: editNotes.trim(),
    });
    setEditingRecord(null);
  };

  const quickHours = [1.0, 1.5, 2.0, 2.5];

  return (
    <div className="space-y-6">
      {/* Resumen de Asistencias del Alumno */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs">Clases Confirmadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">{confirmedCount}</span>
            <span className="text-xs text-gray-400">/ {activeStudent.targetAttendances || 30} mín.</span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((confirmedCount / (activeStudent.targetAttendances || 30)) * 100))}%` }}
            />
          </div>
        </div>

        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs">Por Confirmar</span>
            <Hourglass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-300">{pendingCount}</span>
            <span className="text-xs text-gray-400">en revisión Sensei</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Marcadas por ti</p>
        </div>

        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs">Horas en Tatami</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">{totalHours.toFixed(1)}</span>
            <span className="text-xs text-gray-400">horas certif.</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Dojo Tosei-Gusoku</p>
        </div>

        <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs">Cumplimiento</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">
              {Math.min(100, Math.round((confirmedCount / (activeStudent.targetAttendances || 30)) * 100))}%
            </span>
            <span className="text-xs text-gray-400">
              {confirmedCount >= (activeStudent.targetAttendances || 30) * 0.8 ? 'Apto' : 'En curso'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">80% mín. p/ examen</p>
        </div>
      </div>

      {/* Formulario de Marcaje (Punch In) */}
      <div className="bg-[#161b22] border border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span>Marcar Asistencia (Punch In)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Registra tu día y horas entrenadas. Tu Sensei confirmará la asistencia al finalizar el tatami.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-mono text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tatami Activo</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label htmlFor="punch-date" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Fecha de Entrenamiento
              </label>
              <div className="relative">
                <input
                  id="punch-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={todayStr}
                  required
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Horas */}
            <div>
              <label htmlFor="punch-hours" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Horas Entrenadas
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="punch-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="8"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  required
                  className="w-24 bg-[#0d1117] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                />
                <div className="flex items-center gap-1 flex-1">
                  {quickHours.map((qh) => (
                    <button
                      key={qh}
                      type="button"
                      onClick={() => setHours(qh)}
                      className={`px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                        hours === qh
                          ? 'bg-red-600 text-white font-bold'
                          : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                      }`}
                    >
                      {qh}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tipo de Sesión */}
            <div>
              <label htmlFor="punch-session" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Contenido / Sesión
              </label>
              <select
                id="punch-session"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="Kihon & Katas">Kihon & Katas</option>
                <option value="Bunkai & Kumite">Bunkai & Kumite</option>
                <option value="Perfeccionamiento de Grado">Perfeccionamiento de Grado</option>
                <option value="Preparación para Examen">Preparación para Examen</option>
                <option value="Entrenamiento Libre">Entrenamiento Libre</option>
              </select>
            </div>
          </div>

          {/* Notas opcionales */}
          <div>
            <label htmlFor="punch-notes" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Notas / Observaciones personales (opcional)
            </label>
            <input
              id="punch-notes"
              type="text"
              placeholder="Ej: Práctica de Heian Sandan, corrección de postura zenkutsu dachi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Botón de Enviar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">
              Sensei asignado: <strong className="text-gray-300">{activeStudent.assignedSenseiName}</strong>
            </span>
            <button
              type="submit"
              disabled={isSubmitting || hours <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-md shadow-red-950/40 active:scale-98 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Punch Asistencia ({hours}h)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Asistencias del Estudiante */}
      <div className="bg-[#161b22] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-bold text-white">Tu Historial de Asistencias</h4>
          </div>
          <span className="text-xs text-gray-400">{myAttendances.length} registros en total</span>
        </div>

        {myAttendances.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No tienes asistencias registradas aún. ¡Marca tu primera práctica con el formulario superior!
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {myAttendances.map((att) => {
              const isConfirmed = att.status === 'CONFIRMADA';
              const isPending = att.status === 'PENDIENTE';
              return (
                <div key={att.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isConfirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isConfirmed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isPending ? (
                        <Hourglass className="w-5 h-5 animate-pulse" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white font-mono">{att.date}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 font-mono text-gray-300">
                          {att.hoursTrained}h
                        </span>
                        <span className="text-xs text-gray-300 font-medium">
                          {att.sessionType}
                        </span>
                      </div>
                      {att.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{att.notes}&rdquo;</p>
                      )}
                      {isConfirmed && att.confirmedBySenseiName && (
                        <p className="text-[11px] text-emerald-400/90 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Validado por {att.confirmedBySenseiName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-end flex-wrap justify-end">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isPending && <Hourglass className="w-3.5 h-3.5" />}
                      <span>{isConfirmed ? 'Confirmada' : isPending ? 'Esperando al Sensei' : 'Rechazada'}</span>
                    </span>

                    {/* Si está pendiente, el alumno puede editar su registro si se equivocó */}
                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(att)}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
                          title="Corregir si te equivocaste de fecha u horas"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAttendance(att.id)}
                          className="p-1 rounded border border-neutral-800 hover:border-red-500/40 text-gray-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal de corrección para el alumno */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] border border-neutral-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-400" />
                <span>Corregir mi Asistencia Marcada</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Modifica la fecha, horas o comentarios si cometiste un error al registrarla.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Horas entrenadas</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    value={editHours}
                    onChange={(e) => setEditHours(parseFloat(e.target.value) || 0.5)}
                    className="w-24 bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex items-center gap-1">
                    {[1.0, 1.5, 2.0, 2.5].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setEditHours(h)}
                        className={`px-2 py-1 rounded border text-xs font-mono font-semibold cursor-pointer ${
                          editHours === h
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'border-neutral-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Tipo de Práctica</label>
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
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Notas u Observación</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Observación o detalle para el Sensei..."
                  className="w-full bg-[#0d1117] border border-neutral-700 rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs text-gray-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Corrección</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
