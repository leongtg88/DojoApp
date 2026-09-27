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
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
            {cards.map(({ detail, href, icon: Icon, label, value }) => (
                <Link className="rounded-lg border border-edge bg-surface-2 p-3 shadow-sm transition-colors hover:border-cyan-500/40 hover:bg-surface-3 sm:p-4" href={href} key={label}>
                    <div className="flex flex-col gap-1.5 text-accent sm:flex-row sm:items-center sm:justify-between"><Icon aria-hidden="true" className="size-4 shrink-0" /><span className="text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-[11px]">{label}</span></div>
                    <p className="mt-3 font-display text-xl font-extrabold text-ink sm:mt-5 sm:text-3xl">{value}</p>
                    <p className="mt-1 text-[11px] text-ink-3 sm:text-xs">{detail}</p>
                </Link>
            ))}
        </section>
    )
}