import { auth } from '@/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Suscripción no válida' }, { status: 400 })
  }

  await db.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, userId: session.user.id } })

  return NextResponse.json({ ok: true })
}
