import { CalendarCheck2, CircleX } from 'lucide-react'
import type { StudentAttendanceRecord } from '@/types/dashboard'

interface StudentAttendanceHistoryProps {
    records: StudentAttendanceRecord[]
}

export function StudentAttendanceHistory({ records }: StudentAttendanceHistoryProps) {
    const formatter = new Intl.DateTimeFormat('es-DO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Mi asistencia</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Historial de entrenamientos</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Registro de sesiones marcadas por tu instructor.</p>

            {records.length === 0 ? (
                <section className="mt-7 border border-[#e5e2e1] bg-white px-5 py-10 text-center">
                    <CalendarCheck2 aria-hidden="true" className="mx-auto size-7 text-[#a1918e]" />
                    <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">Aún no hay asistencias registradas.</p>
                </section>
            ) : (
                <section className="mt-7 overflow-hidden border border-[#e5e2e1] bg-white">
                    <ul className="divide-y divide-[#e5e2e1]">
                        {records.map((record) => (
                            <li className="flex items-start justify-between gap-4 px-5 py-4" key={record.id}>
                                <div className="flex min-w-0 gap-3">
                                    {record.present ? (
                                        <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#5b7f38]" />
                                    ) : (
                                        <CircleX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#b70011]" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#1c1b1b]">{record.className}</p>
                                        <p className="mt-1 text-xs text-[#5c403c]">{formatter.format(new Date(record.date))}</p>
                                        {record.notes && <p className="mt-2 text-sm text-[#5c403c]">{record.notes}</p>}
                                    </div>
                                </div>
                                <span className={`shrink-0 text-xs font-semibold ${record.present ? 'text-[#5b7f38]' : 'text-[#b70011]'}`}>
                                    {record.present ? 'Presente' : 'Ausente'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </main>
    )
}