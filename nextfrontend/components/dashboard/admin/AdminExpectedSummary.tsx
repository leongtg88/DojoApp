import type { AdminExpectedAttendanceRoster } from '@/types/dashboard'

interface AdminExpectedSummaryProps {
    roster: AdminExpectedAttendanceRoster
}

export function AdminExpectedSummary({ roster }: AdminExpectedSummaryProps) {
    return (
        <section className="grid grid-cols-3 gap-3 rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
            <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Registros auditados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.audited}</p></article>
            <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Esperados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.expected}</p></article>
            <article className="rounded-lg border border-edge bg-surface-1 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Registrados</p><p className="mt-1 text-xl font-bold text-ink">{roster.summary.registered}</p></article>
            <article className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ok-text">Presentes</p><p className="mt-1 text-xl font-bold text-ok-text">{roster.summary.present}</p></article>
            <article className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-danger-text">Ausentes</p><p className="mt-1 text-xl font-bold text-danger-text">{roster.summary.absent}</p></article>
            <article className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-warn-text">Sin registro</p><p className="mt-1 text-xl font-bold text-warn-text">{roster.summary.noRecord}</p></article>
        </section>
    )
}
