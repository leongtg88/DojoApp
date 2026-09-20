import Link from 'next/link'
import { BadgeCheck, UserRound } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface StudentGreetingProps {
    profile: StudentProfile
}

export function StudentGreeting({ profile }: StudentGreetingProps) {
    const fullName = `${profile.firstName} ${profile.lastName}`
    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    const saludo = profile.gender === 'FEMALE' ? 'Bienvenida' : profile.gender === 'MALE' ? 'Bienvenido' : 'Bienvenido(a)'

    return (
        <section className="flex flex-col justify-between gap-5 border-b border-edge pb-6 sm:flex-row sm:items-end">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Portal del estudiante</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">{saludo}, {profile.firstName}</h1>
                <p className="mt-2 text-sm text-ink-3">Sigue tu avance marcial y mantente preparado para el próximo entrenamiento.</p>
            </div>
            <Link className="flex items-center gap-3 self-start rounded-lg border border-edge-strong bg-surface-2 p-2.5 transition-colors hover:bg-surface-3 sm:self-auto" href="/dashboard/estudiante/perfil">
                <span className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20 font-display text-sm font-bold text-accent-text">{initials}</span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{fullName}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ok-text"><BadgeCheck aria-hidden="true" className="size-3.5" />Alumno activo</span>
                </span>
                <UserRound aria-hidden="true" className="size-4 text-ink-4" />
            </Link>
        </section>
    )
}