import { GraduationCap, ShieldCheck, Swords } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'

export interface RolePanelOption {
    role: DashboardRole
    href: string
    label: string
    shortLabel: string
    icon: LucideIcon
}

const adminRole = (roles: DashboardRole[]): DashboardRole => (roles.includes('SUPERADMIN') ? 'SUPERADMIN' : 'SCHOOL_ADMIN')

export function getRolePanelOptions(roles: DashboardRole[]): RolePanelOption[] {
    const options: RolePanelOption[] = []

    if (roles.includes('STUDENT')) {
        options.push({ role: 'STUDENT', href: '/dashboard/estudiante', label: 'Portal del estudiante', shortLabel: 'Estudiante', icon: GraduationCap })
    }

    if (roles.includes('INSTRUCTOR')) {
        options.push({ role: 'INSTRUCTOR', href: '/dashboard/instructor', label: 'Panel de instructor', shortLabel: 'Instructor', icon: Swords })
    }

    if (roles.includes('SCHOOL_ADMIN') || roles.includes('SUPERADMIN')) {
        options.push({ role: adminRole(roles), href: '/dashboard/admin', label: 'Administración del dojo', shortLabel: 'Administración', icon: ShieldCheck })
    }

    return options
}

export function getPanelHref(role: DashboardRole): string {
    switch (role) {
        case 'STUDENT':
            return '/dashboard/estudiante'
        case 'INSTRUCTOR':
            return '/dashboard/instructor'
        default:
            return '/dashboard/admin'
    }
}