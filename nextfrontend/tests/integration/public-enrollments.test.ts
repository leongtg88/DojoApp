import { beforeEach, describe, expect, it, vi } from 'vitest'

// Integraciones externas del flujo público: se neutralizan.
vi.mock('@/lib/integrations/n8n', () => ({ postToN8n: async () => {} }))
vi.mock('@/lib/integrations/telegram', () => ({
  notifyEnrollmentByTelegram: async () => {},
  notifyPriceRequestByTelegram: async () => {},
  notifyReviewByTelegram: async () => {},
}))
vi.mock('@/lib/integrations/whatsapp', () => ({
  notifyEnrollmentByWhatsApp: async () => {},
  notifyPriceRequestByWhatsApp: async () => {},
  notifyReviewByWhatsApp: async () => {},
}))
vi.mock('@/lib/push/web-push', () => ({ sendPushToSchoolAdmins: async () => {} }))

const { db, resetDb } = await import('./db')
const { jsonRequest, readJson } = await import('./http')
const { createSchool, createBranch } = await import('./fixtures')

const enrollmentsRoute = await import('@/app/api/enrollments/route')
const quoteRoute = await import('@/app/api/assistant/quote/route')

beforeEach(resetDb)

const validEnrollment = {
  nombre: 'Ana Familia',
  tipo: 'Adulto',
  email: 'ana@test.dev',
  whatsapp: '8095550000',
  horario_pref: 'Tarde',
}

// Flujo público · Inscripción desde el asistente virtual.
describe('flujo público · inscripción', () => {
  it('crea la solicitud (origin ASSISTANT) con el correo normalizado', async () => {
    const school = await createSchool()
    await createBranch(school.id)

    const res = await enrollmentsRoute.POST(jsonRequest('http://t/api/enrollments', 'POST', validEnrollment))

    expect(res.status).toBe(200)
    const enrollment = await db.enrollment.findFirstOrThrow()
    expect(enrollment.origin).toBe('ASSISTANT')
    expect(enrollment.status).toBe('PENDING')
    expect(enrollment.contactEmail).toBe('ana@test.dev')
    expect(enrollment.applicantName).toBe('Ana Familia')
  })

  it('es idempotente por correo: no duplica solicitudes pendientes', async () => {
    const school = await createSchool()
    await createBranch(school.id)

    const first = await readJson<{ id: string }>(await enrollmentsRoute.POST(jsonRequest('http://t/api/enrollments', 'POST', validEnrollment)))
    const second = await readJson<{ id: string }>(await enrollmentsRoute.POST(jsonRequest('http://t/api/enrollments', 'POST', validEnrollment)))

    expect(second.id).toBe(first.id)
    expect(await db.enrollment.count()).toBe(1)
  })

  it('rechaza datos inválidos (400) y responde 503 sin sede', async () => {
    const invalid = await enrollmentsRoute.POST(jsonRequest('http://t/api/enrollments', 'POST', { nombre: 'A' }))
    expect(invalid.status).toBe(400)

    // Sin ninguna sede creada.
    const noBranch = await enrollmentsRoute.POST(jsonRequest('http://t/api/enrollments', 'POST', validEnrollment))
    expect(noBranch.status).toBe(503)
  })

  it('limita los intentos por correo (429)', async () => {
    const school = await createSchool()
    await createBranch(school.id)

    let last = 0
    for (let index = 0; index < 6; index += 1) {
      const res = await enrollmentsRoute.POST(jsonRequest('http://t/api/enrollments', 'POST', validEnrollment))
      last = res.status
    }
    expect(last).toBe(429)
  })
})

// Flujo público · Cotización de precios.
describe('flujo público · cotización', () => {
  it('acepta la solicitud y registra una solicitud de precios si hay correo', async () => {
    const school = await createSchool()
    await createBranch(school.id)

    const res = await quoteRoute.POST(
      jsonRequest('http://t/api/assistant/quote', 'POST', {
        nombre: 'Beto',
        email: 'beto@test.dev',
        plan_seleccionado: 'Plan Básico',
        plan_precio: 'RD$3,500',
      }),
    )

    expect(res.status).toBe(200)
    const enrollment = await db.enrollment.findFirstOrThrow()
    expect(enrollment.interest).toBe('Precios / Cotización')
    expect(enrollment.quote).toContain('Plan Básico')
  })

  it('sin correo no crea expediente pero responde ok', async () => {
    const res = await quoteRoute.POST(
      jsonRequest('http://t/api/assistant/quote', 'POST', { nombre: 'Beto', plan_seleccionado: 'Plan', plan_precio: 'RD$1' }),
    )
    expect(res.status).toBe(200)
    expect(await db.enrollment.count()).toBe(0)
  })

  it('rechaza datos inválidos (400)', async () => {
    const res = await quoteRoute.POST(jsonRequest('http://t/api/assistant/quote', 'POST', { nombre: 'B' }))
    expect(res.status).toBe(400)
  })

  it('limita los intentos por IP (429)', async () => {
    let last = 0
    for (let index = 0; index < 21; index += 1) {
      const res = await quoteRoute.POST(
        jsonRequest('http://t/api/assistant/quote', 'POST', { nombre: 'Beto', plan_seleccionado: 'Plan', plan_precio: 'RD$1' }),
      )
      last = res.status
    }
    expect(last).toBe(429)
  })
})
