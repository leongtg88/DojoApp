import type { NotificationPriority } from '@/lib/generated/prisma'

export const NOTIFICATION_PRIORITY_STYLES: Record<NotificationPriority, string> = {
  INFO: 'bg-neutral-700',
  ACTION: 'bg-cyan-500',
  URGENT: 'bg-amber-500',
}

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  INFO: 'Información',
  ACTION: 'Acción requerida',
  URGENT: 'Importante',
}

export function formatNotificationRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.round(hours / 24)
  if (days < 7) return `Hace ${days} d`

  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}
