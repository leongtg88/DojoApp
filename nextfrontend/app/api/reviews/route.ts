import { db } from '@/lib/db'
import { notifyReviewByTelegram } from '@/lib/integrations/telegram'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_PUBLIC_REVIEWS = 12

const reviewSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  relationship: z.string().trim().max(80).optional().default(''),
  rating: z.coerce.number().int().min(1).max(5).optional().default(5),
  message: z.string().trim().min(10).max(600),
  email: z
    .union([z.literal(''), z.string().trim().email().max(320)])
    .optional()
    .default(''),
  // Honeypot: los usuarios reales lo dejan vacío.
  website: z.string().max(200).optional().default(''),
})

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ approvedAt: 'desc' }, { createdAt: 'desc' }],
      take: MAX_PUBLIC_REVIEWS,
      select: {
        id: true,
        authorName: true,
        relationship: true,
        rating: true,
        message: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('[reviews] No fue posible cargar las reseñas', error)
    return NextResponse.json({ reviews: [], unavailable: true })
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = reviewSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: 'Revisa los datos de la reseña e inténtalo de nuevo.' },
      { status: 400 },
    )
  }

  const data = result.data

  if (data.website.trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  const ip = getClientIp(request.headers)
  const ipAttempt = await consumeRateLimit(`review:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipAttempt.allowed) {
    return rateLimitResponse(
      ipAttempt.retryAfterSeconds,
      'Ya recibimos varias reseñas tuyas. Inténtalo de nuevo más tarde.',
    )
  }

  const school = await db.school.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  await db.review.create({
    data: {
      authorName: data.authorName,
      relationship: data.relationship || null,
      rating: data.rating,
      message: data.message,
      email: data.email ? data.email.toLowerCase() : null,
      schoolId: school?.id ?? null,
      status: 'PENDING',
    },
  })

  await notifyReviewByTelegram({
    authorName: data.authorName,
    relationship: data.relationship || null,
    rating: data.rating,
    message: data.message,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
