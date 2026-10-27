'use client'

import {
    BookOpenCheck,
    CalendarDays,
    ClipboardCheck,
    Fingerprint,
    GraduationCap,
    LayoutDashboard,
    ListChecks,
    MessageCircle,
    Repeat,
    Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV_LABELS } from '@/lib/ui/nav-labels'
import type { DashboardRole } from '@/types/dashboard'

export interface DashboardNavigationItem {
    href: string
    label: string
    icon: LucideIcon
    badge?: number
    /** Oculta el enlace de la barra inferior móvil (sigue en el sidebar). */
    hideInBottomNav?: boolean
}

const navigationByRole: Record<DashboardRole, DashboardNavigationItem[]> = {
    STUDENT: [
        { href: '/dashboard/estudiante', label: NAV_LABELS.inicio, icon: LayoutDashboard },
        { href: '/dashboard/estudiante/entrenar', label: NAV_LABELS.entrenar, icon: Repeat },
        { href: '/dashboard/estudiante/clases', label: NAV_LABELS.clases, icon: CalendarDays },
        { href: '/dashboard/estudiante/progreso', label: NAV_LABELS.progreso, icon: GraduationCap },
        { href: '/dashboard/estudiante/perfil', label: NAV_LABELS.perfil, icon: Users },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
    // Un tutor accede al mismo portal del estudiante y usa el selector familiar
    // para alternar entre su cuenta y la de sus hijos.
    GUARDIAN: [
        { href: '/dashboard/estudiante', label: NAV_LABELS.inicio, icon: LayoutDashboard },
        { href: '/dashboard/estudiante/entrenar', label: NAV_LABELS.entrenar, icon: Repeat },
        { href: '/dashboard/estudiante/clases', label: NAV_LABELS.clases, icon: CalendarDays },
        { href: '/dashboard/estudiante/progreso', label: NAV_LABELS.progreso, icon: GraduationCap },
        { href: '/dashboard/estudiante/perfil', label: NAV_LABELS.perfil, icon: Users },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
    INSTRUCTOR: [
        { href: '/dashboard/instructor/asistencia', label: NAV_LABELS.tatami, icon: ClipboardCheck },
        { href: '/dashboard/instructor/clases', label: NAV_LABELS.misClases, icon: CalendarDays },
        { href: '/dashboard/instructor/estudiantes', label: NAV_LABELS.estudiantes, icon: Users },
        { href: '/dashboard/instructor/evaluaciones', label: NAV_LABELS.evaluaciones, icon: BookOpenCheck },
        { href: '/dashboard/instructor/grados-y-katas', label: NAV_LABELS.gradosYKatas, icon: GraduationCap },
        { href: '/dashboard/instructor/resumen', label: NAV_LABELS.resumen, icon: LayoutDashboard, hideInBottomNav: true },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
    SCHOOL_ADMIN: [
        // UX-B5 · Cinco secciones. Las pantallas concretas viven en los hubs
        // de Operación, Configuración y Comunicación.
        { href: '/dashboard/admin', label: NAV_LABELS.hoy, icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: NAV_LABELS.alumnos, icon: Users },
        { href: '/dashboard/admin/operacion', label: NAV_LABELS.operacion, icon: ClipboardCheck },
        { href: '/dashboard/admin/configuracion', label: NAV_LABELS.configuracion, icon: ListChecks },
        { href: '/dashboard/admin/comunicacion', label: NAV_LABELS.comunicacion, icon: MessageCircle },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
    SUPERADMIN: [
        { href: '/dashboard/admin', label: NAV_LABELS.hoy, icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: NAV_LABELS.alumnos, icon: Users },
        { href: '/dashboard/admin/operacion', label: NAV_LABELS.operacion, icon: ClipboardCheck },
        { href: '/dashboard/admin/configuracion', label: NAV_LABELS.configuracion, icon: ListChecks },
        { href: '/dashboard/admin/comunicacion', label: NAV_LABELS.comunicacion, icon: MessageCircle },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
}

export function getRoleNavigation(role: DashboardRole, pendingEnrollmentCount = 0, newStudentCount = 0) {
    return navigationByRole[role].map((item) => {
        if (item.href === '/dashboard/admin' && pendingEnrollmentCount > 0) {
            return { ...item, badge: pendingEnrollmentCount }
        }
        if (item.href === '/dashboard/admin/alumnos' && newStudentCount > 0) {
            return { ...item, badge: newStudentCount }
        }
        return item
    })
}
