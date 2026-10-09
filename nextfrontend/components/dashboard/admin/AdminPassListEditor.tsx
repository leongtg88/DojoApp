'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, CircleX, Save, ShieldCheck, UserCheck, Users } from 'lucide-react'
import type { AdminExpectedAttendanceRoster } from '@/types/dashboard'
import { AdminJustificationActions } from './AdminJustificationActions'

interface AdminPassListEditorProps {
    roster: AdminExpectedAttendanceRoster
}

interface EditorRecord {
    id: string
    firstName: string
    lastName: string
    currentRank: string | null
    present: boolean
    notes: string
    justificationId: string | null
    justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
    justificationReason: string | null
}

export function AdminPassListEditor({ roster }: AdminPassListEditorProps) {
    const router = useRouter()
    const [records, setRecords] = useState<EditorRecord[]>(() => roster.students.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        currentRank: student.currentRank,
        present: student.state === 'ABSENT' ? false : true,
        notes: student.notes ?? '',
        justificationId: student.justification?.id ?? null,
        justificationStatus: student.justification?.status ?? null,
        justificationReason: student.justification?.reason ?? null,
    })))
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    const presentCount = records.filter(({ present }) => present).length

    function updateRecord(studentId: string, update: Partial<EditorRecord>) {
        setRecords((current) => current.map((record) => (record.id === studentId ? { ...record, ...update } : record)))
    }

    function updateAll(present: boolean) {
        setRecords((current) => current.map((record) => ({ ...record, present })))
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSaved(false)
        setIsSaving(true)

        const response = await fetch('/api/dashboard/admin/attendance/pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                classId: roster.classId,
                date: roster.date,
                records: records.map(({ id, present, notes }) => ({
                    studentId: id,
                    present,
                    notes: notes.trim() || null,
                })),
            }),
        })

        setIsSaving(false)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible guardar el pase de lista.')
            return
        }

        setSaved(true)
        router.refresh()
    }

    return (
        <form className="border-t border-edge" onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 px-5 py-3">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-3">
                    <Users aria-hidden="true" className="size-4 text-accent" />
                    {presentCount} de {records.length} marcados como presentes
                </p>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-ok-text"><UserCheck aria-hidden="true" className="size-3.5" />{presentCount} presentes</span>
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-ok-text hover:bg-emerald-500/10" onClick={() => updateAll(true)} type="button"><CheckCheck aria-hidden="true" className="size-3.5" />Marcar todos</button>
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-edge-strong px-3 py-1.5 text-xs font-bold text-ink-2 hover:bg-surface-3" onClick={() => updateAll(false)} type="button"><CircleX aria-hidden="true" className="size-3.5" />Desmarcar todos</button>
                </div>
            </div>

            {records.length === 0 ? (
                <p className="px-5 py-8 text-xs text-ink-3">No hay alumnos activos inscritos en esta clase.</p>
            ) : (
                <ul className="divide-y divide-edge">
                    {records.map((record) => (
                        <li className="flex flex-wrap items-start gap-3 px-5 py-4 sm:flex-nowrap" key={record.id}>
                            <input
                                aria-label={`Asistencia de ${record.firstName} ${record.lastName}`}
                                checked={record.present}
                                className="mt-0.5 size-5 cursor-pointer accent-emerald-500"
                                onChange={(event) => updateRecord(record.id, { present: event.target.checked })}
                                type="checkbox"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-ink">{record.firstName} {record.lastName}</p>
                                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${record.present ? 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' : 'border-rose-500/30 bg-rose-500/10 text-danger-text'}`}>{record.present ? 'Presente' : 'Ausente'}</span>
                                </div>
                                <p className="mt-1 text-xs text-ink-3">{record.currentRank ?? 'Sin grado asignado'}</p>
                                {record.justificationReason && (
                                    <div className="mt-2 rounded-md border border-edge bg-surface-1 px-3 py-2">
                                        <p className="text-xs text-ink-2">Motivo del alumno: {record.justificationReason}</p>
                                        {record.justificationStatus === 'PENDING' && record.justificationId && !record.present && (
                                            <div className="mt-2">
                                                <AdminJustificationActions justificationId={record.justificationId} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <input
                                    className="mt-3 w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none focus:border-cyan-500"
                                    onChange={(event) => updateRecord(record.id, { notes: event.target.value })}
                                    placeholder="Observación opcional"
                                    value={record.notes}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="px-5 pt-4 text-sm font-medium text-danger-text">{error}</p>}
            {saved && <p className="px-5 pt-4 text-sm font-medium text-ok-text">Pase de lista guardado.</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge px-5 py-4">
                <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-4"><ShieldCheck aria-hidden="true" className="size-3.5" />Esta acción queda registrada como corrección del administrador.</p>
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSaving || records.length === 0}
                    type="submit"
                >
                    <Save aria-hidden="true" className="size-4" />
                    {isSaving ? 'Guardando...' : 'Guardar pase de lista'}
                </button>
            </div>
        </form>
    )
}
