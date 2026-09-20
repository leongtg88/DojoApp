import { CheckCircle2, Clock, History } from 'lucide-react'
import { formatHoursHM } from '@/lib/dashboard/balance'
import type { GradoProgressData } from '@/types/dashboard'

interface ExaminationCriteriaCardProps {
    grado: GradoProgressData
}

export function ExaminationCriteriaCard({ grado }: ExaminationCriteriaCardProps) {
    const missingMonths = Math.max(0, grado.minMonths - grado.monthsInRank)
    const monthsOk = grado.monthsInRank >= grado.minMonths
    const hoursReq = grado.hoursRequirement
    const currentPeriod = grado.currentPeriod
    const hoursGoal = hoursReq?.effectiveRequiredHours ?? hoursReq?.requiredHours ?? null
    const hoursPending = hoursReq && hoursGoal != null
        ? Math.max(0, hoursGoal - hoursReq.classHours)
        : 0
    const hasCredit = (hoursReq?.creditHours ?? 0) > 0
    const monthBreakdown = currentPeriod && currentPeriod.monthAbsences.length > 0
        ? currentPeriod.monthAbsences.map((month) => `${month.label}: ${month.count}/${month.max}`).join(' · ')
        : 'Sin inasistencias'

    return (
        <section className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Criterios de postulación</p>
                    <h2 className="mt-1 font-display text-lg font-bold text-white">Requisitos de examen de grado</h2>
                </div>
                <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
                    {grado.nextRankName ?? 'Convocatoria próxima'}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Asistencia</span>
                        <CheckCircle2 aria-hidden="true" className="size-4 text-neutral-600" />
                    </div>
                    <p className="mt-3 font-display text-2xl font-extrabold text-white">
                        {currentPeriod?.classSessions ?? 0}
                        <span className="text-xs font-normal text-neutral-400"> / {currentPeriod?.capacitySessions ?? 0} clases</span>
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">{monthBreakdown}</p>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Tatami</span>
                        <Clock aria-hidden="true" className={`size-4 ${hoursReq && hoursGoal != null && !hoursReq.met ? 'text-amber-400' : 'text-cyan-400'}`} />
                    </div>
                    {hoursReq && hoursGoal != null ? (
                        <>
                            <p className="mt-3 font-display text-2xl font-extrabold text-white">
                                {formatHoursHM(hoursReq.classHours)}
                                <span className="text-xs font-normal text-neutral-400"> / {formatHoursHM(hoursGoal)} h</span>
                            </p>
                            <p className={`mt-1 text-xs ${hoursReq.met ? 'text-emerald-300' : 'text-amber-300'}`}>
                                {hoursReq.met
                                    ? hasCredit ? `Cumplido · crédito ${formatHoursHM(hoursReq.creditHours)}` : 'Mínimo del plan cumplido'
                                    : `Reponer ${formatHoursHM(hoursPending)} para el examen`}
                            </p>
                            <p className="mt-1 text-[11px] text-neutral-500">extra ponderable {formatHoursHM(hoursReq.extraHours)}</p>
                        </>
                    ) : (
                        <>
                            <p className="mt-3 font-display text-2xl font-extrabold text-white">
                                {hoursReq ? hoursReq.classHours : currentPeriod?.classHours ?? 0}
                                <span className="text-xs font-normal text-neutral-400"> h de clase</span>
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">Plan sin mínimo de horas de tatami</p>
                        </>
                    )}
                </div>

                <div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Permanencia</span>
                        <History aria-hidden="true" className={`size-4 ${monthsOk ? 'text-emerald-400' : 'text-neutral-600'}`} />
                    </div>
                    <p className="mt-3 font-display text-2xl font-extrabold text-white">
                        {grado.monthsInRank}
                        <span className="text-xs font-normal text-neutral-400"> / {grado.minMonths} meses</span>
                    </p>
                    <p className={`mt-1 text-xs ${monthsOk ? 'text-emerald-300' : 'text-neutral-500'}`}>
                        {monthsOk ? 'Permanencia mínima cumplida' : `Restan ~${missingMonths} meses`}
                    </p>
                </div>
            </div>

            <p className="mt-4 flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2.5 text-xs text-neutral-400">
                <CheckCircle2 aria-hidden="true" className={`size-4 shrink-0 ${grado.isEligible ? 'text-emerald-400' : grado.examRightLost ? 'text-red-400' : 'text-cyan-400'}`} />
                {grado.examRightLost
                    ? `Derecho a examen suspendido: superaste el máximo de ${grado.maxAbsencesPerMonth} inasistencias en un mes.`
                    : grado.isEligible
                        ? 'Registro activo: ya puedes solicitar tu mesa de examen con el instructor.'
                        : grado.nextExam
                            ? `En preparación regular. Próxima convocatoria: ${new Date(grado.nextExam.date).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                            : 'En preparación regular. Los requisitos específicos del examen se confirman con tu instructor.'}
            </p>
        </section>
    )
}