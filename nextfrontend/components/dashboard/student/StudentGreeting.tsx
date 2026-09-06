import Link from 'next/link'
import { BadgeCheck, UserRound } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface StudentGreetingProps {
    profile: StudentProfile
}

export function StudentGreeting({ profile }: StudentGreetingProps) {
    const fullName = `${profile.firstName} ${profile.lastName}`
    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()

    return (
        <section className="flex flex-col justify-between gap-5 border-b border-neutral-800 pb-6 sm:flex-row sm:items-end">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Portal del estudiante</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Bienvenido, {profile.firstName}</h1>
                <p className="mt-2 text-sm text-neutral-400">Sigue tu avance marcial y mantente preparado para el próximo entrenamiento.</p>
            </div>
            <Link className="flex items-center gap-3 self-start rounded-lg border border-neutral-700 bg-[#161b22] p-2.5 transition-colors hover:bg-neutral-800 sm:self-auto" href="/dashboard/estudiante/perfil">
                <span className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20 font-display text-sm font-bold text-cyan-100">{initials}</span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-white">{fullName}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300"><BadgeCheck aria-hidden="true" className="size-3.5" />Alumno activo</span>
                </span>
                <UserRound aria-hidden="true" className="size-4 text-neutral-500" />
            </Link>
        </section>
    )
}