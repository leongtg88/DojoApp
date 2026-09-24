'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, UserRound, Users } from 'lucide-react'
import type { FamilyView } from '@/lib/family/guardians'

interface FamilyMemberSwitcherProps {
    members: FamilyView
    iconOnly?: boolean
}

/**
 * Selector "Mi cuenta / Cuenta de hijo" para tutores. Permite alternar entre el
 * expediente propio y el de cada hijo conservando la sub-ruta actual del portal
 * del estudiante. Solo se muestra si la cuenta tiene acceso a más de un
 * expediente. Con `iconOnly` el botón queda reducido a solo el icono.
 */
export function FamilyMemberSwitcher({ members, iconOnly = false }: FamilyMemberSwitcherProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeStudentId = searchParams.get('estudiante')
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const totalMembers = (members.self ? 1 : 0) + members.children.length

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onPointerDown)
        return () => document.removeEventListener('mousedown', onPointerDown)
    }, [])

    if (totalMembers <= 1) {
        return null
    }

    const isOwn = !activeStudentId || activeStudentId === members.self?.id
    const currentMember = isOwn ? members.self : members.children.find((child) => child.id === activeStudentId) ?? null
    const currentLabel = currentMember ? `${currentMember.firstName} ${currentMember.lastName}` : 'Cuenta familiar'

    const buildHref = (studentId: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (studentId) params.set('estudiante', studentId)
        else params.delete('estudiante')
        const query = params.toString()
        return query ? `${pathname}?${query}` : pathname
    }

    const entries: Array<{ id: string | null; label: string; subtitle?: string }> = []
    if (members.self) entries.push({ id: null, label: `${members.self.firstName} ${members.self.lastName}`, subtitle: 'Mi cuenta' })
    for (const child of members.children) entries.push({ id: child.id, label: `${child.firstName} ${child.lastName}`, subtitle: 'Hijo(a)' })

    return (
        <div className="relative" ref={containerRef}>
            <button
                aria-expanded={open}
                aria-haspopup="menu"
                className={`flex items-center rounded-lg border border-edge-strong bg-surface-1 font-bold text-ink transition-colors hover:bg-surface-3 ${iconOnly ? 'size-9 shrink-0 justify-center' : 'max-w-48 items-center gap-1.5 px-2.5 py-1.5 text-xs'}`}
                onClick={() => setOpen((value) => !value)}
                title={iconOnly ? currentLabel : 'Cambiar de cuenta familiar'}
                type="button"
            >
                <Users aria-hidden="true" className="size-4 shrink-0 text-accent" />
                {!iconOnly && (
                    <>
                        <span className="truncate">{currentLabel}</span>
                        <ChevronDown aria-hidden="true" className={`size-3.5 shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-edge-strong bg-surface-2 shadow-2xl" role="menu">
                    <p className="border-b border-edge px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-4">
                        {members.self ? 'Mi cuenta / hijos' : 'Cuentas de mis hijos'}
                    </p>
                    <div className="max-h-72 overflow-y-auto py-1">
                        {entries.map((entry) => {
                            const active = (entry.id ?? null) === (activeStudentId ?? null)
                            return (
                                <Link
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${active ? 'bg-cyan-500/15 text-accent-text' : 'text-ink-2 hover:bg-surface-3 hover:text-ink'}`}
                                    href={buildHref(entry.id)}
                                    key={entry.id ?? 'self'}
                                    onClick={() => setOpen(false)}
                                    role="menuitem"
                                >
                                    <UserRound aria-hidden="true" className="size-4 shrink-0" />
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold">{entry.label}</span>
                                        {entry.subtitle && <span className="block text-[10px] uppercase tracking-wide text-ink-4">{entry.subtitle}</span>}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}