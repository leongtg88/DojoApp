import { CakeSlice } from 'lucide-react'

interface StudentBirthdayCardProps {
    dateOfBirth: string
}

export function StudentBirthdayCard({ dateOfBirth }: StudentBirthdayCardProps) {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())

    if (nextBirthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24
    const daysUntil = Math.round((nextBirthday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / millisecondsPerDay)
    const isToday = daysUntil === 0
    const dateLabel = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long' }).format(nextBirthday)

    return (
        <aside className="mt-8 border border-[#e5e2e1] bg-[#fffaf0] p-5" aria-label="Próximo cumpleaños">
            <div className="flex gap-3">
                <CakeSlice aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#b70011]" />
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Cumpleaños</p>
                    <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">
                        {isToday ? 'Hoy celebramos tu cumpleaños en el dojo.' : `Tu próximo cumpleaños es el ${dateLabel}.`}
                    </p>
                    {!isToday && <p className="mt-1 text-sm text-[#5c403c]">Faltan {daysUntil} días.</p>}
                </div>
            </div>
        </aside>
    )
}