import { AlertTriangle, CalendarCheck2, CalendarX2, Clock3, UserCheck, UserX, Users } from 'lucide-react'
import type { AdminExpectedAttendanceRoster, AdminExpectedAttendanceState, AdminScheduleSummary, AttendanceStatus } from '@/types/dashboard'

interface AdminExpectedAttendanceProps {
    classes: AdminScheduleSummary[]
    selectedClassId: string | null
    date: string
    roster: AdminExpectedAttendanceRoster | null
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
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
})

export function AdminExpectedAttendance({ classes, selectedClassId, date, roster }: AdminExpectedAttendanceProps) {
    const activeClasses = classes.filter((scheduledClass) => scheduledClass.active)

    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="border-b border-edge p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Esperados vs registrados</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">Asistencia esperada</h2>
                <p className="mt-1 text-sm text-ink-3">Elige una clase y una fecha para ver qué alumnos activos tienen registro y quiénes no marcaron.</p>
            </div>

            <form className="flex flex-wrap items-end gap-3 border-b border-edge p-5" method="get">
                <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="expected-class">
                    Clase
                    <select
                        className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                        defaultValue={selectedClassId ?? ''}
                        id="expected-class"
                        name="classId"
                    >
                        {activeClasses.length === 0 && <option value="">Sin clases activas</option>}
                        {activeClasses.map((scheduledClass) => (
                            <option key={scheduledClass.id} value={scheduledClass.id}>
                                {scheduledClass.name} · {scheduledClass.branchName}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="expected-date">
                    Fecha
                    <input
                        className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                        defaultValue={date}
                        id="expected-date"
                        name="date"
                        type="date"
                    />
                </label>
                <button className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117]" type="submit">Ver pase de lista</button>
            </form>

            {!roster ? (
                <p className="px-5 py-8 text-sm text-ink-3">Selecciona una clase con alumnos activos para ver la lista esperada.</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge px-5 py-4">
                        <div>
                            <h3 className="font-display text-lg font-bold text-ink">{roster.className}</h3>
                            <p className="mt-0.5 text-xs capitalize text-ink-3">{roster.branchName} · {dateFormatter.format(new Date(`${roster.date}T00:00:00.000Z`))}</p>
                        </div>
                        {!roster.dayMatches && (
                            <p className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-warn-text">
                                <AlertTriangle aria-hidden="true" className="size-4" />Esta clase no tiene sesión este día de la semana.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-edge p-5 sm:grid-cols-3 lg:grid-cols-6">
                        <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Registros auditados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.audited}</p></article>
                        <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Esperados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.expected}</p></article>
                        <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Registrados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.registered}</p></article>
                        <article className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ok-text">Presentes</p><p className="mt-1 text-xl font-bold text-ok-text">{roster.summary.present}</p></article>
                        <article className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-danger-text">Ausentes</p><p className="mt-1 text-xl font-bold text-danger-text">{roster.summary.absent}</p></article>
                        <article className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-warn-text">Sin registro</p><p className="mt-1 text-xl font-bold text-warn-text">{roster.summary.noRecord}</p></article>
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
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}
