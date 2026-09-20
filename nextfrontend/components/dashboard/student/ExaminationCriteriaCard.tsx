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
        <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-edge pb-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Criterios de postulación</p>
                    <h2 className="mt-1 font-display text-lg font-bold text-ink">Requisitos de examen de grado</h2>
                </div>
                <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-warn-text">
                    {grado.nextRankName ?? 'Convocatoria próxima'}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-edge bg-surface-1 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-3">Asistencia</span>
                        <CheckCircle2 aria-hidden="true" className="size-4 text-ink-4" />
                    </div>
                    <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                        {currentPeriod?.classSessions ?? 0}
                        <span className="text-xs font-normal text-ink-3"> / {currentPeriod?.capacitySessions ?? 0} clases</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-4">{monthBreakdown}</p>
                </div>

                <div className="rounded-lg border border-edge bg-surface-1 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-3">Tatami</span>
                        <Clock aria-hidden="true" className={`size-4 ${hoursReq && hoursGoal != null && !hoursReq.met ? 'text-warn-text' : 'text-accent'}`} />
                    </div>
                    {hoursReq && hoursGoal != null ? (
                        <>
                            <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                                {formatHoursHM(hoursReq.classHours)}
                                <span className="text-xs font-normal text-ink-3"> / {formatHoursHM(hoursGoal)} h</span>
                            </p>
                            <p className={`mt-1 text-xs ${hoursReq.met ? 'text-ok-text' : 'text-warn-text'}`}>
                                {hoursReq.met
                                    ? hasCredit ? `Cumplido · crédito ${formatHoursHM(hoursReq.creditHours)}` : 'Mínimo del plan cumplido'
                                    : `Reponer ${formatHoursHM(hoursPending)} para el examen`}
                            </p>
                            <p className="mt-1 text-[11px] text-ink-4">extra ponderable {formatHoursHM(hoursReq.extraHours)}</p>
                        </>
                    ) : (
                        <>
                            <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                                {hoursReq ? hoursReq.classHours : currentPeriod?.classHours ?? 0}
                                <span className="text-xs font-normal text-ink-3"> h de clase</span>
                            </p>
                            <p className="mt-1 text-xs text-ink-4">Plan sin mínimo de horas de tatami</p>
                        </>
                    )}
                </div>

                <div className="rounded-lg border border-edge bg-surface-1 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-3">Permanencia</span>
                        <History aria-hidden="true" className={`size-4 ${monthsOk ? 'text-ok-text' : 'text-ink-4'}`} />
                    </div>
                    <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                        {grado.monthsInRank}
                        <span className="text-xs font-normal text-ink-3"> / {grado.minMonths} meses</span>
                    </p>
                    <p className={`mt-1 text-xs ${monthsOk ? 'text-ok-text' : 'text-ink-4'}`}>
                        {monthsOk ? 'Permanencia mínima cumplida' : `Restan ~${missingMonths} meses`}
                    </p>
                </div>
            </div>

            <p className="mt-4 flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3 py-2.5 text-xs text-ink-3">
                <CheckCircle2 aria-hidden="true" className={`size-4 shrink-0 ${grado.isEligible ? 'text-ok-text' : grado.examRightLost ? 'text-danger-text' : 'text-accent'}`} />
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