'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, CircleX, Save, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react'
import type { InstructorAttendanceRoster as AttendanceRoster } from '@/types/dashboard'
import { InstructorAddStudentModal } from './InstructorAddStudentModal'

interface InstructorAttendanceRosterProps {
    roster: AttendanceRoster
}

export function InstructorAttendanceRoster({ roster }: InstructorAttendanceRosterProps) {
    const router = useRouter()
    const [records, setRecords] = useState(roster.students)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const presentCount = records.filter(({ present }) => present).length
    const justifiedCount = records.filter(({ justified }) => justified).length
    const absentCount = records.length - presentCount

    function updateRecord(studentId: string, update: Partial<(typeof records)[number]>) {
        setRecords((currentRecords) => currentRecords.map((record) => (
            record.id === studentId ? { ...record, ...update } : record
        )))
    }

    function updateAllRecords(present: boolean) {
        setRecords((currentRecords) => currentRecords.map((record) => ({ ...record, present, justified: record.justified === true ? record.justified : false })))
    }

    function toggleJustified(studentId: string, justified: boolean) {
        setRecords((currentRecords) => currentRecords.map((record) => (
            record.id === studentId ? { ...record, justified } : record
        )))
    }

    function addStudent(student: { id: string; firstName: string; lastName: string; currentRank: string | null }) {
        setRecords((currentRecords) => {
            if (currentRecords.some((record) => record.id === student.id)) return currentRecords
            return [...currentRecords, { ...student, present: true, notes: null, justified: false }]
        })
        setIsAddOpen(false)
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
                records: records.map(({ id, present, notes, justified }) => ({
                    studentId: id,
                    present,
                    justified: !present && justified ? true : false,
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
        <section className="mt-6 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
            <div className="border-b border-neutral-800 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Registro del tatami</p>
                        <h2 className="mt-1 font-display text-lg font-bold text-white">{roster.className}</h2>
                    </div>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200"><UserCheck aria-hidden="true" className="size-3.5" />{presentCount} presentes</span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-[#0d1117] px-2.5 py-1 text-xs font-bold text-neutral-300"><CircleX aria-hidden="true" className="size-3.5" />{absentCount} ausentes</span>
                        {justifiedCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-200"><ShieldCheck aria-hidden="true" className="size-3.5" />{justifiedCount} justificadas</span>}
                    </div>
                </div>
                <p className="mt-2 text-sm text-neutral-400">{roster.students.length} alumnos activos en esta clase.</p>
            </div>
            <form onSubmit={handleSubmit}>
                {records.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-400">No hay alumnos activos en esta clase.</p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-[#0d1117] px-5 py-3">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400"><Users aria-hidden="true" className="size-4 text-cyan-400" />Marca primero el estado general y ajusta casos individuales.</p>
                            <div className="flex gap-2">
                                <button className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10" onClick={() => updateAllRecords(true)} type="button"><CheckCheck aria-hidden="true" className="size-3.5" />Todos presentes</button>
                                <button className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-300 hover:bg-neutral-800" onClick={() => updateAllRecords(false)} type="button"><CircleX aria-hidden="true" className="size-3.5" />Todos ausentes</button>
                                <button className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/40 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/10" onClick={() => setIsAddOpen(true)} type="button"><UserPlus aria-hidden="true" className="size-3.5" />Agregar alumno</button>
                            </div>
                        </div>
                        <ul className="divide-y divide-neutral-800">
                            {records.map((record) => (
                                <li className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]" key={record.id}>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{record.firstName} {record.lastName}</p>
                                        <p className="mt-1 text-xs text-neutral-400">{record.currentRank ?? 'Sin grado asignado'}</p>
                                        <input
                                            className="mt-3 w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                                            onChange={(event) => updateRecord(record.id, { notes: event.target.value })}
                                            placeholder="Observación opcional"
                                            value={record.notes ?? ''}
                                        />
                                    </div>
                                    <div aria-label={`Asistencia de ${record.firstName} ${record.lastName}`} className="inline-flex flex-col items-end gap-2 self-start">
                                            <div className="inline-flex rounded-md border border-neutral-700 bg-[#0d1117] p-1 text-xs font-bold">
                                                <button aria-pressed={record.present} className={`rounded px-3 py-1.5 ${record.present ? 'bg-emerald-500 text-[#0d1117]' : 'text-neutral-400 hover:bg-neutral-800'}`} onClick={() => updateRecord(record.id, { present: true, justified: false })} type="button">Presente</button>
                                                <button aria-pressed={!record.present} className={`rounded px-3 py-1.5 ${!record.present ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`} onClick={() => updateRecord(record.id, { present: false })} type="button">Ausente</button>
                                            </div>
                                            {!record.present && (
                                                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-sky-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={record.justified ?? false}
                                                        onChange={(event) => toggleJustified(record.id, event.target.checked)}
                                                        className="size-3.5 accent-sky-500"
                                                    />
                                                    Falta justificada
                                                </label>
                                            )}
                                        </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                {error && <p className="px-5 pt-4 text-sm font-medium text-red-300">{error}</p>}
                <div className="border-t border-neutral-800 px-5 py-4">
                    <button
                        className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSaving}
                        type="submit"
                    >
                        <Save aria-hidden="true" className="size-4" />
                        {isSaving ? 'Guardando...' : 'Guardar asistencia'}
                    </button>
                </div>
            </form>

            <InstructorAddStudentModal
                open={isAddOpen}
                alreadyPresentIds={new Set(records.map(({ id }) => id))}
                onAdd={addStudent}
                onClose={() => setIsAddOpen(false)}
            />
        </section>
    )
}