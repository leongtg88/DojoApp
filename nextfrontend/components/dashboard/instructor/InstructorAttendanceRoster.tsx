'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import type { InstructorAttendanceRoster as AttendanceRoster } from '@/types/dashboard'

interface InstructorAttendanceRosterProps {
    roster: AttendanceRoster
}

export function InstructorAttendanceRoster({ roster }: InstructorAttendanceRosterProps) {
    const router = useRouter()
    const [records, setRecords] = useState(roster.students)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    function updateRecord(studentId: string, update: Partial<(typeof records)[number]>) {
        setRecords((currentRecords) => currentRecords.map((record) => (
            record.id === studentId ? { ...record, ...update } : record
        )))
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
        <section className="mt-6 border border-[#e5e2e1] bg-white">
            <div className="border-b border-[#e5e2e1] px-5 py-4">
                <h2 className="font-display text-lg font-bold text-[#1c1b1b]">{roster.className}</h2>
                <p className="mt-1 text-sm text-[#5c403c]">{roster.students.length} alumnos activos.</p>
            </div>
            <form onSubmit={handleSubmit}>
                {records.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#5c403c]">No hay alumnos activos en esta clase.</p>
                ) : (
                    <ul className="divide-y divide-[#e5e2e1]">
                        {records.map((record) => (
                            <li className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]" key={record.id}>
                                <div>
                                    <p className="text-sm font-semibold text-[#1c1b1b]">{record.firstName} {record.lastName}</p>
                                    <p className="mt-1 text-xs text-[#5c403c]">{record.currentRank ?? 'Sin grado asignado'}</p>
                                    <input
                                        className="mt-3 w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm outline-none focus:border-[#b70011]"
                                        onChange={(event) => updateRecord(record.id, { notes: event.target.value })}
                                        placeholder="Observación opcional"
                                        value={record.notes ?? ''}
                                    />
                                </div>
                                <label className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#1c1b1b]">
                                    <input
                                        checked={record.present}
                                        className="size-4 accent-[#b70011]"
                                        onChange={(event) => updateRecord(record.id, { present: event.target.checked })}
                                        type="checkbox"
                                    />
                                    Presente
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
                {error && <p className="px-5 pt-4 text-sm font-medium text-[#b70011]">{error}</p>}
                <div className="border-t border-[#e5e2e1] px-5 py-4">
                    <button
                        className="inline-flex items-center gap-2 bg-[#b70011] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSaving}
                        type="submit"
                    >
                        <Save aria-hidden="true" className="size-4" />
                        {isSaving ? 'Guardando...' : 'Guardar asistencia'}
                    </button>
                </div>
            </form>
        </section>
    )
}