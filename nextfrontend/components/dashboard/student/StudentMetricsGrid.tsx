import Link from 'next/link'
import { CalendarCheck2, ClipboardCheck, Target } from 'lucide-react'
import type { AttendanceSummary, StudentTechnique } from '@/types/dashboard'

interface StudentMetricsGridProps {
    attendance: AttendanceSummary
    techniques: StudentTechnique[]
}

export function StudentMetricsGrid({ attendance, techniques }: StudentMetricsGridProps) {
    const approvedTechniques = techniques.filter(({ status }) => status === 'APPROVED').length
    const kataCount = techniques.filter(({ category }) => category === 'KATA').length
    const cards = [
        { href: '/dashboard/estudiante/asistencia', icon: CalendarCheck2, label: 'Asistencia', value: `${attendance.percentage}%`, detail: `${attendance.attendedSessions} de ${attendance.totalSessions} sesiones` },
        { href: '/dashboard/estudiante/progreso', icon: ClipboardCheck, label: 'Técnicas listas', value: `${approvedTechniques} / ${techniques.length}`, detail: 'Progreso del programa' },
        { href: '/dashboard/estudiante/progreso', icon: Target, label: 'Katas asignadas', value: String(kataCount), detail: 'Para practicar y evaluar' },
    ]

    return (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {cards.map(({ detail, href, icon: Icon, label, value }) => (
                <Link className="rounded-lg border border-neutral-800 bg-[#161b22] p-4 shadow-sm transition-colors hover:border-cyan-500/40 hover:bg-neutral-800" href={href} key={label}>
                    <div className="flex items-center justify-between text-cyan-400"><Icon aria-hidden="true" className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span></div>
                    <p className="mt-5 font-display text-3xl font-extrabold text-white">{value}</p>
                    <p className="mt-1 text-xs text-neutral-400">{detail}</p>
                </Link>
            ))}
        </section>
    )
}