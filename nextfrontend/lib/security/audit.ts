import 'server-only'
import { db } from '@/lib/db'
import { getClientIp } from '@/lib/security/rate-limit'
import { headers } from 'next/headers'

export interface AuditInput {
  actorId: string
  schoolId?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  detail?: Record<string, unknown> | null
}

// Registra una acción sensible del staff (exports, borrados). Nunca lanza: un
// fallo de auditoría no debe romper la acción principal.
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const hdrs = await headers()
    await db.auditLog.create({
      data: {
        schoolId: input.schoolId ?? null,
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        detail: (input.detail as PrismaJsonValue) ?? undefined,
        ip: getClientIp(hdrs) ?? null,
      },
    })
  } catch (error) {
    console.error('[audit] No fue posible registrar la acción', input.action, error)
  }
}

type PrismaJsonValue = Parameters<typeof db.auditLog.create>[0]['data']['detail']