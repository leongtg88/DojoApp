import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/integrations/telegram', () => ({ notifyReviewByTelegram: async () => {} }))
vi.mock('@/lib/integrations/whatsapp', () => ({ notifyReviewByWhatsApp: async () => {} }))
vi.mock('@/lib/notifications/create', () => ({ notifyReviewSubmitted: async () => {} }))

const { db, resetDb } = await import('./db')
const { jsonRequest, readJson } = await import('./http')
const { createSchool } = await import('./fixtures')

const reviewsRoute = await import('@/app/api/reviews/route')

const validReview = {
  authorName: 'Madre de familia',
  relationship: 'Madre',
  rating: 5,
  message: 'Excelente dojo, muy recomendado para los niños.',
}

beforeEach(resetDb)

// Flujo público · Reseñas (entrada sin sesión).
describe('flujo público · reseñas', () => {
  it('crea una reseña PENDING y no la publica hasta aprobarla', async () => {
    await createSchool()

    const res = await reviewsRoute.POST(jsonRequest('http://t/api/reviews', 'POST', validReview))

    expect(res.status).toBe(201)
    const review = await db.review.findFirstOrThrow()
    expect(review.status).toBe('PENDING')

    const publicList = await readJson<{ reviews: unknown[] }>(await reviewsRoute.GET())
    expect(publicList.reviews).toEqual([])
  })

  it('descarta el envío si el honeypot viene relleno', async () => {
    const res = await reviewsRoute.POST(jsonRequest('http://t/api/reviews', 'POST', { ...validReview, website: 'spam' }))
    expect(res.status).toBe(200)
    expect(await db.review.count()).toBe(0)
  })

  it('rechaza datos inválidos (400)', async () => {
    const res = await reviewsRoute.POST(jsonRequest('http://t/api/reviews', 'POST', { authorName: 'X', message: 'corto' }))
    expect(res.status).toBe(400)
  })

  it('limita los envíos por IP (429)', async () => {
    let last = 0
    for (let index = 0; index < 6; index += 1) {
      const res = await reviewsRoute.POST(jsonRequest('http://t/api/reviews', 'POST', validReview))
      last = res.status
    }
    expect(last).toBe(429)
  })
})
