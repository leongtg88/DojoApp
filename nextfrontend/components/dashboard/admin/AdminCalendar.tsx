'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarDays, CheckCircle2, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import type { ExamConvocationSummary, HolidaySummary } from '@/types/dashboard'

interface AdminCalendarProps {
  holidays: HolidaySummary[]
  convocations: ExamConvocationSummary[]
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function AdminCalendar({ holidays, convocations }: AdminCalendarProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [holidayName, setHolidayName] = useState('')
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayRecurring, setHolidayRecurring] = useState(false)

  const [examDate, setExamDate] = useState('')
  const [examDay, setExamDay] = useState<'SATURDAY' | 'SUNDAY'>('SATURDAY')
  const [examLabel, setExamLabel] = useState('')

  async function request(url: string, method: string, body?: unknown) {
    setSaving(true)
    setError(null)
    const response = await fetch(url, {
      method,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    })
    setSaving(false)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'No fue posible completar la acción.')
      return false
    }

    router.refresh()
    return true
  }

  async function createHoliday(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await request('/api/dashboard/admin/holidays', 'POST', {
      name: holidayName.trim(),
      date: holidayDate,
      recurring: holidayRecurring,
    })
    if (ok) {
      setHolidayName('')
      setHolidayDate('')
      setHolidayRecurring(false)
    }
  }

  async function createConvocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await request('/api/dashboard/admin/exam-convocations', 'POST', {
      date: examDate,
      examDay,
      label: examLabel.trim() || null,
      confirmed: true,
    })
    if (ok) {
      setExamDate('')
      setExamLabel('')
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Calendario del dojo</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Feriados y convocatorias de examen. Los feriados descuentan las horas disponibles de entrenamiento.
        </p>
      </header>

      {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}

      <section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-5 text-amber-400" />
          <h2 className="font-display text-lg font-bold text-white">Feriados</h2>
        </div>
        <p className="mt-1 text-xs text-neutral-400">Se incluyen automáticamente los feriados oficiales de RD; aquí puedes añadir cierres propios del dojo.</p>

        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" onSubmit={createHoliday}>
          <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" onChange={(event) => setHolidayName(event.target.value)} placeholder="Nombre del feriado" required value={holidayName} />
          <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" onChange={(event) => setHolidayDate(event.target.value)} required type="date" value={holidayDate} />
          <label className="flex items-center gap-2 px-1 text-xs font-semibold text-neutral-300"><input checked={holidayRecurring} className="size-4 accent-cyan-500" onChange={(event) => setHolidayRecurring(event.target.checked)} type="checkbox" />Anual</label>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} type="submit">{saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}Añadir</button>
        </form>

        {holidays.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] p-4 text-sm text-neutral-400">No hay feriados registrados.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-800 rounded-md border border-neutral-800 bg-[#0d1117]">
            {holidays.map((holiday) => (
              <li className="flex items-center justify-between gap-3 px-4 py-3" key={holiday.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{holiday.name}{holiday.recurring && <span className="ml-2 rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Anual</span>}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{formatDate(holiday.date)}</p>
                </div>
                <button aria-label={`Eliminar ${holiday.name}`} className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60" disabled={saving} onClick={() => void request(`/api/dashboard/admin/holidays/${holiday.id}`, 'DELETE')} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-400" />
          <h2 className="font-display text-lg font-bold text-white">Convocatorias de examen</h2>
        </div>
        <p className="mt-1 text-xs text-neutral-400">Fija la fecha real de examen. Mientras no exista, el portal muestra la fecha tentativa por cuatrimestre.</p>

        <form className="mt-4 grid gap-3 sm:grid-cols-[auto_auto_1fr_auto]" onSubmit={createConvocation}>
          <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" onChange={(event) => setExamDate(event.target.value)} required type="date" value={examDate} />
          <select className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" onChange={(event) => setExamDay(event.target.value as 'SATURDAY' | 'SUNDAY')} value={examDay}>
            <option value="SATURDAY">Sábado (principiantes)</option>
            <option value="SUNDAY">Domingo (avanzados)</option>
          </select>
          <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" onChange={(event) => setExamLabel(event.target.value)} placeholder="Nota o etiqueta (opcional)" value={examLabel} />
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={saving} type="submit">{saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}Fijar</button>
        </form>

        {convocations.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] p-4 text-sm text-neutral-400">Aún no hay convocatorias confirmadas.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-800 rounded-md border border-neutral-800 bg-[#0d1117]">
            {convocations.map((convocation) => (
              <li className="flex items-center justify-between gap-3 px-4 py-3" key={convocation.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{formatDate(convocation.date)}<span className="ml-2 rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{convocation.examDay === 'SATURDAY' ? 'Sábado' : 'Domingo'}</span>{convocation.confirmed && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-emerald-400">Confirmada</span>}</p>
                  {convocation.label && <p className="mt-0.5 text-xs text-neutral-400">{convocation.label}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button aria-label="Confirmar convocatoria" className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-60" disabled={saving} onClick={() => void request(`/api/dashboard/admin/exam-convocations/${convocation.id}`, 'PUT', { confirmed: !convocation.confirmed })} type="button"><RefreshCw aria-hidden="true" className="size-4" /></button>
                  <button aria-label="Eliminar convocatoria" className="rounded p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60" disabled={saving} onClick={() => void request(`/api/dashboard/admin/exam-convocations/${convocation.id}`, 'DELETE')} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
