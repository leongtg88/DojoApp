'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Search, Send, X } from 'lucide-react'
import { TECHNIQUE_CATEGORY_LABELS } from '@/lib/dashboard/technique-format'
import { KIHON_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kihon-categories'
import { KUMITE_CATEGORY_SHORT_LABELS } from '@/lib/dashboard/kumite-categories'
import type { AdminBeltRankSummary, AdminTechniqueSummary } from '@/types/dashboard'

type Tab = 'GRADE' | 'STUDENT' | 'GROUP'
type GroupType = 'ALL' | 'GRADE' | 'BRANCH' | 'CLASS'

interface StudentOption {
    id: string
    firstName: string
    lastName: string
    currentRank: string | null
    branchName: string
    activeClassNames: string[]
}

interface TechniqueAssignDialogProps {
    technique: AdminTechniqueSummary
    ranks: AdminBeltRankSummary[]
    onClose: () => void
    onAssigned: (summary: { gradesLinked: number; studentsAssigned: number }) => void
    /** Endpoint que devuelve `{ students }` para poblar la pestaña Alumno/Grupo. */
    studentsEndpoint?: string
    /** URL del endpoint de asignación para una técnica concreta. */
    assignUrl?: (techniqueId: string) => string
    /** Si es `false`, la pestaña Grado sólo propaga a los alumnos y no enlaza el plan. */
    allowPlanLinking?: boolean
}

function techniqueCategoryLabel(technique: AdminTechniqueSummary): string {
    const label = TECHNIQUE_CATEGORY_LABELS[technique.category]
    if (technique.category === 'KIHON' && technique.kihonCategory) return `${label} · ${KIHON_CATEGORY_SHORT_LABELS[technique.kihonCategory]}`
    if (technique.category === 'KUMITE' && technique.kumiteCategory) return `${label} · ${KUMITE_CATEGORY_SHORT_LABELS[technique.kumiteCategory]}`
    return label
}

const TABS: { id: Tab; label: string }[] = [
    { id: 'GRADE', label: 'Grado' },
    { id: 'STUDENT', label: 'Alumno' },
    { id: 'GROUP', label: 'Grupo' },
]

const GROUP_TYPE_OPTIONS: { value: GroupType; label: string }[] = [
    { value: 'ALL', label: 'Todos los alumnos activos' },
    { value: 'GRADE', label: 'Por grado' },
    { value: 'BRANCH', label: 'Por sucursal' },
    { value: 'CLASS', label: 'Por clase' },
]

export function TechniqueAssignDialog({
    technique,
    ranks,
    onClose,
    onAssigned,
    studentsEndpoint = '/api/dashboard/admin/students',
    assignUrl = (techniqueId) => `/api/dashboard/admin/techniques/${techniqueId}/assign`,
    allowPlanLinking = true,
}: TechniqueAssignDialogProps) {
    const [tab, setTab] = useState<Tab>('GRADE')
    const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set())
    const [assignToStudents, setAssignToStudents] = useState(false)

    const [students, setStudents] = useState<StudentOption[]>([])
    const [studentsLoading, setStudentsLoading] = useState(true)
    const [studentSearch, setStudentSearch] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

    const [groupType, setGroupType] = useState<GroupType>('ALL')
    const [groupValue, setGroupValue] = useState('')

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sortedRanks = useMemo(() => [...ranks].sort((a, b) => a.program.localeCompare(b.program) || a.order - b.order), [ranks])

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

    const canSubmit = tab === 'GRADE'
        ? selectedGrades.size > 0
        : tab === 'STUDENT'
            ? selectedStudents.size > 0
            : groupType === 'ALL' || groupValue !== ''

    function toggleGrade(id: string) {
        setSelectedGrades((previous) => {
            const next = new Set(previous)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

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
        let targets
        if (tab === 'GRADE') {
            targets = [{ kind: 'GRADE', gradeIds: [...selectedGrades], assignToStudents: allowPlanLinking ? assignToStudents : true }]
        } else if (tab === 'STUDENT') {
            targets = [{ kind: 'STUDENT', studentIds: [...selectedStudents] }]
        } else {
            targets = [{ kind: 'GROUP', group: { type: groupType, value: groupType === 'ALL' ? undefined : groupValue } }]
        }

        try {
            const response = await fetch(assignUrl(technique.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets }),
            })
            const payload = await response.json().catch(() => ({})) as { error?: string; gradesLinked?: number; studentsAssigned?: number }
            if (!response.ok) throw new Error(payload.error ?? 'No fue posible asignar la técnica.')
            onAssigned({ gradesLinked: payload.gradesLinked ?? 0, studentsAssigned: payload.studentsAssigned ?? 0 })
            onClose()
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : 'No fue posible asignar la técnica.')
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
                            <h3 className="text-sm font-bold text-ink">Asignar técnica</h3>
                            <p className="text-xs text-ink-3">{technique.name} · {techniqueCategoryLabel(technique)}</p>
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
                    {tab === 'GRADE' && (
                        <>
                            <p className="text-xs text-ink-3">{allowPlanLinking ? 'Elige los grados a cuyo plan se enlazará esta técnica.' : 'Elige los grados cuyos alumnos activos recibirán esta técnica.'}</p>
                            <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-edge bg-surface-1 p-2">
                                {sortedRanks.map((rank) => {
                                    const checked = selectedGrades.has(rank.id)
                                    return (
                                        <li key={rank.id}>
                                            <label className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-colors ${checked ? 'bg-surface-3' : 'hover:bg-surface-3/50'}`}>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-xs font-semibold text-ink">{rank.name}{rank.kyuDan ? ` · ${rank.kyuDan}` : ''}</span>
                                                    <span className="block text-[11px] text-ink-3">{rank.program === 'YOUTH' ? 'Niños' : 'Adultos'}{allowPlanLinking ? '' : ` · ${rank.studentCount} ${rank.studentCount === 1 ? 'alumno' : 'alumnos'}`}</span>
                                                </span>
                                                <input type="checkbox" checked={checked} onChange={() => toggleGrade(rank.id)} className="size-4 shrink-0 cursor-pointer rounded accent-cyan-400" />
                                            </label>
                                        </li>
                                    )
                                })}
                            </ul>
                            {allowPlanLinking ? (
                                <label className="flex items-start gap-3 rounded-md border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs leading-5 text-ink-3" htmlFor="assign-propagation">
                                    <input id="assign-propagation" type="checkbox" checked={assignToStudents} onChange={(event) => setAssignToStudents(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-cyan-500" />
                                    <span><span className="font-semibold text-ink">Asignar a los alumnos actuales de esos grados</span> — recibirán la técnica en su expediente y una notificación.</span>
                                </label>
                            ) : (
                                <p className="rounded-md border border-edge bg-surface-1 px-3 py-2 text-[11px] text-ink-3">
                                    Se agregará la técnica al expediente de los alumnos activos de los grados elegidos. No se modifica el plan ni los requisitos de examen.
                                </p>
                            )}
                        </>
                    )}

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
                            <label className="text-xs font-semibold text-ink-2" htmlFor="assign-group-type">Destino
                                <select id="assign-group-type" value={groupType} onChange={(event) => { setGroupType(event.target.value as GroupType); setGroupValue('') }} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink">
                                    {GROUP_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </label>
                            {groupType !== 'ALL' && (
                                <label className="text-xs font-semibold text-ink-2" htmlFor="assign-group-value">
                                    {groupType === 'GRADE' ? 'Grado' : groupType === 'BRANCH' ? 'Sucursal' : 'Clase'}
                                    <select id="assign-group-value" value={groupValue} onChange={(event) => setGroupValue(event.target.value)} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink">
                                        <option value="">Selecciona…</option>
                                        {targetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                            )}
                            <p className="rounded-md border border-edge bg-surface-1 px-3 py-2 text-[11px] text-ink-3">
                                Se agregará la técnica al expediente de los alumnos activos del destino; no se elimina nada.
                            </p>
                        </>
                    )}

                    {error && <p className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-danger-text">{error}</p>}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-edge bg-surface-1 px-5 py-3.5">
                    <button type="button" onClick={onClose} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink">Cancelar</button>
                    <button type="button" onClick={handleAssign} disabled={!canSubmit || saving} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-50">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Asignar
                    </button>
                </div>
            </div>
        </div>
    )
}
