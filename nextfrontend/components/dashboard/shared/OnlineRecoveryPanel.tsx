'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  DollarSign,
  ExternalLink,
  Loader2,
  Pencil,
  Video,
  XCircle,
} from 'lucide-react'
import { formatCalendarDate, formatDateTime, toSantoDomingoDateTimeLocal } from '@/lib/format/datetime'
import { santoDomingoDateTimeToIso } from '@/lib/dashboard/schedule-utils'
import { isHttpUrl } from '@/lib/validation/url'
import { useConfirm } from '@/components/dashboard/shared/useConfirm'
import type {
  OnlineRecoveryCandidate,
  OnlineRecoveryStatus,
  OnlineRecoverySummary,
} from '@/types/dashboard'

interface OnlineRecoveryPanelProps {
  mode: 'admin' | 'instructor'
  recoveries: OnlineRecoverySummary[]
  candidates: OnlineRecoveryCandidate[]
  instructors: { id: string; name: string }[]
  currentUserId: string
}

const STATUS_META: Record<OnlineRecoveryStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Programada', className: 'border-sky-500/30 bg-sky-500/10 text-info-text' },
  COMPLETED: { label: 'Completada', className: 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' },
  CANCELLED: { label: 'Cancelada', className: 'border-edge-strong bg-surface-1 text-ink-3' },
  NO_SHOW: { label: 'No asistió', className: 'border-rose-500/30 bg-rose-500/10 text-danger-text' },
}

const STATUS_TABS: { value: 'ALL' | OnlineRecoveryStatus; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'SCHEDULED', label: 'Programadas' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'NO_SHOW', label: 'No asistió' },
]

function defaultSchedule(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const value = toSantoDomingoDateTimeLocal(tomorrow)
  return `${value.slice(0, 10)}T18:00`
}

function defaultForm(mode: 'admin' | 'instructor', currentUserId: string) {
  return {
    scheduledAtLocal: defaultSchedule(),
    instructorId: mode === 'instructor' ? currentUserId : '',
    meetingUrl: '',
    notes: '',
  }
}

function formatCost(amount: number | null, currency: string): string {
  if (amount == null) return 'Costo pendiente de informar'
  return `Costo: ${new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(amount)} ${currency}`
}

export function OnlineRecoveryPanel({
  mode,
  recoveries,
  candidates,
  instructors,
  currentUserId,
}: OnlineRecoveryPanelProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | OnlineRecoveryStatus>('ALL')
  const [selectedCandidate, setSelectedCandidate] = useState<OnlineRecoveryCandidate | null>(null)
  const [editingRecovery, setEditingRecovery] = useState<OnlineRecoverySummary | null>(null)
  const [form, setForm] = useState(defaultForm(mode, currentUserId))
  const [costRecovery, setCostRecovery] = useState<OnlineRecoverySummary | null>(null)
  const [costAmount, setCostAmount] = useState('')
  const [costCurrency, setCostCurrency] = useState('DOP')
  const [costNote, setCostNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.studentName.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const filteredRecoveries = recoveries.filter(
    (recovery) => statusFilter === 'ALL' || recovery.status === statusFilter,
  )

  function resetForm() {
    setSelectedCandidate(null)
    setEditingRecovery(null)
    setForm(defaultForm(mode, currentUserId))
    setError(null)
  }

  function startCreate(candidate: OnlineRecoveryCandidate) {
    setSelectedCandidate(candidate)
    setEditingRecovery(null)
    setForm(defaultForm(mode, currentUserId))
    setError(null)
    setSuccess(null)
  }

  function startReschedule(recovery: OnlineRecoverySummary) {
    setEditingRecovery(recovery)
    setSelectedCandidate(null)
    setForm({
      scheduledAtLocal: toSantoDomingoDateTimeLocal(recovery.scheduledAt),
      instructorId: recovery.instructorId ?? (mode === 'instructor' ? currentUserId : ''),
      meetingUrl: recovery.meetingUrl ?? '',
      notes: recovery.notes ?? '',
    })
    setError(null)
    setSuccess(null)
  }

  function startCost(recovery: OnlineRecoverySummary) {
    setCostRecovery(recovery)
    setCostAmount(recovery.costAmount == null ? '' : String(recovery.costAmount))
    setCostCurrency(recovery.costCurrency)
    setCostNote(recovery.costNote ?? '')
    setError(null)
    setSuccess(null)
  }

  async function handleSchedule() {
    if (!selectedCandidate && !editingRecovery) return
    if (!form.scheduledAtLocal) {
      setError('Selecciona la fecha y hora de la clase.')
      return
    }

    let scheduledAt: string
    try {
      scheduledAt = santoDomingoDateTimeToIso(form.scheduledAtLocal)
    } catch {
      setError('La fecha y hora no son válidas.')
      return
    }

    setBusy('schedule')
    setError(null)
    setSuccess(null)

    const common = {
      scheduledAt,
      instructorId: form.instructorId || null,
      meetingUrl: form.meetingUrl.trim() || null,
      notes: form.notes.trim() || null,
    }

    const response = editingRecovery
      ? await fetch(`/api/dashboard/attendance/recovery/${editingRecovery.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reschedule', ...common }),
        })
      : await fetch('/api/dashboard/attendance/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ absenceId: selectedCandidate?.absenceId, ...common }),
        })

    const data = await response.json().catch(() => null)
    setBusy(null)

    if (!response.ok) {
      setError(data?.error ?? 'No fue posible guardar la clase online.')
      return
    }

    resetForm()
    setSuccess(editingRecovery ? 'Clase reprogramada.' : 'Clase online agendada.')
    router.refresh()
  }

  async function handleAction(recovery: OnlineRecoverySummary, action: 'complete' | 'cancel' | 'no-show') {
    if (action === 'cancel') {
      const confirmed = await confirm({
        title: '¿Cancelar esta clase online?',
        message: 'La falta seguirá pendiente de reponer.',
        confirmLabel: 'Cancelar clase',
        isDestructive: true,
      })
      if (!confirmed) return
    }
    if (action === 'no-show') {
      const confirmed = await confirm({
        title: '¿Marcar que el alumno no asistió?',
        message: 'La falta seguirá pendiente de reponer.',
        confirmLabel: 'Marcar no asistió',
        isDestructive: true,
      })
      if (!confirmed) return
    }

    setBusy(`${recovery.id}:${action}`)
    setError(null)
    setSuccess(null)

    const response = await fetch(`/api/dashboard/attendance/recovery/${recovery.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await response.json().catch(() => null)
    setBusy(null)

    if (!response.ok) {
      setError(data?.error ?? 'No fue posible actualizar la clase online.')
      return
    }

    setSuccess(
      action === 'complete'
        ? 'Clase completada. La falta fue repuesta.'
        : action === 'cancel'
          ? 'Clase cancelada.'
          : 'Clase marcada como no asistida.',
    )
    router.refresh()
  }

  async function handleCost() {
    if (!costRecovery) return
    const amount = Number(costAmount)

    if (!costAmount.trim() || Number.isNaN(amount) || amount < 0) {
      setError('Escribe un monto válido.')
      return
    }

    if (costCurrency.trim().length !== 3) {
      setError('La moneda debe tener 3 letras (por ejemplo DOP).')
      return
    }

    setBusy(`${costRecovery.id}:cost`)
    setError(null)
    setSuccess(null)

    const response = await fetch(`/api/dashboard/attendance/recovery/${costRecovery.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cost',
        costAmount: amount,
        costCurrency: costCurrency.trim().toUpperCase() || 'DOP',
        costNote: costNote.trim() || null,
      }),
    })
    const data = await response.json().catch(() => null)
    setBusy(null)

    if (!response.ok) {
      setError(data?.error ?? 'No fue posible informar el costo.')
      return
    }

    setCostRecovery(null)
    setSuccess('Costo informado al alumno.')
    router.refresh()
  }

  return (
    <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
      <div className="flex items-start gap-3 border-b border-edge pb-4">
        <Video aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Reposiciones</p>
          <h2 className="mt-1 font-display text-lg font-bold text-ink">Clases online de 35 min</h2>
          <p className="mt-1 text-xs text-ink-3">
            Agenda una reposición para una falta pendiente. Al completarla se registra la asistencia y la falta queda repuesta.
          </p>
        </div>
      </div>

      {error && <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-danger-text">{error}</p>}
      {success && <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-ok-text">{success}</p>}

      {(selectedCandidate || editingRecovery) && (
        <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">
              {editingRecovery ? 'Reprogramar clase online' : 'Agendar clase online'}
            </p>
            <button className="text-xs text-ink-3 hover:text-ink" onClick={resetForm} type="button">Cerrar</button>
          </div>

          <p className="mt-1 text-xs text-ink-3">
            {selectedCandidate
              ? `${selectedCandidate.studentName} · falta del ${formatCalendarDate(selectedCandidate.date)}`
              : `${editingRecovery?.studentName} · falta del ${formatCalendarDate(editingRecovery?.absenceDate ?? '')}`}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-when">
                Fecha y hora
              </label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                id="online-recovery-when"
                onChange={(event) => setForm((current) => ({ ...current, scheduledAtLocal: event.target.value }))}
                type="datetime-local"
                value={form.scheduledAtLocal}
              />
            </div>

            {mode === 'admin' ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-instructor">
                  Instructor
                </label>
                <select
                  className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                  id="online-recovery-instructor"
                  onChange={(event) => setForm((current) => ({ ...current, instructorId: event.target.value }))}
                  value={form.instructorId}
                >
                  <option value="">Sin asignar</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2">Instructor</span>
                <p className="rounded-lg border border-edge bg-surface-1 px-3 py-2 text-xs text-ink-2">Tú impartes la clase</p>
              </div>
            )}
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-link">
              Enlace de videollamada (opcional)
            </label>
            <input
              className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none"
              id="online-recovery-link"
              onChange={(event) => setForm((current) => ({ ...current, meetingUrl: event.target.value }))}
              placeholder="https://meet.google.com/..."
              type="url"
              value={form.meetingUrl}
            />
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-notes">
              Notas
            </label>
            <textarea
              className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none"
              id="online-recovery-notes"
              maxLength={500}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Temas a repasar, acuerdo con el alumno..."
              rows={2}
              value={form.notes}
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button className="rounded-lg border border-edge-strong px-3 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3" onClick={resetForm} type="button">
              Cancelar
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
              disabled={busy === 'schedule'}
              onClick={handleSchedule}
              type="button"
            >
              {busy === 'schedule' ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <CalendarPlus aria-hidden="true" className="size-4" />}
              {editingRecovery ? 'Guardar cambios' : 'Agendar clase'}
            </button>
          </div>
        </div>
      )}

      {costRecovery && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Informar costo · {costRecovery.studentName}</p>
            <button className="text-xs text-ink-3 hover:text-ink" onClick={() => setCostRecovery(null)} type="button">Cerrar</button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-cost">Monto</label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                id="online-recovery-cost"
                min="0"
                onChange={(event) => setCostAmount(event.target.value)}
                step="0.01"
                type="number"
                value={costAmount}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-currency">Moneda</label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs uppercase text-ink focus:border-cyan-500 focus:outline-none"
                id="online-recovery-currency"
                maxLength={3}
                onChange={(event) => setCostCurrency(event.target.value)}
                value={costCurrency}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="online-recovery-cost-note">Nota</label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                id="online-recovery-cost-note"
                maxLength={500}
                onChange={(event) => setCostNote(event.target.value)}
                placeholder="Opcional"
                value={costNote}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
              disabled={busy === `${costRecovery.id}:cost`}
              onClick={handleCost}
              type="button"
            >
              {busy === `${costRecovery.id}:cost` ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <DollarSign aria-hidden="true" className="size-4" />}
              Informar costo
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-edge pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Faltas por agendar</p>
            <p className="mt-1 text-[11px] text-ink-4">Faltas sin reponer que aún no tienen una clase online asociada.</p>
          </div>
          <input
            className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none sm:w-56"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar alumno..."
            type="search"
            value={search}
          />
        </div>

        {filteredCandidates.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-edge-strong px-3 py-4 text-center text-xs text-ink-4">
            No hay faltas pendientes para agendar.
          </p>
        ) : (
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredCandidates.map((candidate) => (
              <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-edge bg-surface-1 px-3 py-2" key={candidate.absenceId}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{candidate.studentName}</p>
                  <p className="mt-0.5 text-[11px] text-ink-4">
                    Falta del {formatCalendarDate(candidate.date)}{candidate.className ? ` · ${candidate.className}` : ''}
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-bold text-accent hover:bg-cyan-500/20"
                  onClick={() => startCreate(candidate)}
                  type="button"
                >
                  <CalendarPlus aria-hidden="true" className="size-3.5" />
                  Agendar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-edge pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Clases online</p>
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  statusFilter === tab.value ? 'bg-cyan-500/15 text-accent' : 'text-ink-3 hover:bg-surface-1'
                }`}
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRecoveries.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-edge-strong px-3 py-4 text-center text-xs text-ink-4">
            No hay clases online en este filtro.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {filteredRecoveries.map((recovery) => {
              const meta = STATUS_META[recovery.status]
              const actionBusy = busy?.startsWith(`${recovery.id}:`)
              const canComplete = mode === 'admin' || recovery.instructorId === currentUserId

              return (
                <li className="rounded-lg border border-edge bg-surface-1 px-3 py-3" key={recovery.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{recovery.studentName}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {formatDateTime(recovery.scheduledAt)}
                    </span>
                    {recovery.instructorName && <span className="text-xs text-ink-3">con {recovery.instructorName}</span>}
                  </div>

                  <p className="mt-1 text-[11px] text-ink-4">
                    Falta del {formatCalendarDate(recovery.absenceDate)}
                    {recovery.className ? ` · ${recovery.className}` : ''} · {recovery.durationMinutes} min
                  </p>
                  <p className={`mt-1 text-[11px] ${recovery.costAmount == null ? 'text-ink-4' : 'text-ink-2'}`}>
                    {formatCost(recovery.costAmount, recovery.costCurrency)}
                    {recovery.costNote ? ` · ${recovery.costNote}` : ''}
                  </p>
                  {recovery.absenceRecovered && recovery.status !== 'COMPLETED' && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-ok-text">
                      <CheckCircle2 aria-hidden="true" className="size-3" />
                      La falta ya fue repuesta en otro horario.
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {recovery.status === 'SCHEDULED' && (
                      <>
                        {canComplete && (
                          <>
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-ok-text disabled:opacity-50"
                              disabled={actionBusy}
                              onClick={() => handleAction(recovery, 'complete')}
                              type="button"
                            >
                              {busy === `${recovery.id}:complete` ? <Loader2 aria-hidden="true" className="size-3 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="size-3" />}
                              Completar
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-danger-text disabled:opacity-50"
                              disabled={actionBusy}
                              onClick={() => handleAction(recovery, 'no-show')}
                              type="button"
                            >
                              <XCircle aria-hidden="true" className="size-3" />
                              No asistió
                            </button>
                          </>
                        )}
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-edge-strong px-2 py-1 text-[11px] font-semibold text-ink-2 disabled:opacity-50"
                          disabled={actionBusy}
                          onClick={() => handleAction(recovery, 'cancel')}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </>
                    )}

                    {recovery.status !== 'COMPLETED' && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-edge-strong px-2 py-1 text-[11px] font-semibold text-ink-2 disabled:opacity-50"
                        disabled={actionBusy}
                        onClick={() => startReschedule(recovery)}
                        type="button"
                      >
                        <Pencil aria-hidden="true" className="size-3" />
                        Reprogramar
                      </button>
                    )}

                    {mode === 'admin' && (
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-warn-text disabled:opacity-50"
                        disabled={actionBusy}
                        onClick={() => startCost(recovery)}
                        type="button"
                      >
                        <DollarSign aria-hidden="true" className="size-3" />
                        Costo
                      </button>
                    )}

                    {recovery.meetingUrl && isHttpUrl(recovery.meetingUrl) && (
                      <a
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                        href={recovery.meetingUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink aria-hidden="true" className="size-3" />
                        Videollamada
                      </a>
                    )}
                  </div>

                  {recovery.notes && <p className="mt-1 text-[11px] text-ink-4">{recovery.notes}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {dialog}
    </section>
  )
}
