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
                <Link className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm transition-colors hover:bg-[#fffaf0]" href={href} key={label}>
                    <div className="flex items-center justify-between text-[#666028]"><Icon aria-hidden="true" className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span></div>
                    <p className="mt-5 font-display text-3xl font-extrabold text-[#1c1b1b]">{value}</p>
                    <p className="mt-1 text-xs text-[#5c403c]">{detail}</p>
                </Link>
            ))}
        </section>
    )
}