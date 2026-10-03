import type { AdminScheduleSummary } from '@/types/dashboard'

interface AdminExpectedControlsProps {
    classes: AdminScheduleSummary[]
    selectedClassId: string | null
    date: string
    hasRoster: boolean
}

export function AdminExpectedControls({ classes, selectedClassId, date, hasRoster }: AdminExpectedControlsProps) {
    const activeClasses = classes.filter((scheduledClass) => scheduledClass.active)

    return (
        <section className="rounded-lg border border-edge bg-surface-2 shadow-sm">
            <div className="border-b border-edge p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Esperados vs registrados</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">Asistencia esperada</h2>
                <p className="mt-1 text-sm text-ink-3">Elige una fecha y una clase para ver qué alumnos activos tienen registro y quiénes no marcaron.</p>
            </div>

            <form className="flex flex-wrap items-end gap-3 p-5" method="get">
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="expected-date">
                    Fecha
                    <input
                        className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                        defaultValue={date}
                        id="expected-date"
                        name="date"
                        type="date"
                    />
                </label>
                <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-semibold text-ink" htmlFor="expected-class">
                    Clase
                    <select
                        className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500"
                        defaultValue={selectedClassId ?? ''}
                        id="expected-class"
                        name="classId"
                    >
                        {activeClasses.length === 0 && <option value="">Sin clases activas</option>}
                        {activeClasses.map((scheduledClass) => (
                            <option key={scheduledClass.id} value={scheduledClass.id}>
                                {scheduledClass.name} · {scheduledClass.branchName}
                            </option>
                        ))}
                    </select>
                </label>
                <button className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117]" type="submit">Ver asistencia</button>
            </form>

            {!hasRoster && (
                <p className="border-t border-edge px-5 py-4 text-sm text-ink-3">Selecciona una clase con alumnos activos para ver la lista esperada.</p>
            )}
        </section>
    )
}
