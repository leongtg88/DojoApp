import { CalendarClock, CheckCircle2, Clock3, ExternalLink, Video, XCircle } from 'lucide-react'
import { formatCalendarDate, formatDateTime } from '@/lib/format/datetime'
import { isHttpUrl } from '@/lib/validation/url'
import type { OnlineRecoveryStatus, OnlineRecoverySummary } from '@/types/dashboard'

const STATUS_META: Record<OnlineRecoveryStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Programada', className: 'border-sky-500/30 bg-sky-500/10 text-info-text' },
  COMPLETED: { label: 'Completada', className: 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' },
  CANCELLED: { label: 'Cancelada', className: 'border-edge-strong bg-surface-1 text-ink-3' },
  NO_SHOW: { label: 'No asistió', className: 'border-rose-500/30 bg-rose-500/10 text-danger-text' },
}

function formatCost(recovery: OnlineRecoverySummary): string {
  if (recovery.costAmount != null) {
    return `Costo: ${new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2 }).format(recovery.costAmount)} ${recovery.costCurrency}`
  }
  if (recovery.status === 'CANCELLED' || recovery.status === 'NO_SHOW') return 'Sin costo informado'
  return 'Costo pendiente de informar'
}

export function StudentOnlineRecoveries({ recoveries }: { recoveries: OnlineRecoverySummary[] }) {
  if (recoveries.length === 0) return null

  return (
    <section className="rounded-xl border border-edge bg-surface-2 p-5 shadow-sm">
      <div className="flex items-start gap-3 border-b border-edge pb-4">
        <Video aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <h3 className="text-base font-bold text-ink">Reposiciones online</h3>
          <p className="mt-1 text-xs text-ink-3">
            Clases de 35 min acordadas con administración para reponer faltas 3.ª+ del mes.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
          {recoveries.map((recovery) => {
            const meta = STATUS_META[recovery.status]
            return (
              <li className="rounded-lg border border-edge bg-surface-1 px-3 py-3" key={recovery.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                    <CalendarClock aria-hidden="true" className="size-4 text-accent" />
                    {formatDateTime(recovery.scheduledAt)}
                  </span>
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
                  {recovery.instructorName && <span className="text-xs text-ink-3">con {recovery.instructorName}</span>}
                </div>

                <p className="mt-1 text-xs text-ink-4">
                  Falta del {formatCalendarDate(recovery.absenceDate)}
                  {recovery.className ? ` · ${recovery.className}` : ''} · {recovery.durationMinutes} min
                </p>

                <p className={`mt-1 text-xs ${recovery.costAmount == null ? 'text-ink-4' : 'text-ink-2'}`}>
                  {formatCost(recovery)}
                  {recovery.costNote ? ` · ${recovery.costNote}` : ''}
                </p>

                {recovery.status === 'SCHEDULED' && recovery.meetingUrl && isHttpUrl(recovery.meetingUrl) && (
                  <a
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                    href={recovery.meetingUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    Entrar a la videollamada
                  </a>
                )}

                {recovery.status === 'COMPLETED' && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-ok-text">
                    <CheckCircle2 aria-hidden="true" className="size-3" />
                    Clase registrada. La falta fue repuesta.
                  </p>
                )}

                {recovery.status === 'CANCELLED' && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-4">
                    <XCircle aria-hidden="true" className="size-3" />
                    {recovery.absenceRecovered
                      ? 'Cancelada. La falta fue repuesta en otro horario.'
                      : 'Cancelada. La falta sigue pendiente.'}
                  </p>
                )}

                {recovery.status === 'NO_SHOW' && (
                  <p className={`mt-1 flex items-center gap-1 text-[11px] ${recovery.absenceRecovered ? 'text-ok-text' : 'text-danger-text'}`}>
                    <Clock3 aria-hidden="true" className="size-3" />
                    {recovery.absenceRecovered
                      ? 'No asististe, pero la falta fue repuesta en otro horario.'
                      : 'No asististe. La falta sigue pendiente.'}
                  </p>
                )}

                {recovery.notes && <p className="mt-1 text-[11px] text-ink-4">{recovery.notes}</p>}
              </li>
            )
          })}
      </ul>
    </section>
  )
}
