import type { NotificationPriority, NotificationType } from '@/lib/generated/prisma'

export interface NotificationContent {
  title: string
  body: string
  link: string
  priority: NotificationPriority
}

export interface NotificationContext {
  studentName: string
  count: number
  data: Record<string, unknown>
}

type NotificationBuilder = (context: NotificationContext) => NotificationContent

const PROGRESS_LINK = '/dashboard/estudiante/progreso'
const SCHEDULE_LINK = '/dashboard/estudiante/horario'
const ATTENDANCE_LINK = '/dashboard/estudiante/asistencia'
const PROFILE_LINK = '/dashboard/estudiante/perfil'

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

const builders: Record<NotificationType, NotificationBuilder> = {
  TECHNIQUES_ASSIGNED: ({ studentName, count }) => ({
    title: 'Nuevas técnicas asignadas',
    body: `${studentName}, tu Sensei te asignó ${count} ${pluralize(count, 'técnica', 'técnicas')} para practicar.`,
    link: PROGRESS_LINK,
    priority: 'ACTION',
  }),
  TECHNIQUES_REMOVED: ({ studentName, count }) => ({
    title: 'Técnicas actualizadas',
    body: `${studentName}, se ${pluralize(count, 'retiró', 'retiraron')} ${count} ${pluralize(count, 'técnica', 'técnicas')} de tu plan de práctica.`,
    link: PROGRESS_LINK,
    priority: 'INFO',
  }),
  RANK_PROMOTED: ({ studentName, data }) => {
    const rankName = readString(data, 'rankName') ?? 'tu nuevo grado'
    return {
      title: '¡Nuevo grado alcanzado!',
      body: `Felicitaciones ${studentName}, ascendiste a ${rankName}.`,
      link: PROGRESS_LINK,
      priority: 'URGENT',
    }
  },
  KATAS_UNLOCKED: ({ studentName, count, data }) => {
    const rankName = readString(data, 'rankName')
    const suffix = rankName ? ` para ${rankName}` : ''
    return {
      title: 'Katas desbloqueadas',
      body: `${studentName}, tienes ${count} ${pluralize(count, 'kata nuevo', 'katas nuevos')} que practicar${suffix}.`,
      link: PROGRESS_LINK,
      priority: 'ACTION',
    }
  },
  CLASS_ENROLLED: ({ studentName, data }) => {
    const className = readString(data, 'className') ?? 'un nuevo horario'
    return {
      title: 'Nuevo horario asignado',
      body: `${studentName}, fuiste inscrito en ${className}.`,
      link: SCHEDULE_LINK,
      priority: 'ACTION',
    }
  },
  CLASS_REMOVED: ({ studentName, data }) => {
    const className = readString(data, 'className') ?? 'un horario'
    return {
      title: 'Horario actualizado',
      body: `${studentName}, ya no formas parte de ${className}.`,
      link: SCHEDULE_LINK,
      priority: 'INFO',
    }
  },
  PLAN_ASSIGNED: ({ studentName, data }) => {
    const planName = readString(data, 'planName') ?? 'un nuevo plan'
    return {
      title: 'Plan actualizado',
      body: `${studentName}, se te asignó el plan ${planName}.`,
      link: PROFILE_LINK,
      priority: 'INFO',
    }
  },
  SCHOLARSHIP_ASSIGNED: ({ studentName, data }) => {
    const scholarshipName = readString(data, 'scholarshipName') ?? 'una beca'
    return {
      title: 'Beca asignada',
      body: `${studentName}, se te otorgó ${scholarshipName}.`,
      link: PROFILE_LINK,
      priority: 'INFO',
    }
  },
  DOCUMENT_APPROVED: ({ data }) => {
    const documentName = readString(data, 'documentName') ?? 'Documento'
    return {
      title: 'Documento aprobado',
      body: `${documentName} fue aprobado correctamente.`,
      link: PROFILE_LINK,
      priority: 'INFO',
    }
  },
  DOCUMENT_REJECTED: ({ data }) => {
    const documentName = readString(data, 'documentName') ?? 'Documento'
    const reason = readString(data, 'reviewNotes')
    return {
      title: 'Documento rechazado',
      body: reason ? `${documentName} fue rechazado: ${reason}` : `${documentName} fue rechazado.`,
      link: PROFILE_LINK,
      priority: 'ACTION',
    }
  },
  ATTENDANCE_CONFIRMED: ({ studentName, count }) => ({
    title: 'Asistencia confirmada',
    body: `${studentName}, se confirmaron ${count} ${pluralize(count, 'asistencia', 'asistencias')}.`,
    link: ATTENDANCE_LINK,
    priority: 'INFO',
  }),
  TECHNIQUE_APPROVED: ({ studentName, data }) => {
    const techniqueName = readString(data, 'techniqueName') ?? 'Una técnica'
    return {
      title: 'Técnica aprobada',
      body: `${studentName}, aprobaste ${techniqueName}.`,
      link: PROGRESS_LINK,
      priority: 'INFO',
    }
  },
  TECHNIQUE_EVALUATED: ({ studentName, data }) => {
    const techniqueName = readString(data, 'techniqueName') ?? 'una técnica'
    const score = readNumber(data, 'score')
    return {
      title: 'Nueva evaluación',
      body:
        score !== null
          ? `${studentName}, evaluaron ${techniqueName} con ${score} puntos.`
          : `${studentName}, evaluaron ${techniqueName}.`,
      link: PROGRESS_LINK,
      priority: 'INFO',
    }
  },
}

export function buildNotificationContent(
  type: NotificationType,
  context: NotificationContext,
): NotificationContent {
  return builders[type](context)
}
