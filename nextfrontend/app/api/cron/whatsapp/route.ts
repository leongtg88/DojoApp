import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppQueue } from '@/lib/integrations/whatsapp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const sent = await processWhatsAppQueue()

  return NextResponse.json({ ok: true, sent })
}
