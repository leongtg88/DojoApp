import Link from 'next/link'
import { CalendarDays, GraduationCap, UserRound, Users } from 'lucide-react'
import type { FamilyView } from '@/lib/family/guardians'
import { studentHref } from '@/lib/dashboard/student-links'

interface FamilyMembersViewProps {
    members: FamilyView
}

function ageFrom(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth)
    if (Number.isNaN(dob.getTime())) return 0
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1
    return age
}

/**
 * Vista "Mi familia": tarjetas del expediente propio y de cada hijo, con acceso
 * directo a su perfil y a su asistencia.
 */
export function FamilyMembersView({ members }: FamilyMembersViewProps) {
    const totalMembers = (members.self ? 1 : 0) + members.children.length
    if (totalMembers <= 1) return null

    const entries: Array<{ id: string | null; name: string; badge: string; dateOfBirth: string; rank: string | null; photoUrl: string | null }> = []
    if (members.self) {
        entries.push({
            id: null,
            name: `${members.self.firstName} ${members.self.lastName}`,
            badge: 'Mi cuenta',
            dateOfBirth: members.self.dateOfBirth,
            rank: members.self.currentRank ?? null,
            photoUrl: members.self.photoUrl ?? null,
        })
    }
    for (const child of members.children) {
        entries.push({
            id: child.id,
            name: `${child.firstName} ${child.lastName}`,
            badge: child.relationship ?? 'Hijo(a)',
            dateOfBirth: child.dateOfBirth,
            rank: child.currentRank ?? null,
            photoUrl: child.photoUrl ?? null,
        })
    }

    return (
        <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
                <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
                    <Users aria-hidden="true" className="size-4 text-accent" />
                    Mi familia
                </p>
                <span className="text-xs font-semibold text-ink-3">{totalMembers} {totalMembers === 1 ? 'cuenta' : 'cuentas'}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => {
                    const initials = entry.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
                    return (
                        <div className="flex flex-col rounded-xl border border-edge bg-surface-1 p-4" key={entry.id ?? 'self'}>
                            <div className="flex items-center gap-3">
                                {entry.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={entry.photoUrl} alt={entry.name} className="size-11 shrink-0 rounded-full border border-edge-strong object-cover" />
                                ) : (
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-sm font-extrabold text-accent-text">{initials}</span>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-ink">{entry.name}</p>
                                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">{entry.badge}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                                <span className="inline-flex items-center gap-1"><UserRound aria-hidden="true" className="size-3.5 text-ink-4" />{ageFrom(entry.dateOfBirth)} años</span>
                                <span className="inline-flex items-center gap-1"><GraduationCap aria-hidden="true" className="size-3.5 text-ink-4" />{entry.rank ?? 'Sin grado'}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-edge pt-3">
                                <Link className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-bold text-[#0d1117] hover:bg-cyan-400" href={studentHref('/dashboard/estudiante/perfil', entry.id)}>
                                    <UserRound aria-hidden="true" className="size-3.5" />
                                    Ver perfil
                                </Link>
                                <Link className="inline-flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink" href={studentHref('/dashboard/estudiante/asistencia', entry.id)}>
                                    <CalendarDays aria-hidden="true" className="size-3.5" />
                                    Asistencia
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}