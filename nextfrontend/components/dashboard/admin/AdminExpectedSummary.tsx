import { AlertTriangle } from 'lucide-react'
import type { AdminExpectedAttendanceRoster } from '@/types/dashboard'

interface AdminExpectedSummaryProps {
    roster: AdminExpectedAttendanceRoster
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
})

export function AdminExpectedSummary({ roster }: AdminExpectedSummaryProps) {
    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="grid grid-cols-3 gap-3 p-5">
                <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Registros auditados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.audited}</p></article>
                <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Esperados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.expected}</p></article>
                <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Registrados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.registered}</p></article>
                <article className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ok-text">Presentes</p><p className="mt-1 text-xl font-bold text-ok-text">{roster.summary.present}</p></article>
                <article className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-danger-text">Ausentes</p><p className="mt-1 text-xl font-bold text-danger-text">{roster.summary.absent}</p></article>
                <article className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-warn-text">Sin registro</p><p className="mt-1 text-xl font-bold text-warn-text">{roster.summary.noRecord}</p></article>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3 border-t border-edge px-5 py-4">
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
        </section>
    )
}
