'use client'

import { AlertTriangle, Award, CalendarDays, CheckCircle2, Clock, Shield } from 'lucide-react'
import type { GradoProgressData, GradoMetric } from '@/types/dashboard'

interface GradoProgressProps {
    grado: GradoProgressData
    className?: string
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
    const monthsPercent = percent(grado.monthsInRank, grado.minMonths)
    const hoursReq = grado.hoursRequirement
    const currentPeriod = grado.currentPeriod
    const classPercent = currentPeriod && currentPeriod.capacitySessions > 0
        ? percent(currentPeriod.classSessions, currentPeriod.capacitySessions)
        : 100
    const hoursGoal = hoursReq?.effectiveRequiredHours ?? hoursReq?.requiredHours ?? null
    const hoursPercent = hoursReq && hoursGoal != null
        ? percent(hoursReq.classHours, hoursGoal)
        : 100
    const hoursDetail = hoursReq
        ? hoursReq.exempt
            ? `${hoursReq.classHours} h de clase · plan exento`
            : `${hoursReq.classHours} de ${hoursGoal} h · extra ${hoursReq.extraHours} h${hoursReq.creditHours > 0 ? ` · crédito ${hoursReq.creditHours} h` : ''}`
        : ''

    const metrics = [
        {
            label: 'Katas oficiales',
            detail: grado.requiredKatas > 0 ? `${grado.approvedKatas} de ${grado.requiredKatas} aprobadas` : 'Sin katas configuradas',
            value: grado.requiredKatas > 0 ? kataPercent : 100,
        },
        {
            label: 'Asistencia (clases)',
            detail: `${currentPeriod?.classSessions ?? 0} de ${currentPeriod?.capacitySessions ?? 0} clases`,
            value: classPercent,
        },
        {
            label: 'Permanencia en grado',
            detail: `${grado.monthsInRank} de ${grado.minMonths} meses${grado.monthsInRankEstimated ? ' (estimado)' : ''}`,
            value: monthsPercent,
        },
        ...(hoursReq
            ? [{
                label: 'Horas de tatami',
                detail: hoursDetail,
                value: hoursPercent,
            }]
            : []),
    ]

    return (
        <section className={`rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-lg ${className}`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Progreso de grado</p>
                    <h2 className="mt-1 text-lg font-bold text-white">
                        {grado.currentRankName ?? 'Grado actual'} <span className="text-neutral-500">a</span>{' '}
                        {grado.nextRankName ?? 'siguiente grado'}
                    </h2>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2">
                    <span
                        aria-hidden="true"
                        className="h-4 w-12 rounded-sm border border-white/30"
                        style={{ backgroundColor: grado.beltColor ?? '#eab308' }}
                    />
                    <span className="text-xs text-neutral-300">{grado.overallPercent}% preparado</span>
                </div>
            </div>

            <div className="mt-5 space-y-4">
                {metrics.map((metric) => (
                    <div key={metric.label}>
                        <div className="mb-1.5 flex justify-between gap-3 text-xs">
                            <span className="font-medium text-neutral-200">{metric.label}</span>
                            <span className="text-neutral-400">
                                {metric.detail} <b className="text-cyan-300">{metric.value}%</b>
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#0d1117]">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-700"
                                style={{ width: `${metric.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {grado.nextExam && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                    <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-amber-400" />
                    <p className="text-xs text-neutral-300">
                        <span className="font-bold text-amber-200">{grado.nextExam.cuatrimestreLabel}</span> · Convocatoria{' '}
                        {grado.nextExam.tentative ? 'tentativa' : 'confirmada'}:{' '}
                        <span className="font-semibold text-white">{formatDate(grado.nextExam.date)}</span>
                    </p>
                    <span className="rounded-full border border-neutral-700 bg-[#0d1117] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                        {grado.nextExam.examDay === 'SATURDAY' ? 'Sábado' : 'Domingo'}
                    </span>
                </div>
            )}

            {grado.cuatrimestres.length > 0 && (
                <div className="mt-5 border-t border-neutral-800 pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Meta por cuatrimestre</p>
                        <span className="text-[10px] text-neutral-500">Máximo {grado.maxAbsencesPerMonth} inasistencias por mes</span>
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
                                    className={`rounded-md border p-3 ${cuatrimestre.isCurrent ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-neutral-800 bg-[#0d1117]'}`}
                                    key={`${cuatrimestre.year}-${cuatrimestre.index}`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-white">
                                            {cuatrimestre.label}
                                            {cuatrimestre.isCurrent && (
                                                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">En curso</span>
                                            )}
                                        </p>
                                        {cuatrimestre.examDate && (
                                            <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                                                <CalendarDays aria-hidden="true" className="size-3.5 text-amber-400" />
                                                Examen {cuatrimestre.examTentative ? 'tentativo' : 'confirmado'}: {formatDate(cuatrimestre.examDate)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-3">
                                        <div>
                                            <div className="flex justify-between text-neutral-400">
                                                <span>Katas</span>
                                                <span className="font-semibold text-white">{cuatrimestre.approvedKatas}/{cuatrimestre.expectedKatas}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#161b22]">
                                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${katasTarget}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-neutral-400">
                                                <span>Clases</span>
                                                <span className="font-semibold text-white">{cuatrimestre.classSessions}/{cuatrimestre.capacitySessions}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#161b22]">
                                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${classTarget}%` }} />
                                            </div>
                                            <p className="mt-1 text-neutral-500">
                                                {cuatrimestre.extraHours > 0 || cuatrimestre.extraClasses > 0
                                                    ? `${cuatrimestre.extraHours} h extra · ${cuatrimestre.extraClasses} clases extra`
                                                    : 'Sin entrenamiento extra'}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-neutral-400">
                                                <span>Inasistencia (máx. mes)</span>
                                                <span className={`font-semibold ${cuatrimestre.exceededAbsenceLimit ? 'text-red-400' : 'text-white'}`}>
                                                    {cuatrimestre.maxMonthAbsences}/{grado.maxAbsencesPerMonth}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-neutral-500">
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
                <div className="mt-5 flex items-center gap-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-100">
                    <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-red-400" />
                    <div>
                        <p className="text-sm font-bold">Derecho a examen suspendido</p>
                        <p className="text-xs opacity-80">Superaste el máximo de {grado.maxAbsencesPerMonth} faltas en un mes. Regulariza tu asistencia o recupera clases.</p>
                    </div>
                </div>
            ) : (
                <div
                    className={`mt-5 flex items-center gap-3 rounded-md border p-3 ${
                        grado.isEligible
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                            : 'border-neutral-700 bg-[#0d1117] text-neutral-300'
                    }`}
                >
                    {grado.isEligible ? (
                        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-emerald-400" />
                    ) : (
                        <Shield aria-hidden="true" className="size-5 shrink-0 text-cyan-400" />
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
                    {grado.isEligible && <Award aria-hidden="true" className="ml-auto size-6 text-emerald-400" />}
                </div>
            )}

            {grado.monthsInRankEstimated && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Clock aria-hidden="true" className="size-3.5" /> La permanencia se estima desde tu matrícula porque no hay un ascenso registrado para este grado.
                </p>
            )}
        </section>
    )
}
