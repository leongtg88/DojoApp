import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, readJson } = await import('./http')
const { createSchool, createBranch, createStudent, createStudentAccount } = await import('./fixtures')

const profileRoute = await import('@/app/api/dashboard/student/profile/route')

const required = { emergencyContact: null, medicalInfo: null, giSize: null, beltSize: null }

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 5 · F5-05 — Editar perfil propio y del hijo (tutor).
describe('F5-05 · editar perfil', () => {
  it('actualiza los datos del propio alumno', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { userId, studentId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })
    authMock.setUser(userId, { roles: ['STUDENT'] })

    const res = await profileRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { firstName: 'Ana María', contactPhone: '809-555-0000', ...required }),
    )

    expect(res.status).toBe(200)
    const updated = await db.student.findUniqueOrThrow({ where: { id: studentId } })
    expect(updated.firstName).toBe('Ana María')
    expect(updated.contactPhone).toBe('809-555-0000')
  })

  it('rechaza una fecha de nacimiento futura (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { userId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })
    authMock.setUser(userId, { roles: ['STUDENT'] })

    const res = await profileRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { dateOfBirth: '2999-01-01', contactPhone: null, ...required }),
    )
    expect(res.status).toBe(400)
  })

  it('registra el opt-in de WhatsApp', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { userId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })
    authMock.setUser(userId, { roles: ['STUDENT'] })

    const res = await profileRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { contactPhone: '809-555-0000', whatsappOptIn: true, ...required }),
    )
    expect(res.status).toBe(200)

    const contact = await db.whatsAppContact.findUniqueOrThrow({ where: { userId } })
    expect(contact.optIn).toBe(true)
  })

  it('el tutor puede actualizar el contacto de su hijo vía X-Student-Id', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const guardian = await db.user.create({ data: { email: `g-${randomUUID()}@test.dev`, roles: ['GUARDIAN'] } })
    const child = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Hijo', lastName: 'Uno' })
    await db.student.update({ where: { id: child.id }, data: { guardianId: guardian.id } })
    authMock.setUser(guardian.id, { roles: ['GUARDIAN'] })

    const res = await profileRoute.PATCH(
      new Request('http://t/x', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-student-id': child.id },
        body: JSON.stringify({ contactPhone: '809-111-2222', ...required }),
      }),
    )

    expect(res.status).toBe(200)
    const updated = await db.student.findUniqueOrThrow({ where: { id: child.id } })
    expect(updated.contactPhone).toBe('809-111-2222')
  })

  it('un tutor no puede editar un expediente ajeno (403)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const guardian = await db.user.create({ data: { email: `g-${randomUUID()}@test.dev`, roles: ['GUARDIAN'] } })
    const stranger = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ajeno', lastName: 'X' })
    authMock.setUser(guardian.id, { roles: ['GUARDIAN'] })

    const res = await profileRoute.PATCH(
      new Request('http://t/x', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-student-id': stranger.id },
        body: JSON.stringify({ contactPhone: '809-000-0000' }),
      }),
    )
    expect(res.status).toBe(403)
    expect((await readJson<{ error: string }>(res)).error).toBe('No autorizado')
  })
})
