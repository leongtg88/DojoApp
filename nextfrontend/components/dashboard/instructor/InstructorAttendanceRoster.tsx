'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, CircleX, Save, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react'
import type { InstructorAttendanceRoster as AttendanceRoster } from '@/types/dashboard'
import { InstructorAddStudentModal } from './InstructorAddStudentModal'

interface InstructorAttendanceRosterProps {
    roster: AttendanceRoster
}

const JUSTIFICATION_LABELS = {
    PENDING: 'Justificación pendiente',
    APPROVED: 'Falta justificada',
    REJECTED: 'Justificación rechazada',
} as const

export function InstructorAttendanceRoster({ roster }: InstructorAttendanceRosterProps) {
    const router = useRouter()
    const [records, setRecords] = useState(roster.students)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [busyJustification, setBusyJustification] = useState<string | null>(null)
    const presentCount = records.filter(({ present }) => present).length
    const absentCount = records.length - presentCount
    const pendingJustifications = records.filter(({ justification }) => justification?.status === 'PENDING').length
    const readOnly = !roster.isOwnClass

    function updateRecord(studentId: string, update: Partial<(typeof records)[number]>) {
        setRecords((currentRecords) => currentRecords.map((record) => (
            record.id === studentId ? { ...record, ...update } : record
        )))
    }

    function updateAllRecords(present: boolean) {
        setRecords((currentRecords) => currentRecords.map((record) => ({ ...record, present })))
    }

    function addStudent(student: { id: string; firstName: string; lastName: string; currentRank: string | null }) {
        setRecords((currentRecords) => {
            if (currentRecords.some((record) => record.id === student.id)) return currentRecords
            return [...currentRecords, { ...student, present: true, notes: null, justified: false, justification: null }]
        })
        setIsAddOpen(false)
    }

    async function reviewJustification(justificationId: string, action: 'approve' | 'reject') {
        setError(null)
        setBusyJustification(justificationId)

        const response = await fetch(`/api/dashboard/instructor/attendance/justification/${justificationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        })

        setBusyJustification(null)

        if (!response.ok) {
            setError('No fue posible revisar la justificación. Inténtalo nuevamente.')
            return
        }

        setRecords((currentRecords) => currentRecords.map((record) => (
            record.justification?.id === justificationId
                ? { ...record, justification: { ...record.justification, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } }
                : record
        )))
        router.refresh()
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setIsSaving(true)

        const response = await fetch('/api/dashboard/instructor/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                classId: roster.classId,
                date: roster.date,
                records: records.map(({ id, present, notes }) => ({
                    studentId: id,
                    present,
                    notes: notes?.trim() || null,
                })),
            }),
        })

        setIsSaving(false)

        if (!response.ok) {
            setError('No fue posible guardar la asistencia. Inténtalo nuevamente.')
            return
        }

        router.refresh()
    }

    return (
        <section className="mt-6 rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="border-b border-edge px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Registro del tatami</p>
                        <h2 className="mt-1 font-display text-lg font-bold text-ink">{roster.className}</h2>
                        <p className="mt-1 text-xs text-ink-3">
                            {roster.isPassTaken
                                ? `Pase guardado ${roster.passTakenByName ? `por ${roster.passTakenByName}` : ''}.`
                                : 'Pase de lista pendiente: aún no se ha guardado la asistencia de esta clase.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-ok-text"><UserCheck aria-hidden="true" className="size-3.5" />{presentCount} presentes</span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-2.5 py-1 text-xs font-bold text-ink-2"><CircleX aria-hidden="true" className="size-3.5" />{absentCount} ausentes</span>
                        {pendingJustifications > 0 && <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-info-text"><ShieldCheck aria-hidden="true" className="size-3.5" />{pendingJustifications} justificaciones</span>}
                    </div>
                </div>
                <p className="mt-2 text-xs text-ink-3">{roster.students.length} alumnos activos en esta clase. Marca la casilla de quienes asistieron.</p>
            </div>
            {readOnly && (
                <p className="border-b border-edge bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-warn-text">
                    Solo lectura: este horario no es tuyo. Puedes consultarlo, pero solo validas la asistencia de tus horarios.
                </p>
            )}
            {!roster.dayMatches && (
                <p className="border-b border-edge bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-warn-text">
                    Esta clase no tiene sesión el día seleccionado. Puedes registrar la asistencia igualmente.
                </p>
            )}
            <form onSubmit={handleSubmit}>
                {records.length === 0 ? (
                    <p className="px-5 py-8 text-xs text-ink-3">No hay alumnos activos en esta clase.</p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-surface-1 px-5 py-3">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-3"><Users aria-hidden="true" className="size-4 text-accent" />{readOnly ? 'Consulta la asistencia de este horario.' : 'Marca a los presentes; desmarca a los ausentes.'}</p>
                            {!readOnly && (
                                <div className="flex gap-2">
                                    <button className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-ok-text hover:bg-emerald-500/10" onClick={() => updateAllRecords(true)} type="button"><CheckCheck aria-hidden="true" className="size-3.5" />Marcar todos</button>
                                    <button className="inline-flex items-center gap-1.5 rounded-md border border-edge-strong px-3 py-1.5 text-xs font-bold text-ink-2 hover:bg-surface-3" onClick={() => updateAllRecords(false)} type="button"><CircleX aria-hidden="true" className="size-3.5" />Desmarcar todos</button>
                                    <button className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/40 px-3 py-1.5 text-xs font-bold text-info-text hover:bg-sky-500/10" onClick={() => setIsAddOpen(true)} type="button"><UserPlus aria-hidden="true" className="size-3.5" />Agregar alumno</button>
                                </div>
                            )}
                        </div>
                        <ul className="divide-y divide-edge">
                            {records.map((record) => {
                                const justification = record.justification
                                const canReview = !readOnly && justification?.status === 'PENDING' && !record.present
                                return (
                                    <li className="flex flex-wrap items-start gap-3 px-5 py-4 sm:flex-nowrap" key={record.id}>
                                        <label className="mt-0.5 flex cursor-pointer items-center gap-3">
                                            <input
                                                aria-label={`Asistencia de ${record.firstName} ${record.lastName}`}
                                                checked={record.present}
                                                className="size-5 accent-emerald-500 disabled:cursor-not-allowed"
                                                disabled={readOnly}
                                                onChange={(event) => updateRecord(record.id, { present: event.target.checked })}
                                                type="checkbox"
                                            />
                                        </label>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-ink">{record.firstName} {record.lastName}</p>
                                                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${record.present ? 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' : 'border-rose-500/30 bg-rose-500/10 text-danger-text'}`}>{record.present ? 'Presente' : 'Ausente'}</span>
                                                {justification && (
                                                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${justification.status === 'APPROVED' ? 'border-sky-500/30 bg-sky-500/10 text-info-text' : justification.status === 'PENDING' ? 'border-amber-500/30 bg-amber-500/10 text-warn-text' : 'border-rose-500/30 bg-rose-500/10 text-danger-text'}`}>
                                                        {JUSTIFICATION_LABELS[justification.status]}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-ink-3">{record.currentRank ?? 'Sin grado asignado'}</p>
                                            {justification && (
                                                <div className="mt-2 rounded-md border border-edge bg-surface-1 px-3 py-2">
                                                    <p className="text-xs text-ink-2">Motivo del alumno: {justification.reason}</p>
                                                    {justification.status === 'APPROVED' && justification.reviewedByName && (
                                                        <p className="mt-1 text-[11px] text-info-text">Aprobada por {justification.reviewedByName}</p>
                                                    )}
                                                    {canReview && (
                                                        <div className="mt-2 flex gap-2">
                                                            <button
                                                                className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 px-2.5 py-1 text-xs font-bold text-info-text hover:bg-sky-500/10 disabled:opacity-50"
                                                                disabled={busyJustification === justification.id}
                                                                onClick={() => reviewJustification(justification.id, 'approve')}
                                                                type="button"
                                                            >
                                                                Aprobar justificación
                                                            </button>
                                                            <button
                                                                className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2.5 py-1 text-xs font-bold text-danger-text hover:bg-rose-500/10 disabled:opacity-50"
                                                                disabled={busyJustification === justification.id}
                                                                onClick={() => reviewJustification(justification.id, 'reject')}
                                                                type="button"
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {readOnly ? (
                                                record.notes && <p className="mt-3 rounded-md border border-edge bg-surface-1 px-3 py-2 text-sm text-ink-2">{record.notes}</p>
                                            ) : (
                                                <input
                                                    className="mt-3 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none focus:border-cyan-500"
                                                    onChange={(event) => updateRecord(record.id, { notes: event.target.value })}
                                                    placeholder="Observación opcional"
                                                    value={record.notes ?? ''}
                                                />
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}
                {error && <p className="px-5 pt-4 text-sm font-medium text-danger-text">{error}</p>}
                {!readOnly && (
                    <div className="border-t border-edge px-5 py-4">
                        <button
                            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSaving}
                            type="submit"
                        >
                            <Save aria-hidden="true" className="size-4" />
                            {isSaving ? 'Guardando...' : 'Guardar asistencia'}
                        </button>
                    </div>
                )}
            </form>

            {!readOnly && (
                <InstructorAddStudentModal
                    open={isAddOpen}
                    alreadyPresentIds={new Set(records.map(({ id }) => id))}
                    onAdd={addStudent}
                    onClose={() => setIsAddOpen(false)}
                />
            )}
        </section>
    )
}
