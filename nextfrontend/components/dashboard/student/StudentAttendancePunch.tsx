'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Hourglass,
  Pencil,
  Plus,
  Repeat,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import type { AttendanceRecord, GradoProgressData, PracticePlace, StudentAttendancePunchData } from '@/types/dashboard'

interface StudentAttendancePunchProps {
  data: StudentAttendancePunchData
  grado?: GradoProgressData | null
}

const SESSION_OPTIONS = [
  { value: 'class', label: 'Clase regular' },
  { value: 'private', label: 'Clase privada' },
  { value: 'autonomous', label: 'Entrenamiento libre' },
  { value: 'seminar', label: 'Seminario / Especial' },
  { value: 'other', label: 'Otro' },
]

const STATUS_LABELS: Record<'CONFIRMED' | 'PENDING' | 'REJECTED' | 'JUSTIFIED', string> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Esperando al Sensei',
  REJECTED: 'Rechazada',
  JUSTIFIED: 'Justificada',
}

function sessionLabel(sessionType: string | null): string {
  return SESSION_OPTIONS.find(({ value }) => value === sessionType)?.label ?? sessionType ?? 'Clase'
}

export function StudentAttendancePunch({ data, grado = null }: StudentAttendancePunchProps) {
  const router = useRouter()
  const { summary, records } = data
  const currentPeriod = grado?.currentPeriod ?? null
  const classSessions = currentPeriod?.classSessions ?? summary.confirmedCount
  const capacitySessions = currentPeriod?.capacitySessions ?? summary.confirmedCount
  const totalAbsences = currentPeriod?.totalAbsences ?? 0
  const classPercent = capacitySessions > 0 ? Math.min(100, Math.round((classSessions / capacitySessions) * 100)) : 0

  const [hours, setHours] = useState<number>(1.5)
  const [sessionType, setSessionType] = useState<string>('class')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [practiceLines, setPracticeLines] = useState<Array<{ techniqueId: string; repetitions: string; place: PracticePlace }>>([])

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editHours, setEditHours] = useState<number>(1.5)
  const [editSessionType, setEditSessionType] = useState<string>('class')
  const [editNotes, setEditNotes] = useState<string>('')

  const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const quickHours = [1.0, 1.5, 2.0, 2.5]

  const visiblePracticeLines = practiceLines
    .map((line) => ({
      techniqueId: line.techniqueId,
      repetitions: Number.parseInt(line.repetitions, 10),
      place: line.place,
    }))
    .filter((line) => line.techniqueId && Number.isFinite(line.repetitions) && line.repetitions > 0)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (hours <= 0 || isSubmitting) return

    setIsSubmitting(true)
    const response = await fetch('/api/dashboard/student/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hoursTrained: hours,
        sessionType,
        notes: notes.trim(),
        ...(visiblePracticeLines.length > 0 ? { practiceLogs: visiblePracticeLines } : {}),
      }),
    })
    setIsSubmitting(false)

    if (response.ok) {
      setNotes('')
      setPracticeLines([])
      router.refresh()
    } else {
      const { error } = await response.json().catch(() => ({ error: 'Error al registrar tu práctica' }))
      alert(error ?? 'Error al registrar tu práctica')
    }
  }

  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setEditHours(record.hoursTrained)
    setEditSessionType(record.sessionType ?? 'class')
    setEditNotes(record.notes ?? '')
  }

  const handleSaveEdit = async () => {
    if (!editingRecord || isSubmitting) return

    setIsSubmitting(true)
    const response = await fetch(`/api/dashboard/student/attendance/${editingRecord.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursTrained: editHours, sessionType: editSessionType, notes: editNotes.trim() }),
    })
    setIsSubmitting(false)

    if (response.ok) {
      setEditingRecord(null)
      router.refresh()
    } else {
      const { error } = await response.json().catch(() => ({ error: 'Error al corregir tu práctica' }))
      alert(error ?? 'Error al corregir tu práctica')
    }
  }

  const handleDelete = async (record: AttendanceRecord) => {
    if (!window.confirm('¿Eliminar este registro pendiente?')) return

    const response = await fetch(`/api/dashboard/student/attendance/${record.id}`, { method: 'DELETE' })
    if (response.ok) {
      router.refresh()
    } else {
      const { error } = await response.json().catch(() => ({ error: 'Error al eliminar el registro' }))
      alert(error ?? 'Error al eliminar el registro')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-3.5">
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span className="text-xs">Asistencias válidas</span>
            <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-white">{classSessions}</span>
            <span className="text-xs text-neutral-400">de {capacitySessions} esperadas</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${classPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-3.5">
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span className="text-xs">Por Confirmar</span>
            <Hourglass className="size-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-amber-300">{summary.pendingCount}</span>
            <span className="text-xs text-neutral-400">en revisión Sensei</span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">Marcadas por ti</p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-3.5">
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span className="text-xs">Horas en Tatami</span>
            <Flame className="size-4 text-orange-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-white">{summary.totalHours}</span>
            <span className="text-xs text-neutral-400">horas certif.</span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">Dojo Tosei-Gusoku</p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-3.5">
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span className="text-xs">Inasistencia</span>
            <ShieldCheck className="size-4 text-blue-400" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-white">{totalAbsences}</span>
            <span className="text-xs text-neutral-400">máx 2/mes</span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">Del cuatrimestre en curso</p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-2 border-b border-neutral-800 pb-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <Clock className="size-5 text-red-500" aria-hidden="true" />
              <span>Marcar Asistencia (Punch In)</span>
            </h3>
            <p className="mt-0.5 text-xs text-neutral-400">
              Registra tus horas entrenadas. Tu Sensei confirmará la asistencia al finalizar el tatami.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 font-mono text-xs text-neutral-300">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span>Tatami Activo</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300" htmlFor="punch-hours">
                Horas Entrenadas
              </label>
              <div className="flex items-center gap-2">
                <input
                  className="w-24 rounded-lg border border-neutral-700 bg-[#0d1117] px-3 py-2 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                  id="punch-hours"
                  max="8"
                  min="0.5"
                  onChange={(event) => setHours(parseFloat(event.target.value) || 0)}
                  step="0.5"
                  type="number"
                  value={hours}
                />
                <div className="flex flex-1 items-center gap-1">
                  {quickHours.map((quickHour) => (
                    <button
                      className={`rounded px-2 py-1.5 font-mono text-xs transition-colors ${hours === quickHour
                        ? 'bg-red-600 font-bold text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                      key={quickHour}
                      onClick={() => setHours(quickHour)}
                      type="button"
                    >
                      {quickHour}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300" htmlFor="punch-session">
                Contenido / Sesión
              </label>
              <select
                className="w-full rounded-lg border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                id="punch-session"
                onChange={(event) => setSessionType(event.target.value)}
                value={sessionType}
              >
                {SESSION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300" htmlFor="punch-notes">
                Notas / Observaciones
              </label>
              <input
                className="w-full rounded-lg border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-red-500 focus:outline-none"
                id="punch-notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ej: Práctica de Heian Sandan, corrección de postura"
                type="text"
                value={notes}
              />
            </div>
          </div>

          {data.availableTechniques.length > 0 && (
            <div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300">
                  <Repeat className="size-4 text-cyan-400" aria-hidden="true" />Repeticiones de técnicas
                </p>
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20"
                  onClick={() => setPracticeLines((current) => [...current, { techniqueId: '', repetitions: '', place: 'DOJO' }])}
                  type="button"
                >
                  <Plus className="size-3.5" aria-hidden="true" />Añadir
                </button>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">Opcional. Registra cuántas repeticiones hiciste por técnica, en el dojo o fuera. No afecta tu examen de grado. ¿Falta una técnica? Pídele a tu sensei que la asigne a tu expediente.</p>
              {practiceLines.length > 0 && (
                <div className="mt-3 space-y-2">
                  {practiceLines.map((line, index) => (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center" key={index}>
                      <select
                        className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-[#161b22] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                        onChange={(event) => setPracticeLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, techniqueId: event.target.value } : item)))}
                        value={line.techniqueId}
                      >
                        <option value="">Selecciona técnica</option>
                        {data.availableTechniques.map((technique) => (
                          <option key={technique.id} value={technique.id}>{technique.category}: {technique.name}</option>
                        ))}
                      </select>
                      <input
                        className="w-24 rounded-md border border-neutral-700 bg-[#161b22] px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500"
                        min={1}
                        onChange={(event) => setPracticeLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, repetitions: event.target.value } : item)))}
                        placeholder="Reps"
                        type="number"
                        value={line.repetitions}
                      />
                      <select
                        className="rounded-md border border-neutral-700 bg-[#161b22] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                        onChange={(event) => setPracticeLines((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, place: event.target.value as PracticePlace } : item)))}
                        value={line.place}
                      >
                        <option value="DOJO">En el dojo</option>
                        <option value="FUERA">Fuera del dojo</option>
                      </select>
                      <button
                        aria-label="Quitar repeticiones"
                        className="self-start rounded border border-neutral-800 p-2 text-neutral-500 transition-colors hover:border-red-500/40 hover:text-red-400 sm:self-center"
                        onClick={() => setPracticeLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        type="button"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-neutral-400">
              Estado: <strong className="text-neutral-300">{summary.pendingCount > 0 ? 'Tienes práctica(s) sin confirmar' : 'Al día'}</strong>
            </span>
            <button
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-950/40 transition-all hover:bg-red-500 disabled:opacity-50"
              disabled={isSubmitting || hours <= 0}
              type="submit"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Punch Asistencia ({hours}h)</span>
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#161b22]">
        <div className="flex items-center justify-between border-b border-neutral-800 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-neutral-400" aria-hidden="true" />
            <h4 className="text-sm font-bold text-white">Tu Historial de Asistencias</h4>
          </div>
          <span className="text-xs text-neutral-400">{records.length} registros en total</span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">
            No tienes asistencias registradas aún. ¡Marca tu primera práctica con el formulario superior!
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {records.map((record) => {
              const isConfirmed = record.status === 'CONFIRMED'
              const isPending = record.status === 'PENDING'
              const isJustified = record.status === 'JUSTIFIED'
              const isRejected = record.status === 'REJECTED'

              return (
                <div className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-neutral-800/30 sm:flex-row sm:items-center" key={record.id}>
                  <div className="flex items-start gap-3 sm:items-center">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${isConfirmed
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : isPending
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        : isJustified
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                          : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                      {isConfirmed ? (
                        <CheckCircle2 className="size-5" aria-hidden="true" />
                      ) : isPending ? (
                        <Hourglass className="size-5 animate-pulse" aria-hidden="true" />
                      ) : isJustified ? (
                        <ShieldCheck className="size-5" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="size-5" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{formatter.format(new Date(record.date))}</span>
                        <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-xs text-neutral-300">{record.hoursTrained}h</span>
                        <span className="text-xs font-medium text-neutral-300">{sessionLabel(record.sessionType)}</span>
                      </div>
                      {record.notes && <p className="mt-1 text-xs italic text-neutral-400">&ldquo;{record.notes}&rdquo;</p>}
                      {isConfirmed && record.confirmedByName && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-400/90">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          <span>Validado por {record.confirmedByName}</span>
                        </p>
                      )}
                      {isJustified && (
                        <p className="mt-0.5 text-[11px] text-sky-400/90">
                          Falta justificada. Recupérala entrenando fuera de tu horario habitual.
                        </p>
                      )}
                      {isRejected && (
                        <p className="mt-0.5 text-[11px] text-red-400/90">
                          No fue validado por el Sensei. Registra tu práctica de nuevo.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-center">
                    {record.isOutOfSchedule && (
                      <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                        <Clock className="size-3.5" aria-hidden="true" />
                        Fuera de horario
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${isConfirmed
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                      : isPending
                        ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                        : isJustified
                          ? 'border-sky-500/30 bg-sky-500/20 text-sky-300'
                          : 'border-red-500/30 bg-red-500/20 text-red-300'
                    }`}>
                      {isConfirmed && <CheckCircle2 className="size-3.5" aria-hidden="true" />}
                      {isPending && <Hourglass className="size-3.5" aria-hidden="true" />}
                      {isJustified && <ShieldCheck className="size-3.5" aria-hidden="true" />}
                      {isRejected && <AlertCircle className="size-3.5" aria-hidden="true" />}
                      <span>{STATUS_LABELS[record.status]}</span>
                    </span>

                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs font-medium text-cyan-400 transition-colors hover:bg-neutral-700 hover:text-cyan-300"
                          onClick={() => handleOpenEdit(record)}
                          title="Corregir si te equivocaste de horas o notas"
                          type="button"
                        >
                          <Pencil className="size-3" aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        <button
                          className="rounded border border-neutral-800 p-1 text-neutral-500 transition-colors hover:border-red-500/40 hover:text-red-400"
                          onClick={() => handleDelete(record)}
                          title="Eliminar registro"
                          type="button"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-neutral-700 bg-[#161b22] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Pencil className="size-4 text-cyan-400" aria-hidden="true" />
                <span>Corregir mi Asistencia Marcada</span>
              </h3>
              <button
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                onClick={() => setEditingRecord(null)}
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Modifica las horas, contenido o comentarios si cometiste un error al registrarla.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-neutral-400">Horas entrenadas</label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-24 rounded-lg border border-neutral-700 bg-[#0d1117] p-2.5 font-mono font-bold text-white focus:border-cyan-500 focus:outline-none"
                    max="8"
                    min="0.5"
                    onChange={(event) => setEditHours(parseFloat(event.target.value) || 0.5)}
                    step="0.5"
                    type="number"
                    value={editHours}
                  />
                  <div className="flex items-center gap-1">
                    {quickHours.map((quickHour) => (
                      <button
                        className={`rounded border px-2 py-1 text-xs font-mono font-semibold ${editHours === quickHour
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                        key={quickHour}
                        onClick={() => setEditHours(quickHour)}
                        type="button"
                      >
                        {quickHour}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-neutral-400">Tipo de Práctica</label>
                <select
                  className="w-full cursor-pointer rounded-lg border border-neutral-700 bg-[#0d1117] p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  onChange={(event) => setEditSessionType(event.target.value)}
                  value={editSessionType}
                >
                  {SESSION_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-neutral-400">Notas u Observación</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-700 bg-[#0d1117] p-2.5 text-white placeholder:text-neutral-500 focus:border-cyan-500 focus:outline-none"
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="Observación o detalle para el Sensei..."
                  rows={2}
                  value={editNotes}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-800 pt-2">
              <button
                className="rounded-lg border border-neutral-700 px-3.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
                onClick={() => setEditingRecord(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-cyan-500"
                onClick={handleSaveEdit}
                type="button"
              >
                <Save className="size-3.5" aria-hidden="true" />
                <span>Guardar Corrección</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}