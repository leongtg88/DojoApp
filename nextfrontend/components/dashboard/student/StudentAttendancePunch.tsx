'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Hourglass,
  Pencil,
  Plus,
  Repeat,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import type { AttendanceRecord, KihonCategory, KumiteCategory, PracticePlace, StudentAttendancePunchData, StudentPracticeTechniqueOption, TechniqueCategory } from '@/types/dashboard'
import { TECHNIQUE_CATEGORY_LABELS } from '@/lib/dashboard/technique-format'
import { KIHON_CATEGORIES, KIHON_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kihon-categories'
import { KUMITE_CATEGORIES, KUMITE_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kumite-categories'
import { buildTechniqueSections } from '@/lib/dashboard/technique-sections'
import { formatDateTime } from '@/lib/format/datetime'

interface StudentAttendancePunchProps {
  data: StudentAttendancePunchData
  studentId?: string
}

const SESSION_OPTIONS = [
  { value: 'class', label: 'Clase regular' },
  { value: 'private', label: 'Clase privada' },
  { value: 'autonomous', label: 'Entrenamiento libre' },
  { value: 'seminar', label: 'Seminario / Especial' },
  { value: 'other', label: 'Otro' },
]

const PROGRAM_LABELS: Record<'ADULT' | 'YOUTH', string> = {
  ADULT: 'Adultos',
  YOUTH: 'Niños',
}

const STATUS_LABELS: Record<'CONFIRMED' | 'PENDING' | 'REJECTED' | 'JUSTIFIED', string> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Esperando al Sensei',
  REJECTED: 'Rechazada',
  JUSTIFIED: 'Justificada',
}

function sessionLabel(sessionType: string | null): string {
  return SESSION_OPTIONS.find(({ value }) => value === sessionType)?.label ?? sessionType ?? 'Clase'
}

interface KataBandGroup {
  key: string
  program: 'YOUTH' | 'ADULT'
  programLabel: string
  label: string
  items: StudentPracticeTechniqueOption[]
}

type KataBand = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO'

const KATA_BANDS: Record<'YOUTH' | 'ADULT', Array<{ band: KataBand; label: string; maxOrder: number }>> = {
  YOUTH: [
    { band: 'PRINCIPIANTE', label: 'Principiante · 11th Kyu – 9th Kyu', maxOrder: 5 },
    { band: 'INTERMEDIO', label: 'Intermedio · 8th Kyu – 4th Kyu', maxOrder: 12 },
    { band: 'AVANZADO', label: 'Avanzado · 3rd Kyu – Cinturón Negro', maxOrder: Number.MAX_SAFE_INTEGER },
  ],
  ADULT: [
    { band: 'PRINCIPIANTE', label: 'Principiante · 11th Kyu – 9th Kyu', maxOrder: 3 },
    { band: 'INTERMEDIO', label: 'Intermedio · 8th Kyu – 4th Kyu', maxOrder: 8 },
    { band: 'AVANZADO', label: 'Avanzado · 3rd Kyu – Cinturón Negro', maxOrder: Number.MAX_SAFE_INTEGER },
  ],
}

function bandForOrder(program: 'YOUTH' | 'ADULT', order: number): KataBand {
  return KATA_BANDS[program].find((entry) => order <= entry.maxOrder)?.band ?? 'AVANZADO'
}

interface BandBeltChip {
  key: string
  beltColor: string
}

/** Colores de cinturón distintos (sólidos) presentes en un tramo, sin repetir. */
function bandBeltChips(items: StudentPracticeTechniqueOption[], program: 'YOUTH' | 'ADULT'): BandBeltChip[] {
  const byOrder = new Map<number, BandBeltChip>()
  const seenColors = new Set<string>()
  for (const kata of items) {
    for (const level of kata.kataLevels) {
      if (level.program !== program) continue
      const color = (level.beltColor ?? '#3f3f46').toUpperCase()
      if (seenColors.has(color)) continue
      seenColors.add(color)
      byOrder.set(level.order, { key: `${program}:${color}`, beltColor: level.beltColor ?? '#3f3f46' })
    }
  }
  return [...byOrder.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1])
}

/** Agrupa las katas por tramo (Principiante/Intermedio/Avanzado) dentro de cada
 *  programa. Si `program` está activo, sólo genera los tramos de ese programa.
 *  Cada kata se lista una sola vez por tramo. */
function buildKataBandGroups(katas: StudentPracticeTechniqueOption[], program: 'ALL' | 'YOUTH' | 'ADULT'): KataBandGroup[] {
  const programs: Array<'YOUTH' | 'ADULT'> = program === 'ALL' ? ['YOUTH', 'ADULT'] : [program]
  const groups: KataBandGroup[] = []

  for (const prog of programs) {
    for (const band of KATA_BANDS[prog]) {
      const items = katas.filter((kata) =>
        kata.kataLevels.some((level) => level.program === prog && bandForOrder(prog, level.order) === band.band),
      )
      if (items.length > 0) {
        groups.push({ key: `${prog}:${band.band}`, program: prog, programLabel: PROGRAM_LABELS[prog], label: band.label, items })
      }
    }
  }

  return groups
}

function PracticeTechniqueRow({ technique, checked, reps, onToggle, onRepsChange }: {
  technique: StudentPracticeTechniqueOption
  checked: boolean
  reps: string
  onToggle: () => void
  onRepsChange: (value: string) => void
}) {
  return (
    <li className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${checked ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-edge bg-surface-2'}`}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
        <input
          checked={checked}
          className="size-4 shrink-0 accent-cyan-500"
          onChange={onToggle}
          type="checkbox"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="min-w-0 truncate text-sm font-semibold text-ink">{technique.name}</span>
            {technique.japaneseName && <span className="hidden shrink-0 text-xs font-normal text-ink-3 sm:inline">{technique.japaneseName}</span>}
          </span>
          <span className={`text-[11px] font-semibold ${technique.assigned ? 'text-ok-text' : 'text-ink-4'}`}>
            {technique.assigned ? 'En tu expediente' : 'Práctica libre'}
          </span>
        </span>
      </label>
      <input
        aria-label={`Repeticiones de ${technique.name}`}
        className="w-14 shrink-0 rounded-md border border-edge-strong bg-surface-2 px-2 py-1.5 text-center text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500 disabled:opacity-40"
        disabled={!checked}
        min={1}
        onChange={(event) => onRepsChange(event.target.value)}
        placeholder="Reps"
        type="number"
        value={reps}
      />
    </li>
  )
}

export function StudentAttendancePunch({ data, studentId }: StudentAttendancePunchProps) {
  const router = useRouter()
  const { summary, records } = data
  const studentHeader: Record<string, string> = studentId ? { 'X-Student-Id': studentId } : {}

  const [hours, setHours] = useState<number>(1)
  const [sessionType, setSessionType] = useState<string>('class')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [practiceReps, setPracticeReps] = useState<Record<string, string>>({})
  const [practicePlace, setPracticePlace] = useState<PracticePlace>('DOJO')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [showPunchSuccess, setShowPunchSuccess] = useState(false)
  const [punchWarning, setPunchWarning] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TechniqueCategory>('ALL')
  const [kihonFilter, setKihonFilter] = useState<'ALL' | KihonCategory>('ALL')
  const [kumiteFilter, setKumiteFilter] = useState<'ALL' | KumiteCategory>('ALL')
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ASSIGNED'>('ASSIGNED')
  const [programFilter, setProgramFilter] = useState<'ALL' | 'YOUTH' | 'ADULT'>(data.program)
  const [openKataLevels, setOpenKataLevels] = useState<Record<string, boolean>>({})

  const pad = (value: number) => String(value).padStart(2, '0')
  const localNow = new Date()
  const todayValue = `${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())}`
  const minDateValue = (() => {
    const min = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 6)
    return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}`
  })()
  const [punchDate, setPunchDate] = useState(todayValue)
  const [punchTime, setPunchTime] = useState(() => `${pad(localNow.getHours())}:${pad(localNow.getMinutes())}`)

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editHours, setEditHours] = useState<number>(1.5)
  const [editSessionType, setEditSessionType] = useState<string>('class')
  const [editNotes, setEditNotes] = useState<string>('')
  const [editPractice, setEditPractice] = useState<Array<{ id: string; techniqueId: string; name: string; repetitions: string; place: PracticePlace }>>([])
  const [editAddQuery, setEditAddQuery] = useState('')
  const [editAddReps, setEditAddReps] = useState('')

  const quickHours = [1.0, 1.5, 2.0, 2.5]

  const practiceLogs = Object.entries(practiceReps)
    .map(([techniqueId, repetitions]) => ({ techniqueId, repetitions: Number.parseInt(repetitions, 10), place: practicePlace }))
    .filter((line) => line.techniqueId && Number.isFinite(line.repetitions) && line.repetitions > 0)

  const selectedCount = Object.values(practiceReps).filter((value) => Number.parseInt(value, 10) > 0).length
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')

  const matchesFilter = (technique: StudentPracticeTechniqueOption): boolean => {
    const matchesCategory = categoryFilter === 'ALL' || technique.category === categoryFilter
    const matchesKihon = categoryFilter !== 'KIHON' || kihonFilter === 'ALL' || technique.kihonCategory === kihonFilter
    const matchesKumite = categoryFilter !== 'KUMITE' || kumiteFilter === 'ALL' || technique.kumiteCategory === kumiteFilter
    const matchesSearch = !normalizedSearch || [
      technique.name,
      technique.japaneseName ?? '',
      TECHNIQUE_CATEGORY_LABELS[technique.category],
      technique.kihonCategory ? KIHON_CATEGORY_SHORT_LABELS[technique.kihonCategory] : '',
      technique.kumiteCategory ? KUMITE_CATEGORY_SHORT_LABELS[technique.kumiteCategory] : '',
    ].some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))
    return matchesCategory && matchesKihon && matchesKumite && matchesSearch
  }

  const filteredTechniques = data.practiceTechniques
    .filter((technique) => scopeFilter === 'ALL' || technique.assigned)
    .filter((technique) => {
      if (programFilter === 'ALL') return true
      // Con un programa activo sólo se muestran katas: las que tienen nivel de
      // ese programa y las katas sin grado (se conservan siempre).
      if (technique.category !== 'KATA') return false
      return technique.kataLevels.length === 0 || technique.kataLevels.some((level) => level.program === programFilter)
    })
    .filter(matchesFilter)
  const sections = buildTechniqueSections(filteredTechniques.filter((technique) => technique.category !== 'KATA'))
  const kataGroups = buildKataBandGroups(filteredTechniques.filter((technique) => technique.category === 'KATA'), programFilter)
  const searchActive = normalizedSearch.length > 0

  const toggleKataLevel = (key: string) => {
    setOpenKataLevels((current) => ({ ...current, [key]: !current[key] }))
  }

  const toggleTechnique = (techniqueId: string) => {
    setPracticeReps((current) => {
      if (techniqueId in current) {
        const next = { ...current }
        delete next[techniqueId]
        return next
      }
      return { ...current, [techniqueId]: '' }
    })
  }

  const setReps = (techniqueId: string, value: string) => {
    setPracticeReps((current) => ({ ...current, [techniqueId]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!punchDate || !punchTime) {
      alert('Selecciona la fecha y hora de la práctica para continuar.')
      return
    }
    if (hours <= 0) return

    setIsSubmitting(true)
    const response = await fetch('/api/dashboard/student/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...studentHeader },
      body: JSON.stringify({
        hoursTrained: hours,
        sessionType,
        // Se envía el instante con zona horaria para que la hora registrada
        // coincida con la que el alumno seleccionó, sin importar la zona del servidor.
        date: new Date(`${punchDate}T${punchTime}`).toISOString(),
        notes: notes.trim(),
        ...(practiceLogs.length > 0 ? { practiceLogs } : {}),
      }),
    })
    setIsSubmitting(false)

    if (response.ok) {
      const payload = await response.json().catch(() => null) as { practiceWarning?: string } | null
      setPunchWarning(payload?.practiceWarning ?? null)
      setNotes('')
      setPracticeReps({})
      setPracticePlace('DOJO')
      const now = new Date()
      setPunchDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
      setPunchTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`)
      router.refresh()
      setShowPunchSuccess(true)
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
    setEditPractice(
      (record.practiceLogs ?? []).map((log) => ({
        id: log.id,
        techniqueId: log.techniqueId ?? '',
        name: log.techniqueName,
        repetitions: String(log.repetitions),
        place: log.place,
      })),
    )
  }

  const setEditPracticeReps = (id: string, value: string) => {
    setEditPractice((current) => current.map((line) => (line.id === id ? { ...line, repetitions: value } : line)))
  }

  const setEditPracticePlace = (id: string, place: PracticePlace) => {
    setEditPractice((current) => current.map((line) => (line.id === id ? { ...line, place } : line)))
  }

  const EDIT_PRACTICE_LIMIT = 30
  const editAddNormalized = editAddQuery.trim().toLocaleLowerCase('es')
  const editAddResults = editAddNormalized.length === 0
    ? []
    : data.practiceTechniques
      .filter((technique) => {
        if (editPractice.some((line) => line.techniqueId === technique.id)) return false
        return [technique.name, technique.japaneseName ?? ''].some((value) => value.toLocaleLowerCase('es').includes(editAddNormalized))
      })
      .slice(0, 8)

  const addEditPractice = (technique: StudentPracticeTechniqueOption) => {
    if (editPractice.length >= EDIT_PRACTICE_LIMIT) return
    if (editPractice.some((line) => line.techniqueId === technique.id)) return
    setEditPractice((current) => [
      ...current,
      { id: `${technique.id}-${Date.now()}`, techniqueId: technique.id, name: technique.name, repetitions: editAddReps.trim(), place: practicePlace },
    ])
    setEditAddQuery('')
    setEditAddReps('')
  }

  const handleSaveEdit = async () => {
    if (!editingRecord || isSubmitting) return

    const practiceLogs = editPractice
      .map((line) => ({ techniqueId: line.techniqueId, repetitions: Number.parseInt(line.repetitions, 10), place: line.place }))
      .filter((line) => line.techniqueId && Number.isFinite(line.repetitions) && line.repetitions > 0)

    setIsSubmitting(true)
    const response = await fetch(`/api/dashboard/student/attendance/${editingRecord.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...studentHeader },
      body: JSON.stringify({
        hoursTrained: editHours,
        sessionType: editSessionType,
        notes: editNotes.trim(),
        ...(editPractice.length > 0 ? { practiceLogs } : {}),
      }),
    })
    setIsSubmitting(false)

    if (response.ok) {
      const payload = await response.json().catch(() => null) as { practiceWarning?: string } | null
      if (payload?.practiceWarning) setPunchWarning(payload.practiceWarning)
      setEditingRecord(null)
      setEditPractice([])
      router.refresh()
    } else {
      const { error } = await response.json().catch(() => ({ error: 'Error al corregir tu práctica' }))
      alert(error ?? 'Error al corregir tu práctica')
    }
  }

  const handleDelete = async (record: AttendanceRecord) => {
    if (!window.confirm('¿Eliminar este registro pendiente?')) return

    const response = await fetch(`/api/dashboard/student/attendance/${record.id}`, { method: 'DELETE', headers: studentHeader })
    if (response.ok) {
      router.refresh()
    } else {
      const { error } = await response.json().catch(() => ({ error: 'Error al eliminar el registro' }))
      alert(error ?? 'Error al eliminar el registro')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-edge bg-surface-2 p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-2 border-b border-edge pb-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-ink">
              <Clock className="size-5 text-red-500" aria-hidden="true" />
              <span>Marcar Asistencia (Punch In)</span>
            </h3>
            <p className="mt-0.5 text-xs text-ink-3">
              Registra tus horas entrenadas. Tu Sensei confirmará la asistencia al finalizar el tatami.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-edge-strong bg-surface-3/80 px-2.5 py-1 font-mono text-xs text-ink-2">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span>Tatami Activo</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="punch-date">
                Fecha de la práctica <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-red-500 focus:outline-none"
                id="punch-date"
                max={todayValue}
                min={minDateValue}
                onChange={(event) => setPunchDate(event.target.value)}
                type="date"
                value={punchDate}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="punch-time">
                Hora de la práctica <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-red-500 focus:outline-none"
                id="punch-time"
                onChange={(event) => setPunchTime(event.target.value)}
                type="time"
                value={punchTime}
              />
            </div>
          </div>
          <p className="-mt-1 text-[11px] text-ink-4">
            Por defecto ahora. Puedes registrar hasta 7 días atrás; tu Sensei confirma la asistencia.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="punch-hours">
                Horas Entrenadas
              </label>
              <div className="flex items-center gap-2">
                <input
                  className="w-24 rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 font-mono text-sm text-ink focus:border-red-500 focus:outline-none"
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
                        : 'bg-surface-3 text-ink-2 hover:bg-surface-3'
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="punch-session">
                Contenido / Sesión
              </label>
              <select
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink focus:border-red-500 focus:outline-none"
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="punch-notes">
                Notas / Observaciones
              </label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-red-500 focus:outline-none"
                id="punch-notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ej: Práctica de Heian Sandan, corrección de postura"
                type="text"
                value={notes}
              />
            </div>
          </div>

          <div className="rounded-lg border border-edge bg-surface-1 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-2">
                <Repeat className="size-4 text-accent" aria-hidden="true" />Repeticiones de técnicas
              </p>
              {data.practiceTechniques.length > 0 && (
                <button
                  aria-expanded={isPickerOpen}
                  className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-accent-text transition-colors hover:bg-cyan-500/20"
                  onClick={() => setIsPickerOpen((open) => !open)}
                  type="button"
                >
                  {isPickerOpen ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <ChevronDown className="size-3.5" aria-hidden="true" />}
                  {isPickerOpen ? 'Ocultar' : 'Añadir'}
                  {selectedCount > 0 && <span className="ml-1 rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-[#0d1117]">{selectedCount}</span>}
                </button>
              )}
            </div>
            {data.practiceTechniques.length === 0 ? (
              <p className="mt-3 rounded-md border border-dashed border-edge-strong px-3 py-4 text-center text-xs text-ink-4">Aún no hay técnicas en el catálogo de la escuela. Pídele a tu sensei que las cree para poder registrar repeticiones.</p>
            ) : isPickerOpen ? (
              <>
                <p className="mt-1 text-[11px] text-ink-4">Marca las técnicas que practicaste y escribe sus repeticiones. <span className="font-semibold text-ok-text">Solo las que están en tu expediente</span> suman a tu progreso; las demás se guardan como práctica libre y no cuentan para tu experiencia.</p>
                <div className="mt-3 flex flex-col gap-2 rounded-md border border-edge-strong bg-surface-1 p-2">
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <span className="w-full text-[11px] font-bold uppercase tracking-wider text-ink-3 sm:w-20">Mostrar</span>
                    <div className="flex w-full flex-1 items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                      {([['ALL', 'Todo el catálogo'], ['ASSIGNED', 'Solo asignadas']] as const).map(([value, label]) => (
                        <button aria-pressed={scopeFilter === value} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${scopeFilter === value ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={value} onClick={() => setScopeFilter(value)} type="button">{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <span className="w-full text-[11px] font-bold uppercase tracking-wider text-ink-3 sm:w-20">Programa</span>
                    <div className="flex w-full flex-1 items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                      {([['ALL', 'Todos'], ['YOUTH', 'Niños'], ['ADULT', 'Adultos']] as const).map(([value, label]) => (
                        <button aria-pressed={programFilter === value} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${programFilter === value ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={value} onClick={() => setProgramFilter(value)} type="button">{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <span className="w-full text-[11px] font-bold uppercase tracking-wider text-ink-3 sm:w-20">Lugar</span>
                    <div className="flex w-full flex-1 items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                      {([['DOJO', 'En el dojo'], ['FUERA', 'Fuera del dojo']] as const).map(([value, label]) => (
                        <button aria-pressed={practicePlace === value} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${practicePlace === value ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={value} onClick={() => setPracticePlace(value)} type="button">{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <label className="relative block w-full" htmlFor="practice-technique-search">
                      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-accent" />
                      <input className="w-full rounded-md border border-edge-strong bg-surface-2 py-1.5 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" id="practice-technique-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar técnica" type="search" value={searchTerm} />
                    </label>
                    <div className="scrollbar-thin-x flex w-full items-center gap-1.5 overflow-x-auto pb-1">
                      {([['ALL', 'Todas'], ['KATA', 'Katas'], ['KIHON', 'Kihon'], ['KUMITE', 'Kumite'], ['BUNKAI', 'Bunkai']] as const).map(([category, label]) => (
                        <button aria-pressed={categoryFilter === category} className={`shrink-0 whitespace-nowrap rounded-md border px-3 py-1.5 text-center text-xs font-bold transition-colors ${categoryFilter === category ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-1 text-ink-3 hover:border-edge-strong'}`} key={category} onClick={() => setCategoryFilter(category)} type="button">{label}</button>
                      ))}
                    </div>
                  </div>
                  {categoryFilter === 'KIHON' && (
                    <div className="flex w-full flex-wrap items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                      <button aria-pressed={kihonFilter === 'ALL'} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${kihonFilter === 'ALL' ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} onClick={() => setKihonFilter('ALL')} type="button">Todas</button>
                      {KIHON_CATEGORIES.map((option) => (
                        <button aria-pressed={kihonFilter === option} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${kihonFilter === option ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={option} onClick={() => setKihonFilter(option)} type="button">{KIHON_CATEGORY_SHORT_LABELS[option]}</button>
                      ))}
                    </div>
                  )}
                  {categoryFilter === 'KUMITE' && (
                    <div className="flex w-full flex-wrap items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                      <button aria-pressed={kumiteFilter === 'ALL'} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${kumiteFilter === 'ALL' ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} onClick={() => setKumiteFilter('ALL')} type="button">Todas</button>
                      {KUMITE_CATEGORIES.map((option) => (
                        <button aria-pressed={kumiteFilter === option} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${kumiteFilter === option ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={option} onClick={() => setKumiteFilter(option)} type="button">{KUMITE_CATEGORY_SHORT_LABELS[option]}</button>
                      ))}
                    </div>
                  )}
                </div>

                {sections.length === 0 && kataGroups.length === 0 ? (
                  <p className="mt-3 rounded-md border border-dashed border-edge-strong px-3 py-4 text-center text-xs text-ink-4">
                    {scopeFilter === 'ASSIGNED' ? 'No tienes técnicas asignadas que coincidan con los filtros.' : 'No hay técnicas que coincidan con los filtros.'}
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {kataGroups.map((group) => {
                      const isOpen = searchActive || Boolean(openKataLevels[group.key])
                      const belts = bandBeltChips(group.items, group.program)
                      return (
                        <div className="overflow-hidden rounded-lg border border-edge bg-surface-2" key={group.key}>
                          <button
                            aria-expanded={isOpen}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3/40"
                            onClick={() => toggleKataLevel(group.key)}
                            type="button"
                          >
                            {isOpen ? <ChevronUp className="size-4 shrink-0 text-ink-3" aria-hidden="true" /> : <ChevronDown className="size-4 shrink-0 text-ink-3" aria-hidden="true" />}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold uppercase tracking-wide text-ink-3">
                                {programFilter === 'ALL' ? `${group.programLabel} · ${group.label}` : group.label}
                              </span>
                              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                {belts.map((belt) => {
                                  const isDark = belt.beltColor.toUpperCase() === '#212121'
                                  return (
                                    <span
                                      aria-hidden="true"
                                      className="inline-block h-3 w-5 rounded-sm border border-white/30"
                                      key={belt.key}
                                      style={{ backgroundColor: belt.beltColor, boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.5)' : undefined }}
                                    />
                                  )
                                })}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] text-ink-4">{group.items.length}</span>
                          </button>
                          {isOpen && (
                            <ul className="space-y-2 border-t border-edge p-2">
                              {group.items.map((technique) => (
                                <PracticeTechniqueRow
                                  checked={technique.id in practiceReps}
                                  key={`${group.key}:${technique.id}`}
                                  onRepsChange={(value) => setReps(technique.id, value)}
                                  onToggle={() => toggleTechnique(technique.id)}
                                  reps={practiceReps[technique.id] ?? ''}
                                  technique={technique}
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}

                    {sections.map((section) => (
                      <div key={section.key}>
                        <div className="flex items-center gap-2 px-1">
                          <span aria-hidden="true" className={`h-3 w-1 rounded-full ${section.accent}`} />
                          <h4 className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{section.label}</h4>
                          <span className="text-[11px] text-ink-4">{section.items.length}</span>
                        </div>
                        <ul className="mt-2 space-y-2">
                          {section.items.map((technique) => (
                            <PracticeTechniqueRow
                              checked={technique.id in practiceReps}
                              key={technique.id}
                              onRepsChange={(value) => setReps(technique.id, value)}
                              onToggle={() => toggleTechnique(technique.id)}
                              reps={practiceReps[technique.id] ?? ''}
                              technique={technique}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-ink-3">
              Estado: <strong className="text-ink-2">{summary.pendingCount > 0 ? 'Tienes práctica(s) sin confirmar' : 'Al día'}</strong>
            </span>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-950/40 transition-all hover:bg-red-500 disabled:opacity-50 sm:w-auto"
              disabled={isSubmitting || hours <= 0}
              type="submit"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Punch Asistencia ({hours}h)</span>
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-edge bg-surface-2">
        <div className="flex items-center justify-between border-b border-edge p-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-ink-3" aria-hidden="true" />
            <h4 className="text-sm font-bold text-ink">Tu Historial de Asistencias</h4>
          </div>
          <span className="text-xs text-ink-3">{records.length} registros en total</span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-3">
            No tienes asistencias registradas aún. ¡Marca tu primera práctica con el formulario superior!
          </div>
        ) : (
          <div className="divide-y divide-edge/80">
            {records.map((record) => {
              const isConfirmed = record.status === 'CONFIRMED'
              const isPending = record.status === 'PENDING'
              const isJustified = record.status === 'JUSTIFIED'
              const isRejected = record.status === 'REJECTED'

              return (
                <div className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-surface-3/30 sm:flex-row sm:items-center" key={record.id}>
                  <div className="flex items-start gap-3 sm:items-center">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${isConfirmed
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-ok-text'
                      : isPending
                        ? 'border-amber-500/30 bg-amber-500/10 text-warn-text'
                        : isJustified
                          ? 'border-sky-500/30 bg-sky-500/10 text-info-text'
                          : 'border-red-500/30 bg-red-500/10 text-danger-text'
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
                        <span className="font-mono text-sm font-bold text-ink">{formatDateTime(record.date)}</span>
                        <span className="rounded bg-surface-3 px-2 py-0.5 font-mono text-xs text-ink-2">{record.hoursTrained}h</span>
                        <span className="text-xs font-medium text-ink-2">{sessionLabel(record.sessionType)}</span>
                      </div>
                      {record.notes && <p className="mt-1 text-xs italic text-ink-3">&ldquo;{record.notes}&rdquo;</p>}
                      {record.practiceLogs && record.practiceLogs.length > 0 && (
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-ink-3">
                          <Repeat aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
                          {record.practiceLogs.map((log) => `${log.techniqueName} ×${log.repetitions}${log.place === 'FUERA' ? ' (fuera)' : ''}`).join(' · ')}
                        </p>
                      )}
                      {isConfirmed && record.confirmedByName && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ok-text/90">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          <span>Validado por {record.confirmedByName}</span>
                        </p>
                      )}
                      {isJustified && (
                        <p className="mt-0.5 text-[11px] text-info-text/90">
                          Falta justificada. Recupérala entrenando fuera de tu horario habitual.
                        </p>
                      )}
                      {isRejected && (
                        <p className="mt-0.5 text-[11px] text-danger-text/90">
                          No fue validado por el Sensei. Registra tu práctica de nuevo.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-center">
                    {record.isOutOfSchedule && (
                      <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-warn-text">
                        <Clock className="size-3.5" aria-hidden="true" />
                        Fuera de horario
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${isConfirmed
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-ok-text'
                      : isPending
                        ? 'border-amber-500/30 bg-amber-500/20 text-warn-text'
                        : isJustified
                          ? 'border-sky-500/30 bg-sky-500/20 text-info-text'
                          : 'border-red-500/30 bg-red-500/20 text-danger-text'
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
                          className="flex items-center gap-1 rounded border border-edge-strong bg-surface-3 px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-surface-3 hover:text-accent"
                          onClick={() => handleOpenEdit(record)}
                          title="Corregir si te equivocaste de horas o notas"
                          type="button"
                        >
                          <Pencil className="size-3" aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        <button
                          className="rounded border border-edge p-1 text-ink-4 transition-colors hover:border-red-500/40 hover:text-danger-text"
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
          <div className="w-full max-w-md space-y-4 rounded-xl border border-edge-strong bg-surface-2 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <Pencil className="size-4 text-accent" aria-hidden="true" />
                <span>Corregir mi Asistencia Marcada</span>
              </h3>
              <button
                className="rounded p-1 text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                onClick={() => setEditingRecord(null)}
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-ink-3">
              Modifica las horas, contenido o comentarios si cometiste un error al registrarla.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-ink-3">Horas entrenadas</label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-24 rounded-lg border border-edge-strong bg-surface-1 p-2.5 font-mono font-bold text-ink focus:border-cyan-500 focus:outline-none"
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
                          ? 'border-cyan-500 bg-cyan-500/20 text-accent'
                          : 'border-edge-strong text-ink-3 hover:text-ink'
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
                <label className="mb-1 block font-medium text-ink-3">Tipo de Práctica</label>
                <select
                  className="w-full cursor-pointer rounded-lg border border-edge-strong bg-surface-1 p-2.5 text-ink focus:border-cyan-500 focus:outline-none"
                  onChange={(event) => setEditSessionType(event.target.value)}
                  value={editSessionType}
                >
                  {SESSION_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink-3">Notas u Observación</label>
                <textarea
                  className="w-full rounded-lg border border-edge-strong bg-surface-1 p-2.5 text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none"
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="Observación o detalle para el Sensei..."
                  rows={2}
                  value={editNotes}
                />
              </div>

              {editPractice.length > 0 && (
                <div>
                  <label className="mb-1 block font-medium text-ink-3">Repeticiones registradas</label>
                  <div className="space-y-2">
                    {editPractice.map((line) => (
                      <div className="flex items-center gap-2" key={line.id}>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{line.name}</span>
                        <input
                          aria-label={`Repeticiones de ${line.name}`}
                          className="w-16 rounded-lg border border-edge-strong bg-surface-1 p-2 text-center text-xs text-ink focus:border-cyan-500 focus:outline-none"
                          min={1}
                          onChange={(event) => setEditPracticeReps(line.id, event.target.value)}
                          type="number"
                          value={line.repetitions}
                        />
                        <select
                          className="rounded-lg border border-edge-strong bg-surface-1 p-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                          onChange={(event) => setEditPracticePlace(line.id, event.target.value as PracticePlace)}
                          value={line.place}
                        >
                          <option value="DOJO">En el dojo</option>
                          <option value="FUERA">Fuera del dojo</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-4">Ajusta las repeticiones o el lugar. Si dejas una en cero, no se guardará.</p>
                </div>
              )}

              <div>
                <label className="mb-1 block font-medium text-ink-3" htmlFor="edit-add-technique">Añadir técnica o kata que faltó</label>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-accent" />
                    <input
                      className="w-full rounded-lg border border-edge-strong bg-surface-1 py-2 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                      disabled={editPractice.length >= EDIT_PRACTICE_LIMIT}
                      id="edit-add-technique"
                      onChange={(event) => setEditAddQuery(event.target.value)}
                      placeholder="Buscar técnica"
                      type="search"
                      value={editAddQuery}
                    />
                  </div>
                  <input
                    aria-label="Repeticiones de la técnica a añadir"
                    className="w-16 rounded-lg border border-edge-strong bg-surface-1 p-2 text-center text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                    min={1}
                    onChange={(event) => setEditAddReps(event.target.value)}
                    placeholder="Reps"
                    type="number"
                    value={editAddReps}
                  />
                </div>
                {editPractice.length >= EDIT_PRACTICE_LIMIT && (
                  <p className="mt-1 text-[11px] text-ink-4">Alcanzaste el máximo de {EDIT_PRACTICE_LIMIT} técnicas.</p>
                )}
                {editAddResults.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-edge-strong bg-surface-1">
                    {editAddResults.map((technique) => (
                      <li key={technique.id}>
                        <button
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-surface-3/50"
                          onClick={() => addEditPractice(technique)}
                          type="button"
                        >
                          <span className="min-w-0 truncate text-ink">
                            {technique.name}
                            {technique.japaneseName && <span className="ml-1.5 text-ink-3">{technique.japaneseName}</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-accent-text">
                            <Plus className="size-3.5" aria-hidden="true" />Añadir
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {editAddNormalized.length > 0 && editAddResults.length === 0 && (
                  <p className="mt-1 text-[11px] text-ink-4">Sin coincidencias (o ya está en la lista).</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-edge pt-2">
              <button
                className="rounded-lg border border-edge-strong px-3.5 py-1.5 text-xs text-ink-2 hover:bg-surface-3"
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

      {showPunchSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="punch-success-title">
          <div className="w-full max-w-sm rounded-xl border border-edge-strong bg-surface-2 p-6 text-center shadow-2xl">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-ok-text">
              <CheckCircle2 className="size-9" aria-hidden="true" />
            </div>
            <h3 id="punch-success-title" className="mt-4 font-display text-xl font-extrabold text-ink">Asistencia Recibida</h3>
            <p className="mt-2 text-sm text-ink-3">La puedes ver en el historial de asistencia.</p>
            {punchWarning && (
              <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-xs text-warn-text">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {punchWarning}
              </p>
            )}
            <button
              className="mt-5 w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-cyan-500"
              onClick={() => setShowPunchSuccess(false)}
              type="button"
            >
              Oss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}