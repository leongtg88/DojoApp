'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronDown, ChevronUp, Minus, Plus, Repeat, Search } from 'lucide-react'
import type { KihonCategory, KumiteCategory, PracticePlace, StudentPracticeTechniqueOption, TechniqueCategory } from '@/types/dashboard'
import { TECHNIQUE_CATEGORY_LABELS } from '@/lib/dashboard/technique-format'
import { KIHON_CATEGORIES, KIHON_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kihon-categories'
import { KUMITE_CATEGORIES, KUMITE_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kumite-categories'
import { buildTechniqueSections } from '@/lib/dashboard/technique-sections'
import { KATA_BANDS, bandForOrder } from '@/lib/dashboard/kata-bands'

interface StudentPracticeLogProps {
  techniques: StudentPracticeTechniqueOption[]
  program: 'ADULT' | 'YOUTH'
  studentId?: string
}

const PROGRAM_LABELS: Record<'ADULT' | 'YOUTH', string> = {
  ADULT: 'Adultos',
  YOUTH: 'Niños',
}

interface KataBandGroup {
  key: string
  program: 'YOUTH' | 'ADULT'
  programLabel: string
  label: string
  items: StudentPracticeTechniqueOption[]
}

interface BandBeltChip {
  key: string
  beltColor: string
}

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

function RepsStepper({ value, onChange, disabled, label, compact = false, minValue = 1 }: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label: string
  compact?: boolean
  minValue?: number
}) {
  const parsed = Number.parseInt(value, 10)
  const current = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  const step = (delta: number) => {
    onChange(String(Math.max(minValue, Math.min(100_000, current + delta))))
  }
  return (
    <div className={`flex shrink-0 items-center overflow-hidden rounded-md border border-edge-strong bg-surface-2 ${disabled ? 'opacity-40' : ''}`}>
      <button
        aria-label={`Quitar una repetición de ${label}`}
        className="flex size-7 items-center justify-center text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        onClick={() => step(-1)}
        type="button"
      >
        <Minus aria-hidden="true" className="size-3.5" />
      </button>
      <input
        aria-label={`Repeticiones de ${label}`}
        className={`${compact ? 'w-10' : 'w-12'} border-x border-edge-strong bg-transparent py-1.5 text-center text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500 disabled:cursor-not-allowed`}
        disabled={disabled}
        inputMode="numeric"
        min={minValue}
        max={100_000}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Reps"
        type="number"
        value={value}
      />
      <button
        aria-label={`Añadir una repetición de ${label}`}
        className="flex size-7 items-center justify-center text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        onClick={() => step(1)}
        type="button"
      >
        <Plus aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  )
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
        <input checked={checked} className="size-4 shrink-0 accent-cyan-500" onChange={onToggle} type="checkbox" />
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
      <RepsStepper disabled={!checked} label={technique.name} onChange={onRepsChange} value={reps} />
    </li>
  )
}

const pad = (value: number) => String(value).padStart(2, '0')

export function StudentPracticeLog({ techniques, program, studentId }: StudentPracticeLogProps) {
  const router = useRouter()
  const studentHeader: Record<string, string> = studentId ? { 'X-Student-Id': studentId } : {}

  const localNow = new Date()
  const todayValue = `${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())}`
  const minDateValue = (() => {
    const min = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 6)
    return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}`
  })()

  const [practiceDate, setPracticeDate] = useState(todayValue)
  const [practiceReps, setPracticeReps] = useState<Record<string, string>>({})
  const [practicePlace, setPracticePlace] = useState<PracticePlace>('DOJO')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TechniqueCategory>('ALL')
  const [kihonFilter, setKihonFilter] = useState<'ALL' | KihonCategory>('ALL')
  const [kumiteFilter, setKumiteFilter] = useState<'ALL' | KumiteCategory>('ALL')
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ASSIGNED'>('ASSIGNED')
  const [programFilter, setProgramFilter] = useState<'ALL' | 'YOUTH' | 'ADULT'>(program)
  const [openKataLevels, setOpenKataLevels] = useState<Record<string, boolean>>({})

  const practiceLogs = Object.entries(practiceReps)
    .map(([techniqueId, repetitions]) => ({ techniqueId, repetitions: Number.parseInt(repetitions, 10), place: practicePlace }))
    .filter((line) => line.techniqueId && Number.isFinite(line.repetitions) && line.repetitions > 0)

  const selectedCount = practiceLogs.length
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

  const filteredTechniques = techniques
    .filter((technique) => scopeFilter === 'ALL' || technique.assigned)
    .filter((technique) => {
      if (programFilter === 'ALL') return true
      if (technique.category !== 'KATA') return false
      return technique.kataLevels.length === 0 || technique.kataLevels.some((level) => level.program === programFilter)
    })
    .filter(matchesFilter)
  const sections = buildTechniqueSections(filteredTechniques.filter((technique) => technique.category !== 'KATA'))
  const kataGroups = buildKataBandGroups(filteredTechniques.filter((technique) => technique.category === 'KATA'), programFilter)
  const searchActive = normalizedSearch.length > 0

  const toggleKataLevel = (key: string) => setOpenKataLevels((current) => ({ ...current, [key]: !current[key] }))

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

  const setReps = (techniqueId: string, value: string) => setPracticeReps((current) => ({ ...current, [techniqueId]: value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return
    if (practiceLogs.length === 0) {
      alert('Selecciona al menos una técnica con sus repeticiones.')
      return
    }

    setIsSubmitting(true)
    setWarning(null)

    const response = await fetch('/api/dashboard/student/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...studentHeader },
      body: JSON.stringify({
        practiceLogs,
        date: new Date(`${practiceDate}T12:00:00`).toISOString(),
      }),
    })

    setIsSubmitting(false)

    if (response.ok) {
      const payload = await response.json().catch(() => null) as { practiceWarning?: string } | null
      setWarning(payload?.practiceWarning ?? 'Repeticiones registradas correctamente.')
      setPracticeReps({})
      setPracticePlace('DOJO')
      router.refresh()
      return
    }

    const { error } = await response.json().catch(() => ({ error: 'Error al registrar tus repeticiones' }))
    alert(error ?? 'Error al registrar tus repeticiones')
  }

  return (
    <section className="rounded-xl border border-edge bg-surface-2 p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-2 border-b border-edge pb-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-ink">
            <Repeat className="size-5 text-accent" aria-hidden="true" />
            <span>Registrar repeticiones</span>
          </h3>
          <p className="mt-0.5 text-xs text-ink-3">Anota las técnicas que practicaste. Las que están en tu expediente suman a tu progreso.</p>
        </div>
      </div>

      {techniques.length === 0 ? (
        <p className="rounded-md border border-dashed border-edge-strong px-3 py-4 text-center text-xs text-ink-4">Aún no hay técnicas en el catálogo de la escuela. Pídele a tu sensei que las cree para poder registrar repeticiones.</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="practice-date">
                Fecha de la práctica
              </label>
              <input
                className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
                id="practice-date"
                max={todayValue}
                min={minDateValue}
                onChange={(event) => setPracticeDate(event.target.value)}
                type="date"
                value={practiceDate}
              />
            </div>
            <div className="flex items-end">
              <div className="flex w-full items-center gap-1 rounded-md border border-edge-strong bg-surface-1 p-1">
                <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">Lugar</span>
                {([['DOJO', 'En el dojo'], ['FUERA', 'Fuera del dojo']] as const).map(([value, label]) => (
                  <button aria-pressed={practicePlace === value} className={`flex-1 rounded px-2.5 py-1.5 text-center text-xs font-bold transition-colors ${practicePlace === value ? 'bg-cyan-500 text-[#0d1117]' : 'text-ink-3 hover:text-ink'}`} key={value} onClick={() => setPracticePlace(value)} type="button">{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-edge bg-surface-1 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-2">
                <Repeat className="size-4 text-accent" aria-hidden="true" />Técnicas practicadas
              </p>
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
            </div>

            {isPickerOpen && (
              <>
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
                          <button aria-expanded={isOpen} className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3/40" onClick={() => toggleKataLevel(group.key)} type="button">
                            {isOpen ? <ChevronUp className="size-4 shrink-0 text-ink-3" aria-hidden="true" /> : <ChevronDown className="size-4 shrink-0 text-ink-3" aria-hidden="true" />}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold uppercase tracking-wide text-ink-3">
                                {programFilter === 'ALL' ? `${group.programLabel} · ${group.label}` : group.label}
                              </span>
                              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                {belts.map((belt) => {
                                  const isDark = belt.beltColor.toUpperCase() === '#212121'
                                  return <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm border border-white/30" key={belt.key} style={{ backgroundColor: belt.beltColor, boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.5)' : undefined }} />
                                })}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] text-ink-4">{group.items.length}</span>
                          </button>
                          {isOpen && (
                            <ul className="space-y-2 border-t border-edge p-2">
                              {group.items.map((technique) => (
                                <PracticeTechniqueRow checked={technique.id in practiceReps} key={`${group.key}:${technique.id}`} onRepsChange={(value) => setReps(technique.id, value)} onToggle={() => toggleTechnique(technique.id)} reps={practiceReps[technique.id] ?? ''} technique={technique} />
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
                            <PracticeTechniqueRow checked={technique.id in practiceReps} key={technique.id} onRepsChange={(value) => setReps(technique.id, value)} onToggle={() => toggleTechnique(technique.id)} reps={practiceReps[technique.id] ?? ''} technique={technique} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {warning && (
            <p className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-ok-text">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {warning}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-ink-3">{selectedCount} técnica{selectedCount === 1 ? '' : 's'} seleccionada{selectedCount === 1 ? '' : 's'}</span>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-cyan-500 disabled:opacity-50 sm:w-auto"
              disabled={isSubmitting || selectedCount === 0}
              type="submit"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar repeticiones'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
