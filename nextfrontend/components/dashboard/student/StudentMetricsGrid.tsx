import Link from 'next/link'
import { CalendarCheck2, ClipboardCheck, Star } from 'lucide-react'
import type { AttendanceSummary, GradoProgressData, StudentTechnique } from '@/types/dashboard'

interface StudentMetricsGridProps {
    attendance: AttendanceSummary
    techniques: StudentTechnique[]
    grado?: GradoProgressData | null
}

export function StudentMetricsGrid({ attendance, techniques, grado = null }: StudentMetricsGridProps) {
    const approvedTechniques = techniques.filter(({ status }) => status === 'APPROVED').length
    const evaluatedScores = techniques.flatMap(({ evaluation }) => (evaluation ? [evaluation.score] : []))
    const averageScore = evaluatedScores.length === 0 ? null : Math.round((evaluatedScores.reduce((total, score) => total + score, 0) / evaluatedScores.length) * 10) / 10

    const attendanceSummary = grado?.attendance ?? attendance

    const attendanceValue = `${attendanceSummary.attendedSessions} de ${attendanceSummary.totalSessions}`
    const attendanceDetail = `${attendanceSummary.percentage}% del grado${grado && grado.pendingSessions > 0 ? ` · ${grado.pendingSessions} por confirmar` : ''}`

    const cards = [
        { href: '/dashboard/estudiante/asistencia', icon: CalendarCheck2, label: 'Asistencia', value: attendanceValue, detail: attendanceDetail },
        { href: '/dashboard/estudiante/progreso', icon: ClipboardCheck, label: 'Técnicas listas', value: `${approvedTechniques} / ${techniques.length}`, detail: 'Progreso del programa' },
        { href: '/dashboard/estudiante/progreso', icon: Star, label: 'Nota promedio', value: averageScore === null ? '—' : `${averageScore} / 10`, detail: 'Evaluaciones del sensei' },
    ]

    return (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ detail, href, icon: Icon, label, value }) => (
                <Link className="rounded-lg border border-edge bg-surface-2 p-4 shadow-sm transition-colors hover:border-cyan-500/40 hover:bg-surface-3" href={href} key={label}>
                    <div className="flex items-center justify-between text-accent"><Icon aria-hidden="true" className="size-4" /><span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span></div>
                    <p className="mt-5 font-display text-3xl font-extrabold text-ink">{value}</p>
                    <p className="mt-1 text-xs text-ink-3">{detail}</p>
                </Link>
            ))}
        </section>
    )
}