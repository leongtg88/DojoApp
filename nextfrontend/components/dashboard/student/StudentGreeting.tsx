import type { StudentProfile } from '@/types/dashboard'

interface StudentGreetingProps {
    profile: StudentProfile
}

export function StudentGreeting({ profile }: StudentGreetingProps) {
    const saludo = profile.gender === 'FEMALE' ? 'Bienvenida' : profile.gender === 'MALE' ? 'Bienvenido' : 'Bienvenido(a)'

    return (
        <section className="flex flex-col justify-between gap-5 border-b border-edge pb-6 sm:flex-row sm:items-end">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Portal del estudiante</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">{saludo}, {profile.firstName}</h1>
                <p className="mt-2 text-sm text-ink-3">Sigue tu avance marcial y mantente preparado para el próximo entrenamiento.</p>
            </div>
        </section>
    )
}