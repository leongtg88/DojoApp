import { NextRequest, NextResponse } from 'next/server'
import { purgeStalePendingEnrollments, purgeStalePendingUploads } from '@/lib/dashboard/registration-purge'

export const dynamic = 'force-dynamic'

// Cron diario: elimina solicitudes de inscripción PENDING antiguas que nunca se
// convirtieron en alumnos. Recupera almacenamiento ante llenado por bots (DoS).
// Vercel envía `Authorization: Bearer ${CRON_SECRET}` cuando el secreto existe.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const staleDays = Number(process.env.ENROLLMENT_STALE_DAYS ?? '') || 30
  const purged = await purgeStalePendingEnrollments(staleDays)

  // Además, barre los documentos subidos que nunca se asociaron a una
  // inscripción (formularios abandonados) y que ya superaron la hora de vigencia
  // de su token de subida.
  const pendingPurged = await purgeStalePendingUploads(24)

  return NextResponse.json({ ok: true, purged, pendingPurged })
}
