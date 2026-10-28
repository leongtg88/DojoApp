import fs from 'node:fs'
import path from 'node:path'
import { NotificationType } from '@/lib/generated/prisma'
import { buildNotificationContent } from '@/lib/notifications/types'

const auditDir = path.resolve(import.meta.dirname, '..')
const context = {
  studentName: 'Alumno de Auditoría',
  studentId: 'audit-child-ana',
  count: 2,
  data: {
    rankName: 'Amarillo',
    className: 'Karate infantil',
    documentName: 'Cédula',
    reviewNotes: 'Falta la firma',
    scheduledAt: '2026-11-02T15:00:00.000Z',
    techniqueName: 'Heian Shodan',
    authorName: 'Tutor',
    rating: 5,
  },
}

const rows = []
for (const type of Object.values(NotificationType)) {
  try {
    const content = buildNotificationContent(type, context)
    rows.push({ type, title: content.title, link: content.link, priority: content.priority })
  } catch (error) {
    rows.push({ type, error: error instanceof Error ? error.message : String(error) })
  }
}

fs.writeFileSync(path.join(auditDir, 'reports', 'link-inventory.json'), JSON.stringify(rows, null, 2))
console.log(JSON.stringify(rows, null, 2))
