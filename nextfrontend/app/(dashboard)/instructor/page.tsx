import { permanentRedirect } from 'next/navigation'

/**
 * UX-B4 · Modo tatami: el instructor entra directo al pase de lista de la
 * clase de hoy o la próxima, sin pasar por un resumen.
 */
export default function InstructorHomeRedirect(): never {
    permanentRedirect('/dashboard/instructor/asistencia')
}
