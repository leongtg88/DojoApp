import { AttendanceScheduleFilter, type AttendanceScheduleGroup } from '@/components/dashboard/shared/AttendanceScheduleFilter'

interface AdminExpectedControlsProps {
    groups: AttendanceScheduleGroup[]
    selectedClassId: string | null
    dateLabel: string
    defaultDate: string | null
    overrideDate: string | null
    dayMatches: boolean
    classDayLabel: string | null
    hasRoster: boolean
}

export function AdminExpectedControls({
    groups,
    selectedClassId,
    dateLabel,
    defaultDate,
    overrideDate,
    dayMatches,
    classDayLabel,
    hasRoster,
}: AdminExpectedControlsProps) {
    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="border-b border-edge p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Esperados vs registrados</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">Asistencia esperada</h2>
                <p className="mt-1 text-xs text-ink-3">Elige una clase para ver qué alumnos activos tienen registro y quiénes no. La fecha se toma de la sesión de la clase; puedes cargar otra fecha si lo necesitas.</p>
            </div>

            <div className="p-5">
                <AttendanceScheduleFilter
                    basePath="/dashboard/admin/asistencia"
                    classDayLabel={classDayLabel}
                    dateLabel={dateLabel}
                    dayMatches={dayMatches}
                    defaultDate={defaultDate}
                    groups={groups}
                    overrideDate={overrideDate}
                    selectedClassId={selectedClassId}
                />
            </div>

            {!hasRoster && (
                <p className="border-t border-edge px-5 py-4 text-xs text-ink-3">Selecciona una clase con alumnos activos para ver la lista esperada.</p>
            )}
        </section>
    )
}
