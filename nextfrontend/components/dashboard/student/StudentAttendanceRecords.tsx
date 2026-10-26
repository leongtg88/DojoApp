import { AlertCircle, Calendar, CheckCircle2, Hourglass, Repeat, ShieldCheck } from 'lucide-react'
import type { AttendanceRecord, AttendanceStatus } from '@/types/dashboard'
import { formatDate, formatDateTime } from '@/lib/format/datetime'
import { formatHoursHM } from '@/lib/dashboard/balance'
import { EmptyState } from '@/components/common/EmptyState'

interface StudentAttendanceRecordsProps {
    records: AttendanceRecord[]
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazada',
    JUSTIFIED: 'Justificada',
    ABSENT: 'Inasistencia',
}

const STATUS_CLASSES: Record<AttendanceStatus, string> = {
    CONFIRMED: 'border-emerald-500/30 bg-emerald-500/20 text-ok-text',
    PENDING: 'border-amber-500/30 bg-amber-500/20 text-warn-text',
    REJECTED: 'border-red-500/30 bg-red-500/20 text-danger-text',
    JUSTIFIED: 'border-sky-500/30 bg-sky-500/20 text-info-text',
    ABSENT: 'border-red-500/30 bg-red-500/20 text-danger-text',
}

const SESSION_LABELS: Record<string, string> = {
    class: 'Clase',
    private: 'Clase privada',
    autonomous: 'Entrenamiento libre',
    seminar: 'Seminario',
    other: 'Otro',
    online_recovery: 'Reposición online 35 min',
}

export function StudentAttendanceRecords({ records }: StudentAttendanceRecordsProps) {
    return (
        <section className="overflow-hidden rounded-xl border border-edge bg-surface-2">
            <div className="flex items-center justify-between border-b border-edge p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-ink-3" aria-hidden="true" />
                    <h4 className="text-sm font-bold text-ink">Tu historial de asistencias</h4>
                </div>
                <span className="text-xs text-ink-3">{records.length} registros</span>
            </div>

            {records.length === 0 ? (
                <EmptyState
                    action={{ label: 'Ver mi horario', href: '/dashboard/estudiante/horario' }}
                    className="border-t border-edge"
                    description="Tu instructor las registrará en el pase de lista de cada clase."
                    icon={Calendar}
                    title="Aún no tienes asistencias registradas"
                    variant="inline"
                />
            ) : (
                <ul className="divide-y divide-edge/80">
                    {records.map((record) => {
                        const meta = STATUS_CLASSES[record.status]
                        // Las asistencias de sesión (pase de lista) se muestran como fecha
                        // sin hora; los punch libres conservan su hora local.
                        const dateLabel = record.sessionId || record.sessionType === 'online_recovery'
                            ? formatDate(record.date)
                            : formatDateTime(record.date)
                        return (
                            <li className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-surface-3/30 sm:flex-row sm:items-center" key={record.id}>
                                <div className="flex items-start gap-3 sm:items-center">
                                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${meta}`}>
                                        {record.status === 'CONFIRMED' ? (
                                            <CheckCircle2 className="size-5" aria-hidden="true" />
                                        ) : record.status === 'PENDING' ? (
                                            <Hourglass className="size-5 animate-pulse" aria-hidden="true" />
                                        ) : record.status === 'JUSTIFIED' ? (
                                            <ShieldCheck className="size-5" aria-hidden="true" />
                                        ) : (
                                            <AlertCircle className="size-5" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-ink">{dateLabel}</span>
                                            {record.present && record.hoursTrained > 0 && (
                                                <span className="rounded bg-surface-3 px-2 py-0.5 font-mono text-xs text-ink-2">{formatHoursHM(record.hoursTrained)}</span>
                                            )}
                                            <span className="text-xs font-medium text-ink-2">{record.className ?? SESSION_LABELS[record.sessionType ?? ''] ?? 'Clase'}</span>
                                        </div>
                                        {record.notes && <p className="mt-1 text-xs italic text-ink-3">&ldquo;{record.notes}&rdquo;</p>}
                                        {record.practiceLogs && record.practiceLogs.length > 0 && (
                                            <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-ink-3">
                                                <Repeat aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
                                                {record.practiceLogs.map((log) => `${log.techniqueName} ×${log.repetitions}${log.place === 'FUERA' ? ' (fuera)' : ''}`).join(' · ')}
                                            </p>
                                        )}
                                        {record.status === 'CONFIRMED' && record.confirmedByName && (
                                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ok-text/90">
                                                <CheckCircle2 className="size-3" aria-hidden="true" />
                                                <span>Validado por {record.confirmedByName}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-center">
                                    {record.isOutOfSchedule && (
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-warn-text">Fuera de horario</span>
                                    )}
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${meta}`}>{STATUS_LABELS[record.status]}</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
