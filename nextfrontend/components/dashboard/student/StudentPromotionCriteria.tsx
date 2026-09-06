import { CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react'
import type { AttendanceSummary, StudentTechnique } from '@/types/dashboard'

interface StudentPromotionCriteriaProps {
    attendance: AttendanceSummary
    techniques: StudentTechnique[]
}

export function StudentPromotionCriteria({ attendance, techniques }: StudentPromotionCriteriaProps) {
    const approvedTechniques = techniques.filter(({ status }) => status === 'APPROVED').length
    const totalTechniques = techniques.length
    const criteria = [
        { icon: ClipboardCheck, label: 'Programa técnico', detail: `${approvedTechniques} de ${totalTechniques} técnicas aprobadas`, complete: totalTechniques > 0 && approvedTechniques === totalTechniques },
        { icon: ShieldCheck, label: 'Asistencia registrada', detail: `${attendance.percentage}% de asistencia`, complete: attendance.totalSessions > 0 && attendance.percentage >= 80 },
    ]

    return (
        <section className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Preparación de grado</p><h2 className="mt-1 font-display text-lg font-bold text-white">Criterios registrados</h2></div><span className="rounded-md border border-neutral-700 bg-[#0d1117] px-2.5 py-1 text-xs font-bold text-neutral-300">{criteria.filter(({ complete }) => complete).length} / {criteria.length}</span></div>
            <ul className="mt-4 divide-y divide-neutral-800">{criteria.map(({ complete, detail, icon: Icon, label }) => <li className="flex items-center gap-3 py-3" key={label}><span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${complete ? 'bg-emerald-500/15 text-emerald-300' : 'bg-cyan-500/10 text-cyan-300'}`}><Icon aria-hidden="true" className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">{label}</p><p className="text-xs text-neutral-400">{detail}</p></div>{complete && <CheckCircle2 aria-label="Completado" className="size-4 shrink-0 text-emerald-400" />}</li>)}</ul>
            <p className="mt-3 text-xs leading-5 text-neutral-500">Los requisitos específicos de antigüedad y examen se confirmarán con tu instructor.</p>
        </section>
    )
}