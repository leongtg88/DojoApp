import Link from 'next/link'
import { UserRound, Users } from 'lucide-react'
import type { FamilyView } from '@/lib/family/guardians'
import { studentHref } from '@/lib/dashboard/student-links'

interface FamilyQuickSwitcherProps {
    members: FamilyView
    currentStudentId: string | null
    baseHref: string
}

/**
 * Selector rápido de perfil familiar para marcar asistencia: una fila de botones
 * "Mi cuenta · Juan · Carlos · Enrique" que navegan a la misma página con el
 * expediente activo (Opción A). Solo se renderiza para cuentas con más de un
 * expediente accesible.
 */
export function FamilyQuickSwitcher({ members, currentStudentId, baseHref }: FamilyQuickSwitcherProps) {
    const totalMembers = (members.self ? 1 : 0) + members.children.length
    if (totalMembers <= 1) return null

    const isSelfActive = Boolean(members.self && currentStudentId === members.self.id)

    const entries: Array<{ id: string | null; label: string }> = []
    if (members.self) entries.push({ id: null, label: 'Mi cuenta' })
    for (const child of members.children) entries.push({ id: child.id, label: `${child.firstName} ${child.lastName}` })

    return (
        <section className="rounded-lg border border-edge bg-surface-2 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Users aria-hidden="true" className="size-4 text-accent" />
                    ¿Quién marca su asistencia?
                </p>
                <div className="flex flex-wrap gap-2">
                    {entries.map((entry) => {
                        const active = entry.id === null ? isSelfActive : entry.id === currentStudentId
                        return (
                            <Link
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${active ? 'bg-cyan-500 text-[#0d1117] shadow-sm' : 'border border-edge-strong bg-surface-1 text-ink-2 hover:bg-surface-3 hover:text-ink'}`}
                                href={studentHref(baseHref, entry.id)}
                                key={entry.id ?? 'self'}
                            >
                                <UserRound aria-hidden="true" className="size-3.5" />
                                {entry.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}