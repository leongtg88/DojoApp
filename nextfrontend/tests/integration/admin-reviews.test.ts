import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, routeParams, readJson } = await import('./http')
const { createSchool, createUser } = await import('./fixtures')

const reviewItemRoute = await import('@/app/api/dashboard/admin/reviews/[reviewId]/route')
const publicReviewsRoute = await import('@/app/api/reviews/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

async function makeReview(schoolId: string, authorName: string, status: 'PENDING' | 'APPROVED' = 'PENDING') {
  return db.review.create({
    data: { schoolId, authorName, message: `Reseña de ${authorName} con suficiente texto`, rating: 5, status },
    select: { id: true },
  })
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 7 · F7-05 — Reseñas: aprobar/rechazar/eliminar y solo aprobadas públicas.
describe('F7-05 · reseñas', () => {
  it('aprueba una reseña y solo las aprobadas aparecen en público', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)
    await makeReview(school.id, 'Ana', 'PENDING')
    const approved = await makeReview(school.id, 'Beto', 'PENDING')

    const res = await reviewItemRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'APPROVED' }),
      routeParams({ reviewId: approved.id }),
    )
    expect(res.status).toBe(200)

    const updated = await db.review.findUniqueOrThrow({ where: { id: approved.id } })
    expect(updated.status).toBe('APPROVED')
    expect(updated.approvedAt).not.toBeNull()

    const publicResponse = await publicReviewsRoute.GET()
    const body = await readJson<{ reviews: { id: string }[] }>(publicResponse)
    expect(body.reviews.map((review) => review.id)).toEqual([approved.id])
  })

  it('elimina una reseña', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)
    const review = await makeReview(school.id, 'Ana')

    const res = await reviewItemRoute.DELETE(jsonRequest('http://t/x', 'DELETE'), routeParams({ reviewId: review.id }))
    expect(res.status).toBe(200)
    expect(await db.review.count()).toBe(0)
  })

  it('rechaza un estado inválido (400) y una reseña de otra escuela (404)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    await loginAsAdmin(school.id)
    const own = await makeReview(school.id, 'Ana')
    const foreign = await makeReview(other.id, 'Ajeno')

    const invalid = await reviewItemRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'NOPE' }),
      routeParams({ reviewId: own.id }),
    )
    expect(invalid.status).toBe(400)

    const notFound = await reviewItemRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'REJECTED' }),
      routeParams({ reviewId: foreign.id }),
    )
    expect(notFound.status).toBe(404)
  })
})
