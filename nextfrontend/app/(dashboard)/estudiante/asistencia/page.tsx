import { permanentRedirect } from 'next/navigation'

/**
 * UX-B1 · Ruta antigua de asistencia → destino "Clases".
 * El registro de práctica vive ahora en "Entrenar", pero los enlaces viejos
 * deben seguir resolviendo sin romperse.
 */
export default function StudentAttendanceRedirect(): never {
    permanentRedirect('/dashboard/estudiante/clases')
}
