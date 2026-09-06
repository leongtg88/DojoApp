'use client'

import { Award, CheckCircle2, Shield } from 'lucide-react'
import type { GradoProgressData } from '@/types/dashboard'

interface GradoProgressProps {
    grado: GradoProgressData
    className?: string
}

const percent = (value: number, goal: number) => (goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100)

export function GradoProgress({ grado, className = '' }: GradoProgressProps) {
    const kataPercent = percent(grado.approvedKatas, grado.requiredKatas)
    const attendancePercent = percent(grado.attendance.percentage, grado.minAttendancePercent)
    const monthsPercent = percent(grado.monthsInRank, grado.minMonths)

    const metrics = [
        { label: 'Katas oficiales', detail: `${grado.approvedKatas} de ${grado.requiredKatas} aprobadas`, value: kataPercent },
        { label: 'Asistencias', detail: `${grado.attendance.percentage}% (mín. ${grado.minAttendancePercent}%)`, value: attendancePercent },
        { label: 'Permanencia en grado', detail: `${grado.monthsInRank} de ${grado.minMonths} meses`, value: monthsPercent },
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
                            : 'Completa las tres metas para solicitar tu evaluación.'}
                    </p>
                </div>
                {grado.isEligible && <Award aria-hidden="true" className="ml-auto size-6 text-emerald-400" />}
            </div>
        </section>
    )
}