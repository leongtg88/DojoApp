'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Search, Send, X } from 'lucide-react'

type Tab = 'STUDENT' | 'GROUP'
type GroupType = 'ALL' | 'GRADE' | 'BRANCH' | 'CLASS'

interface StudentOption {
  id: string
  firstName: string
  lastName: string
  currentRank: string | null
  branchName: string
  activeClassNames: string[]
}

interface AssignGradeDialogProps {
  /** Grado seleccionado: sólo se usa para el mensaje y la auditoría. */
  gradeId: string
  gradeName: string
  /** Katas/técnicas del grado que se asignarán. */
  techniqueIds: string[]
  /** Endpoint que devuelve `{ students }` para poblar las pestañas. */
  studentsEndpoint: string
  /** Endpoint de asignación masiva (contrato `{ techniqueIds, rankId, targets }`). */
  assignUrl: string
  onClose: () => void
  onAssigned: (summary: { studentsAssigned: number; linksAdded: number }) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'STUDENT', label: 'Alumno' },
  { id: 'GROUP', label: 'Grupo' },
]

const GROUP_TYPE_OPTIONS: { value: GroupType; label: string }[] = [
  { value: 'ALL', label: 'Todos los alumnos activos' },
  { value: 'GRADE', label: 'Por grado' },
  { value: 'BRANCH', label: 'Por sucursal' },
  { value: 'CLASS', label: 'Por clase' },
]

export function AssignGradeDialog({
  gradeId,
  gradeName,
  techniqueIds,
  studentsEndpoint,
  assignUrl,
  onClose,
  onAssigned,
}: AssignGradeDialogProps) {
  const [tab, setTab] = useState<Tab>('STUDENT')

  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  const [groupType, setGroupType] = useState<GroupType>('ALL')
  const [groupValue, setGroupValue] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(studentsEndpoint)
      .then((response) => response.json())
      .then((payload: { students?: StudentOption[] }) => {
        if (!cancelled) setStudents(payload.students ?? [])
      })
      .catch(() => {
        if (!cancelled) setError('No fue posible cargar la lista de alumnos.')
      })
      .finally(() => {
        if (!cancelled) setStudentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentsEndpoint])

  const gradeOptions = useMemo(() => [...new Set(students.map((student) => student.currentRank).filter((value): value is string => Boolean(value)))].sort(), [students])
  const branchOptions = useMemo(() => [...new Set(students.map((student) => student.branchName))].sort(), [students])
  const classOptions = useMemo(() => [...new Set(students.flatMap((student) => student.activeClassNames))].sort(), [students])

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase('es')
    if (!term) return students
    return students.filter((student) => `${student.firstName} ${student.lastName}`.toLocaleLowerCase('es').includes(term))
  }, [students, studentSearch])

  const targetOptions = groupType === 'GRADE' ? gradeOptions : groupType === 'BRANCH' ? branchOptions : groupType === 'CLASS' ? classOptions : []

  const hasKatas = techniqueIds.length > 0
  const canSubmit = hasKatas && (tab === 'STUDENT'
    ? selectedStudents.size > 0
    : groupType === 'ALL' || groupValue !== '')

  function toggleStudent(id: string) {
    setSelectedStudents((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAssign() {
    setSaving(true)
    setError(null)

    const targets = tab === 'STUDENT'
      ? [{ kind: 'STUDENT' as const, studentIds: [...selectedStudents] }]
      : [{ kind: 'GROUP' as const, group: { type: groupType, value: groupType === 'ALL' ? undefined : groupValue } }]

    try {
      const response = await fetch(assignUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techniqueIds, rankId: gradeId, targets }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; studentsAssigned?: number; linksAdded?: number }
      if (!response.ok) throw new Error(payload.error ?? 'No fue posible asignar las katas del grado.')
      onAssigned({ studentsAssigned: payload.studentsAssigned ?? 0, linksAdded: payload.linksAdded ?? 0 })
      onClose()
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No fue posible asignar las katas del grado.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-edge bg-surface-1 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-accent">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Asignar katas del grado</h3>
              <p className="text-xs text-ink-3">{gradeName} · {techniqueIds.length} {techniqueIds.length === 1 ? 'kata' : 'katas'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 border-b border-edge bg-surface-1 px-5 pt-3">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-t-md border-b-2 px-3.5 py-2 text-xs font-bold transition-colors ${tab === id ? 'border-cyan-500 text-accent-text' : 'border-transparent text-ink-3 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {!hasKatas ? (
            <p className="rounded-md border border-dashed border-edge-strong bg-surface-1 p-4 text-xs text-ink-3">Este grado aún no tiene katas asociadas; añádelas antes de asignarlas.</p>
          ) : (
            <>
              {tab === 'STUDENT' && (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
                    <input type="text" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Buscar alumno…" className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-4 text-xs text-ink placeholder:text-ink-4 focus:border-cyan-500 focus:outline-none" />
                  </div>
                  {studentsLoading ? (
                    <p className="flex items-center justify-center gap-2 py-6 text-xs text-ink-3"><Loader2 className="h-4 w-4 animate-spin" />Cargando alumnos…</p>
                  ) : (
                    <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-edge bg-surface-1 p-2">
                      {filteredStudents.map((student) => {
                        const checked = selectedStudents.has(student.id)
                        return (
                          <li key={student.id}>
                            <label className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-colors ${checked ? 'bg-surface-3' : 'hover:bg-surface-3/50'}`}>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-ink">{student.firstName} {student.lastName}</span>
                                <span className="block text-[11px] text-ink-3">{student.currentRank ?? 'Sin grado'}{student.branchName ? ` · ${student.branchName}` : ''}</span>
                              </span>
                              <input type="checkbox" checked={checked} onChange={() => toggleStudent(student.id)} className="size-4 shrink-0 cursor-pointer rounded accent-cyan-400" />
                            </label>
                          </li>
                        )
                      })}
                      {filteredStudents.length === 0 && <li className="px-2 py-4 text-center text-xs text-ink-4">No se encontraron alumnos.</li>}
                    </ul>
                  )}
                </>
              )}

              {tab === 'GROUP' && (
                <>
                  <label className="text-xs font-semibold text-ink-2" htmlFor="assign-grade-group-type">Destino
                    <select id="assign-grade-group-type" value={groupType} onChange={(event) => { setGroupType(event.target.value as GroupType); setGroupValue('') }} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink">
                      {GROUP_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  {groupType !== 'ALL' && (
                    <label className="text-xs font-semibold text-ink-2" htmlFor="assign-grade-group-value">
                      {groupType === 'GRADE' ? 'Grado' : groupType === 'BRANCH' ? 'Sucursal' : 'Clase'}
                      <select id="assign-grade-group-value" value={groupValue} onChange={(event) => setGroupValue(event.target.value)} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink">
                        <option value="">Selecciona…</option>
                        {targetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                  )}
                  <p className="rounded-md border border-edge bg-surface-1 px-3 py-2 text-[11px] text-ink-3">
                    Se agregarán las katas del grado al expediente de los alumnos activos del destino; no se elimina nada.
                  </p>
                </>
              )}
            </>
          )}

          {error && <p className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-danger-text">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-edge bg-surface-1 px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3">Cancelar</button>
          <button type="button" onClick={handleAssign} disabled={!canSubmit || saving} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Asignar katas
          </button>
        </div>
      </div>
    </div>
  )
}
