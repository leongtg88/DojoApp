'use client'

import {
    BookOpenCheck,
    CalendarDays,
    ClipboardCheck,
    Clock3,
    GraduationCap,
    LayoutDashboard,
    ListChecks,
    Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardRole } from '@/types/dashboard'

export interface DashboardNavigationItem {
    href: string
    label: string
    icon: LucideIcon
    badge?: number
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
        { href: '/dashboard/admin/planes', label: 'Planes', icon: ListChecks },
        { href: '/dashboard/admin/horarios', label: 'Horarios', icon: CalendarDays },
        { href: '/dashboard/admin/balance', label: 'Balance de horas', icon: Clock3 },
        { href: '/dashboard/admin/asistencia', label: 'Asistencia', icon: CalendarDays },
        { href: '/dashboard/admin/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
    ],
    SUPERADMIN: [
        { href: '/dashboard/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: 'Alumnos', icon: Users },
        { href: '/dashboard/admin/inscripciones', label: 'Inscripciones', icon: ClipboardCheck },
        { href: '/dashboard/admin/planes', label: 'Planes', icon: ListChecks },
        { href: '/dashboard/admin/horarios', label: 'Horarios', icon: CalendarDays },
        { href: '/dashboard/admin/balance', label: 'Balance de horas', icon: Clock3 },
        { href: '/dashboard/admin/asistencia', label: 'Asistencia', icon: CalendarDays },
        { href: '/dashboard/admin/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
    ],
}

export function getRoleNavigation(role: DashboardRole, pendingEnrollmentCount = 0) {
    return navigationByRole[role].map((item) =>
        item.href === '/dashboard/admin/inscripciones' && pendingEnrollmentCount > 0
            ? { ...item, badge: pendingEnrollmentCount }
            : item
    )
}
