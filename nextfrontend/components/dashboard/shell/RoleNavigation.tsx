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
    Star,
    Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
        { href: '/dashboard/estudiante', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/estudiante/perfil', label: 'Mi perfil', icon: Users },
        { href: '/dashboard/estudiante/progreso', label: 'Mi progreso', icon: GraduationCap },
        { href: '/dashboard/estudiante/horario', label: 'Horario', icon: CalendarDays },
        { href: '/dashboard/estudiante/asistencia', label: 'Asistencia', icon: ClipboardCheck },
        { href: '/dashboard/ajustes', label: 'Seguridad', icon: Fingerprint, hideInBottomNav: true },
    ],
    // Un tutor accede al mismo portal del estudiante y usa el selector familiar
    // para alternar entre su cuenta y la de sus hijos.
    GUARDIAN: [
        { href: '/dashboard/estudiante', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/estudiante/perfil', label: 'Mi perfil', icon: Users },
        { href: '/dashboard/estudiante/progreso', label: 'Mi progreso', icon: GraduationCap },
        { href: '/dashboard/estudiante/horario', label: 'Horario', icon: CalendarDays },
        { href: '/dashboard/estudiante/asistencia', label: 'Asistencia', icon: ClipboardCheck },
        { href: '/dashboard/ajustes', label: 'Seguridad', icon: Fingerprint, hideInBottomNav: true },
    ],
    INSTRUCTOR: [
        { href: '/dashboard/instructor', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/instructor/clases', label: 'Mis clases', icon: CalendarDays },
        { href: '/dashboard/instructor/estudiantes', label: 'Estudiantes', icon: Users },
        { href: '/dashboard/instructor/asistencia', label: 'Asistencia', icon: ClipboardCheck },
        { href: '/dashboard/instructor/evaluaciones', label: 'Evaluaciones', icon: BookOpenCheck },
        { href: '/dashboard/instructor/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
        { href: '/dashboard/ajustes', label: 'Seguridad', icon: Fingerprint, hideInBottomNav: true },
    ],
    SCHOOL_ADMIN: [
        // Barra inferior móvil: Resumen, Alumnos, Asistencia, Grados y katas y Mensajes.
        // El resto (con `hideInBottomNav`) sigue disponible en el sidebar.
        { href: '/dashboard/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: 'Alumnos', icon: Users },
        { href: '/dashboard/admin/alumnos/detalle', label: 'Detalles Alumno', icon: FileSearch, hideInBottomNav: true },
        { href: '/dashboard/admin/inscripciones', label: 'Inscripciones', icon: ClipboardCheck, hideInBottomNav: true },
        { href: '/dashboard/admin/planes', label: 'Planes', icon: ListChecks, hideInBottomNav: true },
        { href: '/dashboard/admin/horarios', label: 'Horarios', icon: CalendarDays, hideInBottomNav: true },
        { href: '/dashboard/admin/calendario', label: 'Calendario', icon: CalendarClock, hideInBottomNav: true },
        { href: '/dashboard/admin/balance', label: 'Balance de horas', icon: Clock3, hideInBottomNav: true },
        { href: '/dashboard/admin/asistencia', label: 'Asistencia', icon: CalendarDays },
        { href: '/dashboard/admin/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
        { href: '/dashboard/admin/mensajes', label: 'Mensajes', icon: MessageCircle },
        { href: '/dashboard/admin/reviews', label: 'Reseñas', icon: Star, hideInBottomNav: true },
        { href: '/dashboard/admin/blog', label: 'Blog', icon: Newspaper, hideInBottomNav: true },
        { href: '/dashboard/ajustes', label: 'Seguridad', icon: Fingerprint, hideInBottomNav: true },
    ],
    SUPERADMIN: [
        { href: '/dashboard/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/admin/alumnos', label: 'Alumnos', icon: Users },
        { href: '/dashboard/admin/alumnos/detalle', label: 'Detalles Alumno', icon: FileSearch, hideInBottomNav: true },
        { href: '/dashboard/admin/inscripciones', label: 'Inscripciones', icon: ClipboardCheck, hideInBottomNav: true },
        { href: '/dashboard/admin/planes', label: 'Planes', icon: ListChecks, hideInBottomNav: true },
        { href: '/dashboard/admin/horarios', label: 'Horarios', icon: CalendarDays, hideInBottomNav: true },
        { href: '/dashboard/admin/calendario', label: 'Calendario', icon: CalendarClock, hideInBottomNav: true },
        { href: '/dashboard/admin/balance', label: 'Balance de horas', icon: Clock3, hideInBottomNav: true },
        { href: '/dashboard/admin/asistencia', label: 'Asistencia', icon: CalendarDays },
        { href: '/dashboard/admin/grados-y-katas', label: 'Grados y katas', icon: GraduationCap },
        { href: '/dashboard/admin/mensajes', label: 'Mensajes', icon: MessageCircle },
        { href: '/dashboard/admin/reviews', label: 'Reseñas', icon: Star, hideInBottomNav: true },
        { href: '/dashboard/admin/blog', label: 'Blog', icon: Newspaper, hideInBottomNav: true },
        { href: '/dashboard/ajustes', label: 'Seguridad', icon: Fingerprint, hideInBottomNav: true },
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
