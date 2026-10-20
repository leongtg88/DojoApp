import { CakeSlice } from 'lucide-react'
import { birthdayCountdown } from '@/lib/dashboard/birthdays'

interface StudentBirthdayCardProps {
    dateOfBirth: string
}

export function StudentBirthdayCard({ dateOfBirth }: StudentBirthdayCardProps) {
    const countdown = birthdayCountdown(dateOfBirth)
    if (!countdown) return null

    const { isToday, daysUntil, label } = countdown

    return (
        <aside className="mt-8 rounded-lg border border-cyan-900/50 bg-surface-2 p-5" aria-label="Próximo cumpleaños">
            <div className="flex gap-3">
                <CakeSlice aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Cumpleaños</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                        {isToday ? 'Hoy celebramos tu cumpleaños en el dojo.' : `Tu próximo cumpleaños es el ${label}.`}
                    </p>
                    {!isToday && <p className="mt-1 text-xs text-ink-3">Faltan {daysUntil} días.</p>}
                </div>
            </div>
        </aside>
    )
}
