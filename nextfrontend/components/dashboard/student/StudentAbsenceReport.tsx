'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarX2, CheckCircle2, Clock, Hourglass, Trash2, XCircle } from 'lucide-react'
import type { ClassSchedule, StudentAbsenceJustification } from '@/types/dashboard'
import { WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'

interface StudentAbsenceReportProps {
  schedule: ClassSchedule[]
  justifications: StudentAbsenceJustification[]
  studentId?: string
}

const STATUS_META: Record<StudentAbsenceJustification['status'], { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'border-amber-500/30 bg-amber-500/10 text-warn-text' },
  APPROVED: { label: 'Justificada', className: 'border-sky-500/30 bg-sky-500/10 text-info-text' },
  REJECTED: { label: 'Rechazada', className: 'border-rose-500/30 bg-rose-500/10 text-danger-text' },
}

const pad = (value: number) => String(value).padStart(2, '0')

export function StudentAbsenceReport({ schedule, justifications, studentId }: StudentAbsenceReportProps) {
  const router = useRouter()
  const studentHeader: Record<string, string> = studentId ? { 'X-Student-Id': studentId } : {}

  const localNow = new Date()
  const todayValue = `${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())}`
  const minDateValue = (() => {
    const min = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 30)
    return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}`
  })()

  const [classId, setClassId] = useState(schedule[0]?.id ?? '')
  const [date, setDate] = useState(todayValue)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return
    if (!classId) {
      setError('Selecciona el horario al que faltaste.')
      return
    }
    if (reason.trim().length < 5) {
      setError('Escribe el motivo de tu falta (mínimo 5 caracteres).')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const response = await fetch('/api/dashboard/student/absence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...studentHeader },
      body: JSON.stringify({ classId, date, reason: reason.trim() }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'No fue posible registrar tu falta.')
      return
    }

    setReason('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
    router.refresh()
  }

  async function handleDelete(justificationId: string) {
    if (!window.confirm('¿Quieres retirar este reporte?')) return

    setBusyId(justificationId)
    const response = await fetch(`/api/dashboard/student/absence?id=${justificationId}`, {
      method: 'DELETE',
      headers: studentHeader,
    })
    setBusyId(null)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'No fue posible retirar el reporte.')
      return
    }

    router.refresh()
  }

  return (
    <section className="rounded-xl border border-edge bg-surface-2 p-5 shadow-sm">
      <div className="mb-4 border-b border-edge pb-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink">
          <CalendarX2 className="size-5 text-danger-text" aria-hidden="true" />
          <span>Reportar una falta</span>
        </h3>
        <p className="mt-0.5 text-xs text-ink-3">Si no pudiste asistir a una clase, registra el motivo. Tu instructor o la administración lo revisará.</p>
      </div>

      {schedule.length === 0 ? (
        <p className="rounded-md border border-dashed border-edge-strong px-3 py-4 text-center text-xs text-ink-4">No tienes horarios asignados. Contacta a la administración de tu dojo.</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="absence-class">
                Horario
              </label>
              <select
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                id="absence-class"
                onChange={(event) => setClassId(event.target.value)}
                value={classId}
              >
                {schedule.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · {WEEKDAY_LONG[entry.dayOfWeek]} {entry.startTime}-{entry.endTime}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="absence-date">
                Fecha en que faltaste
              </label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                id="absence-date"
                max={todayValue}
                min={minDateValue}
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="absence-reason">
              Motivo
            </label>
            <textarea
              className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none"
              id="absence-reason"
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej: enfermedad, viaje familiar, examen escolar..."
              rows={3}
              value={reason}
            />
          </div>

          {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-danger-text">{error}</p>}
          {success && (
            <p className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-ok-text">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />Motivo enviado. Queda pendiente de revisión.
            </p>
          )}

          <div className="flex justify-end">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-500 disabled:opacity-50 sm:w-auto"
              disabled={isSubmitting}
              type="submit"
            >
              <CalendarX2 className="size-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Enviando...' : 'Reportar falta'}</span>
            </button>
          </div>
        </form>
      )}

      {justifications.length > 0 && (
        <div className="mt-5 border-t border-edge pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Mis reportes</p>
          <ul className="mt-3 space-y-2">
            {justifications.map((justification) => {
              const meta = STATUS_META[justification.status]
              return (
                <li className="flex flex-col justify-between gap-2 rounded-lg border border-edge bg-surface-1 px-3 py-3 sm:flex-row sm:items-start" key={justification.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{justification.className}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-ink-3"><Clock className="size-3.5" aria-hidden="true" />{justification.date}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-2">{justification.reason}</p>
                    {justification.status === 'APPROVED' && (
                        justification.recovered ? (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-ok-text">
                                <CheckCircle2 className="size-3" aria-hidden="true" />Repuesta el {justification.recoveryDate}
                            </p>
                        ) : (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-info-text">
                                <Clock className="size-3" aria-hidden="true" />Aprobada — pendiente de reponer (asiste a otra clase para recuperarla)
                            </p>
                        )
                    )}
                    {justification.status === 'REJECTED' && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-danger-text"><XCircle className="size-3" aria-hidden="true" />Rechazada — cuenta como falta.</p>
                    )}
                    {justification.status === 'PENDING' && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-warn-text"><Hourglass className="size-3" aria-hidden="true" />Pendiente de revisión.</p>
                    )}
                  </div>
                  {justification.status === 'PENDING' && (
                    <button
                      className="self-end rounded border border-edge p-1.5 text-ink-4 transition-colors hover:border-rose-500/40 hover:text-danger-text disabled:opacity-50 sm:self-center"
                      disabled={busyId === justification.id}
                      onClick={() => handleDelete(justification.id)}
                      title="Retirar reporte"
                      type="button"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
