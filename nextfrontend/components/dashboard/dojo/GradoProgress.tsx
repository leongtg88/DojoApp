'use client'

import { AlertTriangle, Award, CalendarDays, CheckCircle2, Clock, Shield } from 'lucide-react'
import { formatHoursHM } from '@/lib/dashboard/balance'
import type { GradoProgressData, GradoMetric } from '@/types/dashboard'

interface GradoProgressProps {
    grado: GradoProgressData
    className?: string
}

interface MetricSegment {
    value: number
    color: string
    legend: string
}

interface MetricItem {
    label: string
    detail: string
    value: number
    segments?: MetricSegment[]
}

const percent = (value: number, goal: number) => (goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100)

const BOTTLENECK_LABEL: Record<GradoMetric, string> = {
    KATAS: 'Faltan katas por aprobar',
    PERMANENCIA: 'Falta permanencia en el grado',
    HORAS: 'Faltan horas de tatami por reponer',
}

function formatDate(value: string | null): string {
    if (!value) return 'Sin fecha'
    return new Date(value).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function GradoProgress({ grado, className = '' }: GradoProgressProps) {
    const kataPercent = percent(grado.approvedKatas, grado.requiredKatas)
    const hoursReq = grado.hoursRequirement
    const attendance = grado.attendance
    const attendancePercent = attendance.totalSessions > 0
        ? Math.min(100, Math.round((attendance.attendedSessions / attendance.totalSessions) * 100))
        : 0
    const hoursGoal = hoursReq?.effectiveRequiredHours ?? hoursReq?.requiredHours ?? null
    const hoursPercent = hoursReq && hoursGoal != null
        ? percent(hoursReq.totalHours, hoursGoal)
        : 100

    const tatamiHours = hoursReq?.classHours ?? 0
    const libreHours = hoursReq?.libreHours ?? 0
    const totalHours = hoursReq?.totalHours ?? 0
    const hoursExempt = hoursReq?.exempt ?? true

    // Segmentos de la barra apilada de horas de entrenamiento. Si hay meta del
    // plan, los anchos son relativos a la meta (con tope 100%); si el plan está
    // exento, relativos al total acumulado.
    const hoursScale = hoursGoal != null ? hoursGoal : Math.max(totalHours, 1)
    const tatamiWidth = Math.min(100, (tatamiHours / hoursScale) * 100)
    const libreWidth = Math.max(0, Math.min(100 - tatamiWidth, (libreHours / hoursScale) * 100))

    const hoursDetail = hoursReq
        ? hoursExempt
            ? `${formatHoursHM(totalHours)} total (tatami ${formatHoursHM(tatamiHours)} + libre ${formatHoursHM(libreHours)}) · plan sin mínimo`
            : `${formatHoursHM(totalHours)} total (tatami ${formatHoursHM(tatamiHours)} + libre ${formatHoursHM(libreHours)}) de ${formatHoursHM(hoursGoal ?? 0)} meta${hoursReq.creditHours > 0 ? ` · crédito ${formatHoursHM(hoursReq.creditHours)}` : ''}`
        : ''

    const metrics: MetricItem[] = [
        {
            label: 'Katas oficiales',
            detail: grado.requiredKatas > 0 ? `${grado.approvedKatas} de ${grado.requiredKatas} aprobadas` : 'Sin katas configuradas',
            value: grado.requiredKatas > 0 ? kataPercent : 100,
        },
        {
            label: 'Asistencia',
            detail: `${attendance.attendedSessions} de ${attendance.totalSessions} clases${grado.pendingSessions > 0 ? ` · ${grado.pendingSessions} por confirmar` : ''}`,
            value: attendancePercent,
        },
        ...(hoursReq
            ? [{
                label: 'Horas de entrenamiento',
                detail: hoursDetail,
                value: hoursPercent,
                segments: [
                    { value: tatamiWidth, color: 'bg-gradient-to-r from-cyan-500 to-emerald-500', legend: 'Tatami' },
                    { value: libreWidth, color: 'bg-violet-500', legend: 'Libre' },
                ],
            }]
            : []),
    ]

    return (
        <section className={`rounded-lg border border-edge bg-surface-2 p-5 shadow-lg ${className}`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">Progreso de grado</p>
                    <h2 className="mt-1 text-lg font-bold text-ink">
                        {grado.currentRankName ?? 'Grado actual'} <span className="text-ink-4">a</span>{' '}
                        {grado.nextRankName ?? 'siguiente grado'}
                    </h2>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3 py-2">
                    <span
                        aria-hidden="true"
                        className="h-4 w-12 rounded-sm border border-white/30"
                        style={{ backgroundColor: grado.beltColor ?? '#eab308' }}
                    />
                    <span className="text-xs text-ink-2">{grado.overallPercent}% preparado</span>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                {metrics.map((metric) => (
                    <div key={metric.label}>
                        <div className="mb-1.5 flex justify-between gap-3 text-xs">
                            <span className="font-medium text-ink">{metric.label}</span>
                            <span className="text-ink-3">
                                {metric.detail} <b className="text-accent">{metric.value}%</b>
                            </span>
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-1">
                            {metric.segments ? (
                                metric.segments.map((segment) => (
                                    <div
                                        className={`h-full ${segment.color} transition-all duration-700`}
                                        key={segment.legend}
                                        style={{ width: `${segment.value}%` }}
                                    />
                                ))
                            ) : (
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-700"
                                    style={{ width: `${metric.value}%` }}
                                />
                            )}
                        </div>
                        {metric.segments && (
                            <div className="mt-1.5 flex gap-3 text-[10px] text-ink-3">
                                {metric.segments.map((segment) => (
                                    <span className="flex items-center gap-1" key={segment.legend}>
                                        <span className={`size-2 rounded-full ${segment.color}`} />
                                        {segment.legend}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {grado.pendingSessions > 0 && (
                <div className="mt-5 flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-ink-2">
                    <Clock aria-hidden="true" className="size-4 shrink-0 text-warn-text" />
                    <p>
                        <span className="font-bold text-warn-text">{grado.pendingSessions}</span>{' '}
                        {grado.pendingSessions === 1 ? 'clase marcada pendiente' : 'clases marcadas pendientes'} de confirmar por tu sensei.{' '}
                        <span className="text-ink-4">El progreso ya cuenta; se ajusta si se rechaza.</span>
                    </p>
                </div>
            )}

            {grado.nextExam && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                    <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-warn-text" />
                    <p className="text-xs text-ink-2">
                        <span className="font-bold text-warn-text">{grado.nextExam.cuatrimestreLabel}</span> · Convocatoria{' '}
                        {grado.nextExam.tentative ? 'tentativa' : 'confirmada'}:{' '}
                        <span className="font-semibold text-ink">{formatDate(grado.nextExam.date)}</span>
                    </p>
                    <span className="rounded-full border border-edge-strong bg-surface-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">
                        {grado.nextExam.examDay === 'SATURDAY' ? 'Sábado' : 'Domingo'}
                    </span>
                </div>
            )}

            {grado.cuatrimestres.length > 0 && (
                <div className="mt-5 border-t border-edge pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-accent">Meta por cuatrimestre</p>
                        <span className="text-[10px] text-ink-4">Máximo {grado.maxAbsencesPerMonth} inasistencias por mes</span>
                    </div>
                    <ul className="mt-3 space-y-2">
                        {grado.cuatrimestres.map((cuatrimestre) => {
                            const katasTarget = cuatrimestre.expectedKatas > 0
                                ? Math.min(100, Math.round((cuatrimestre.approvedKatas / cuatrimestre.expectedKatas) * 100))
                                : 100
                            const classTarget = cuatrimestre.capacitySessions > 0
                                ? Math.min(100, Math.round((cuatrimestre.classSessions / cuatrimestre.capacitySessions) * 100))
                                : 100
                            return (
                                <li
                                    className={`rounded-md border p-3 ${cuatrimestre.isCurrent ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-edge bg-surface-1'}`}
                                    key={`${cuatrimestre.year}-${cuatrimestre.index}`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                            {cuatrimestre.label}
                                            {cuatrimestre.isCurrent && (
                                                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-text">En curso</span>
                                            )}
                                        </p>
                                        {cuatrimestre.examDate && (
                                            <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
                                                <CalendarDays aria-hidden="true" className="size-3.5 text-warn-text" />
                                                Examen {cuatrimestre.examTentative ? 'tentativo' : 'confirmado'}: {formatDate(cuatrimestre.examDate)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-3">
                                        <div>
                                            <div className="flex justify-between text-ink-3">
                                                <span>Katas</span>
                                                <span className="font-semibold text-ink">{cuatrimestre.approvedKatas}/{cuatrimestre.expectedKatas}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${katasTarget}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-ink-3">
                                                <span>Clases</span>
                                                <span className="font-semibold text-ink">{cuatrimestre.classSessions}/{cuatrimestre.capacitySessions}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${classTarget}%` }} />
                                            </div>
                                            <p className="mt-1 text-ink-4">
                                                {cuatrimestre.libreHours > 0 || cuatrimestre.extraClasses > 0
                                                    ? `${cuatrimestre.libreHours} h libre · ${cuatrimestre.extraClasses} clases extra`
                                                    : 'Sin entrenamiento libre'}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-ink-3">
                                                <span>Inasistencia (máx. mes)</span>
                                                <span className={`font-semibold ${cuatrimestre.exceededAbsenceLimit ? 'text-danger-text' : 'text-ink'}`}>
                                                    {cuatrimestre.maxMonthAbsences}/{grado.maxAbsencesPerMonth}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-ink-4">
                                                {cuatrimestre.absences} inasistencias en el cuatrimestre
                                                {cuatrimestre.excessMonth ? ` · excedió en ${cuatrimestre.excessMonth}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

            {grado.examRightLost ? (
                <div className="mt-5 flex items-center gap-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-danger-text">
                    <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-danger-text" />
                    <div>
                        <p className="text-sm font-bold">Derecho a examen suspendido</p>
                        <p className="text-xs opacity-80">Superaste el máximo de {grado.maxAbsencesPerMonth} faltas en un mes. Regulariza tu asistencia o recupera clases.</p>
                    </div>
                </div>
            ) : (
                <div
                    className={`mt-5 flex items-center gap-3 rounded-md border p-3 ${
                        grado.isEligible
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-ok-text'
                            : 'border-edge-strong bg-surface-1 text-ink-2'
                    }`}
                >
                    {grado.isEligible ? (
                        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-ok-text" />
                    ) : (
                        <Shield aria-hidden="true" className="size-5 shrink-0 text-accent" />
                    )}
                    <div>
                        <p className="text-sm font-bold">{grado.isEligible ? 'Elegible para Examen de Grado' : 'Preparación en curso'}</p>
                        <p className="text-xs opacity-80">
                            {grado.isEligible
                                ? 'Cumpliste los requisitos técnicos, de asistencia y permanencia.'
                                : grado.bottleneck
                                    ? BOTTLENECK_LABEL[grado.bottleneck]
                                    : 'Completa las metas del cuatrimestre para solicitar tu evaluación.'}
                        </p>
                    </div>
                    {grado.isEligible && <Award aria-hidden="true" className="ml-auto size-6 text-ok-text" />}
                </div>
            )}

            {grado.monthsInRankEstimated && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-4">
                    <Clock aria-hidden="true" className="size-3.5" /> La permanencia se estima desde tu matrícula porque no hay un ascenso registrado para este grado.
                </p>
            )}
        </section>
    )
}
