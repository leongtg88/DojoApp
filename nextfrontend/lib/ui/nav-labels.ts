/**
 * UX-01 · Fuente única de las etiquetas de navegación.
 *
 * Hay dos capas, a propósito:
 *
 * 1. `STUDENT_DESTINATIONS` y `ADMIN_SECTIONS` describen los destinos **objetivo**
 *    de la reorganización (guía, secciones 6 y 7). Son la referencia de la prueba
 *    de nombres del Anexo A.6 y se aplican a la navegación en UX-B1 (alumno) y
 *    UX-B5 (admin). No llevan `href`: las páginas todavía no existen y declarar
 *    rutas inexistentes sería programar contra algo que no está.
 *
 * 2. `NAV_LABELS` son las etiquetas que la navegación usa **hoy**. Las consume
 *    `RoleNavigation`; cualquier texto de menú nuevo se agrega aquí en vez de
 *    escribirlo a mano en un componente (guía, sección 3.2).
 */

export type StudentDestinationId = 'inicio' | 'entrenar' | 'clases' | 'progreso' | 'perfil'

export interface NavDestination<Id extends string> {
  id: Id
  /** Nombre visible. Máximo una palabra siempre que sea posible (barra móvil). */
  label: string
  /** Qué espera encontrar la persona aquí. Se usa en la validación con usuarios. */
  description: string
}

/** Los 5 destinos fijos del alumno (decisión 1 de la guía, sección 6). */
export const STUDENT_DESTINATIONS = [
  {
    id: 'inicio',
    label: 'Inicio',
    description: 'Tu resumen y la acción que toca hoy.',
  },
  {
    id: 'entrenar',
    label: 'Entrenar',
    description: 'Katas, técnicas y registro de repeticiones.',
  },
  {
    id: 'clases',
    label: 'Clases',
    description: 'Tu horario, reportar una inasistencia y tu historial.',
  },
  {
    id: 'progreso',
    label: 'Progreso',
    description: 'Tu grado y lo que te falta para el próximo cinturón.',
  },
  {
    id: 'perfil',
    label: 'Perfil',
    description: 'Tus datos, documentos y ajustes de seguridad.',
  },
] as const satisfies readonly NavDestination<StudentDestinationId>[]

export type AdminSectionId = 'hoy' | 'alumnos' | 'operacion' | 'configuracion' | 'comunicacion' | 'finanzas'

export interface AdminSection extends NavDestination<AdminSectionId> {
  /** Reservada: existe el hueco pero el módulo aún no se implementa. */
  reserved?: boolean
}

/** Las 5 secciones del admin más `Finanzas`, reservada y oculta (guía, sección 6). */
export const ADMIN_SECTIONS = [
  {
    id: 'hoy',
    label: 'Hoy',
    description: 'Los pendientes del día en una sola bandeja.',
  },
  {
    id: 'alumnos',
    label: 'Alumnos',
    description: 'Padrón, expediente e inscripciones.',
  },
  {
    id: 'operacion',
    label: 'Operación',
    description: 'Asistencia, reposiciones y balance de horas.',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    description: 'Horarios, calendario, planes, grados y katas.',
  },
  {
    id: 'comunicacion',
    label: 'Comunicación',
    description: 'Mensajes, reseñas y blog.',
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    description: 'Pagos y facturación.',
    reserved: true,
  },
] as const satisfies readonly AdminSection[]

/** Etiquetas de menú vigentes. Centralizadas para no repetirlas en componentes. */
export const NAV_LABELS = {
  inicio: 'Inicio',
  entrenar: 'Entrenar',
  clases: 'Clases',
  progreso: 'Progreso',
  perfil: 'Perfil',
  tatami: 'Tatami',
  hoy: 'Hoy',
  operacion: 'Operación',
  configuracion: 'Configuración',
  configuracionCorta: 'Config',
  comunicacion: 'Comunicación',
  comunicacionCorta: 'Comunic',
  resumen: 'Resumen',
  miPerfil: 'Mi perfil',
  miProgreso: 'Mi progreso',
  horario: 'Horario',
  asistencia: 'Asistencia',
  seguridad: 'Seguridad',
  misClases: 'Mis clases',
  estudiantes: 'Estudiantes',
  evaluaciones: 'Evaluaciones',
  gradosYKatas: 'Grados y katas',
  alumnos: 'Alumnos',
  detallesAlumno: 'Detalles Alumno',
  inscripciones: 'Inscripciones',
  planes: 'Planes',
  horarios: 'Horarios',
  calendario: 'Calendario',
  balanceDeHoras: 'Balance de horas',
  mensajes: 'Mensajes',
  resenas: 'Reseñas',
  blog: 'Blog',
} as const

export type NavLabelKey = keyof typeof NAV_LABELS
