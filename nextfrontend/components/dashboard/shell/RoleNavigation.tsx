'use client'

import {
    BookOpenCheck,
    CalendarDays,
    ClipboardCheck,
    GraduationCap,
    LayoutDashboard,
    Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'

export interface DashboardNavigationItem {
    href: string
    label: string
    icon: LucideIcon
}

const navigationByRole: Record<DashboardRole, DashboardNavigationItem[]> = {
    STUDENT: [
        { href: '/dashboard/estudiante', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/estudiante/perfil', label: 'Mi perfil', icon: Users },
        { href: '/dashboard/estudiante/progreso', label: 'Mi progreso', icon: GraduationCap },
        { href: '/dashboard/estudiante/horario', label: 'Horario', icon: CalendarDays },
        { href: '/dashboard/estudiante/asistencia', label: 'Asistencia', icon: ClipboardCheck },
    ],
    INSTRUCTOR: [
        { href: '/dashboard/instructor', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/instructor/clases', label: 'Mis clases', icon: CalendarDays },
        { href: '/dashboard/instructor/estudiantes', label: 'Estudiantes', icon: Users },
        { href: '/dashboard/instructor/asistencia', label: 'Asistencia', icon: ClipboardCheck },
        { href: '/dashboard/instructor/evaluaciones', label: 'Evaluaciones', icon: BookOpenCheck },
    ],
    SCHOOL_ADMIN: [
        { href: '/dashboard/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: 'Alumnos', icon: Users },
        { href: '/dashboard/admin/inscripciones', label: 'Inscripciones', icon: ClipboardCheck },
        { href: '/dashboard/admin/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
        { href: '/dashboard/admin/asistencia', label: 'Asistencia', icon: CalendarDays },
    ],
    SUPERADMIN: [
        { href: '/dashboard/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: 'Alumnos', icon: Users },
        { href: '/dashboard/admin/inscripciones', label: 'Inscripciones', icon: ClipboardCheck },
        { href: '/dashboard/admin/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
        { href: '/dashboard/admin/asistencia', label: 'Asistencia', icon: CalendarDays },
    ],
}

export function getRoleNavigation(role: DashboardRole) {
    return navigationByRole[role]
}
