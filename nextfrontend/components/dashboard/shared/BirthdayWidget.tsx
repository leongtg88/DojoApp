import { CakeSlice } from 'lucide-react'
import type { DashboardBirthday } from '@/types/dashboard'

interface BirthdayWidgetProps {
    birthdays: DashboardBirthday[]
}

export function BirthdayWidget({ birthdays }: BirthdayWidgetProps) {
    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long' })

    return (
        <section className="mt-7 rounded-lg border border-cyan-900/50 bg-[#161b22] p-5">
            <div className="flex items-center gap-3">
                <CakeSlice aria-hidden="true" className="size-5 text-cyan-400" />
                <div>
                    <h2 className="font-display text-lg font-bold text-white">Próximos cumpleaños</h2>
                    <p className="mt-1 text-sm text-neutral-400">Alumnos activos que cumplen años en los próximos 30 días.</p>
                </div>
            </div>
            {birthdays.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-400">No hay cumpleaños próximos.</p>
            ) : (
                <ul className="mt-4 divide-y divide-neutral-800 rounded-md border border-neutral-800 bg-[#0d1117]">
                    {birthdays.map((birthday) => (
                        <li className="flex items-center justify-between gap-3 px-4 py-3" key={birthday.id}>
                            <div>
                                <p className="text-sm font-semibold text-white">{birthday.name}</p>
                                <p className="mt-1 text-xs text-neutral-400">{formatter.format(new Date(birthday.dateOfBirth))}</p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-amber-300">{birthday.daysUntil === 0 ? 'Hoy' : `${birthday.daysUntil} días`}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}