import { CalendarCheck2, CalendarX2, Clock3, UserCheck, UserX, Users } from 'lucide-react'
import type { AdminExpectedAttendanceRoster, AdminExpectedAttendanceState, AttendanceStatus } from '@/types/dashboard'
import { AdminJustificationActions } from './AdminJustificationActions'

interface AdminExpectedTableProps {
    roster: AdminExpectedAttendanceRoster
}

const STATE_META: Record<AdminExpectedAttendanceState, { label: string; className: string }> = {
    PRESENT: { label: 'Presente', className: 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' },
    ABSENT: { label: 'Ausente', className: 'border-rose-500/30 bg-rose-500/10 text-danger-text' },
    PUNCH: { label: 'Punch', className: 'border-cyan-500/30 bg-cyan-500/10 text-accent-text' },
    NONE: { label: 'Sin registro', className: 'border-amber-500/30 bg-amber-500/10 text-warn-text' },
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    REJECTED: 'Rechazada',
    JUSTIFIED: 'Justificada',
    ABSENT: 'Falta',
}

export function AdminExpectedTable({ roster }: AdminExpectedTableProps) {
    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="border-b border-edge px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Resumen del listado</p>
                <h2 className="mt-1 font-display text-lg font-bold text-ink">Asistencia de los alumnos</h2>
            </div>
            {roster.students.length === 0 ? (
                <p className="flex flex-col items-center gap-2 px-5 py-12 text-center text-ink-4">
                    <Users className="size-6" aria-hidden="true" />
                    <span className="text-sm">No hay alumnos activos inscritos en esta clase.</span>
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-edge text-[11px] uppercase tracking-wide text-ink-3">
                            <tr>
                                <th className="px-5 py-2.5 font-semibold">Alumno</th>
                                <th className="px-3 py-2.5 font-semibold">Grado</th>
                                <th className="px-3 py-2.5 font-semibold">Estado</th>
                                <th className="px-5 py-2.5 font-semibold">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-edge">
                            {roster.students.map((student) => {
                                const stateMeta = STATE_META[student.state]
                                return (
                                    <tr key={student.id} className="hover:bg-surface-3/40">
                                        <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink">{student.firstName} {student.lastName}</td>
                                        <td className="whitespace-nowrap px-3 py-3 text-ink-3">{student.currentRank ?? 'Sin grado'}</td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${stateMeta.className}`}>
                                                {student.state === 'PRESENT' && <UserCheck aria-hidden="true" className="size-3.5" />}
                                                {student.state === 'ABSENT' && <UserX aria-hidden="true" className="size-3.5" />}
                                                {student.state === 'PUNCH' && <CalendarCheck2 aria-hidden="true" className="size-3.5" />}
                                                {student.state === 'NONE' && <CalendarX2 aria-hidden="true" className="size-3.5" />}
                                                {stateMeta.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {student.status && <span className="text-[11px] text-ink-4">{STATUS_LABELS[student.status]}</span>}
                                                {student.hoursTrained > 0 && <span className="inline-flex items-center gap-1 rounded-md border border-edge-strong bg-surface-1 px-2 py-0.5 text-[11px] font-semibold text-ink-2"><Clock3 aria-hidden="true" className="size-3 text-accent" />{student.hoursTrained}h</span>}
                                                {student.outOfSchedule && <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-warn-text">Fuera de horario</span>}
                                                {student.notes && <span className="text-[11px] text-ink-3">{student.notes}</span>}
                                            </div>
                                            {student.justification && (
                                                <div className="mt-2 rounded-md border border-edge bg-surface-1 px-2.5 py-2">
                                                    <p className="text-[11px] text-ink-2">
                                                        <span className="font-semibold text-ink-3">Motivo: </span>
                                                        {student.justification.reason}
                                                    </p>
                                                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                                                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${student.justification.status === 'APPROVED' ? 'border-sky-500/30 bg-sky-500/10 text-info-text' : student.justification.status === 'PENDING' ? 'border-amber-500/30 bg-amber-500/10 text-warn-text' : 'border-rose-500/30 bg-rose-500/10 text-danger-text'}`}>
                                                            {student.justification.status === 'APPROVED' ? 'Justificada' : student.justification.status === 'PENDING' ? 'Pendiente' : 'Rechazada'}
                                                        </span>
                                                        {student.justification.status === 'PENDING' && (
                                                            <AdminJustificationActions justificationId={student.justification.id} />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
