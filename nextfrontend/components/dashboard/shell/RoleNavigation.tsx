'use client'

import {
    BookOpenCheck,
    CalendarClock,
    CalendarDays,
    ClipboardCheck,
    Clock3,
    FileSearch,
    Fingerprint,
    GraduationCap,
    LayoutDashboard,
    ListChecks,
    MessageCircle,
    Newspaper,
    Repeat,
    Star,
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
        // Barra inferior móvil: Resumen, Alumnos, Asistencia, Grados y katas y Mensajes.
        // El resto (con `hideInBottomNav`) sigue disponible en el sidebar.
        { href: '/dashboard/admin', label: NAV_LABELS.resumen, icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: NAV_LABELS.alumnos, icon: Users },
        { href: '/dashboard/admin/alumnos/detalle', label: NAV_LABELS.detallesAlumno, icon: FileSearch, hideInBottomNav: true },
        { href: '/dashboard/admin/inscripciones', label: NAV_LABELS.inscripciones, icon: ClipboardCheck, hideInBottomNav: true },
        { href: '/dashboard/admin/planes', label: NAV_LABELS.planes, icon: ListChecks, hideInBottomNav: true },
        { href: '/dashboard/admin/horarios', label: NAV_LABELS.horarios, icon: CalendarDays, hideInBottomNav: true },
        { href: '/dashboard/admin/calendario', label: NAV_LABELS.calendario, icon: CalendarClock, hideInBottomNav: true },
        { href: '/dashboard/admin/balance', label: NAV_LABELS.balanceDeHoras, icon: Clock3, hideInBottomNav: true },
        { href: '/dashboard/admin/asistencia', label: NAV_LABELS.asistencia, icon: CalendarDays },
        { href: '/dashboard/admin/grados-y-katas', label: NAV_LABELS.gradosYKatas, icon: GraduationCap },
        { href: '/dashboard/admin/mensajes', label: NAV_LABELS.mensajes, icon: MessageCircle },
        { href: '/dashboard/admin/reviews', label: NAV_LABELS.resenas, icon: Star, hideInBottomNav: true },
        { href: '/dashboard/admin/blog', label: NAV_LABELS.blog, icon: Newspaper, hideInBottomNav: true },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
    SUPERADMIN: [
        { href: '/dashboard/admin', label: NAV_LABELS.resumen, icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: NAV_LABELS.alumnos, icon: Users },
        { href: '/dashboard/admin/alumnos/detalle', label: NAV_LABELS.detallesAlumno, icon: FileSearch, hideInBottomNav: true },
        { href: '/dashboard/admin/inscripciones', label: NAV_LABELS.inscripciones, icon: ClipboardCheck, hideInBottomNav: true },
        { href: '/dashboard/admin/planes', label: NAV_LABELS.planes, icon: ListChecks, hideInBottomNav: true },
        { href: '/dashboard/admin/horarios', label: NAV_LABELS.horarios, icon: CalendarDays, hideInBottomNav: true },
        { href: '/dashboard/admin/calendario', label: NAV_LABELS.calendario, icon: CalendarClock, hideInBottomNav: true },
        { href: '/dashboard/admin/balance', label: NAV_LABELS.balanceDeHoras, icon: Clock3, hideInBottomNav: true },
        { href: '/dashboard/admin/asistencia', label: NAV_LABELS.asistencia, icon: CalendarDays },
        { href: '/dashboard/admin/grados-y-katas', label: NAV_LABELS.gradosYKatas, icon: GraduationCap },
        { href: '/dashboard/admin/mensajes', label: NAV_LABELS.mensajes, icon: MessageCircle },
        { href: '/dashboard/admin/reviews', label: NAV_LABELS.resenas, icon: Star, hideInBottomNav: true },
        { href: '/dashboard/admin/blog', label: NAV_LABELS.blog, icon: Newspaper, hideInBottomNav: true },
        { href: '/dashboard/ajustes', label: NAV_LABELS.seguridad, icon: Fingerprint, hideInBottomNav: true },
    ],
}

export function getRoleNavigation(role: DashboardRole, pendingEnrollmentCount = 0, newStudentCount = 0) {
    return navigationByRole[role].map((item) => {
        if (item.href === '/dashboard/admin/inscripciones' && pendingEnrollmentCount > 0) {
            return { ...item, badge: pendingEnrollmentCount }
        }
        if (item.href === '/dashboard/admin/alumnos' && newStudentCount > 0) {
            return { ...item, badge: newStudentCount }
        }
        return item
    })
}
