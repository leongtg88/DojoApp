import { permanentRedirect } from 'next/navigation'

/**
 * UX-B1 · Ruta antigua de horario → destino "Clases".
 * Redirección permanente: los enlaces de correos, WhatsApp y notificaciones
 * siguen funcionando para siempre.
 */
export default function StudentScheduleRedirect(): never {
    permanentRedirect('/dashboard/estudiante/clases')
}
