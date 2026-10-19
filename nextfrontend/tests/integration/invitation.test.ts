import { createHash, randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// El endpoint de invitación es público (no usa `auth()`); solo se neutraliza WhatsApp.
vi.mock('@/lib/integrations/whatsapp', () => ({ setWhatsAppOptIn: async () => {} }))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createStudent, createUser } = await import('./fixtures')

const invitationRoute = await import('@/app/api/auth/invitation/route')

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

function post(body: unknown): NextRequest {
  return new NextRequest('http://t/api/auth/invitation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function makeInvitation(
  studentId: string,
  email: string,
  options: { expiresInMs?: number; usedAt?: Date | null } = {},
) {
  const rawToken = `${randomUUID()}${randomUUID()}` // ≥ 20 chars
  await db.studentInvitationToken.create({
    data: {
      token: hash(rawToken),
      studentId,
      email,
      expiresAt: new Date(Date.now() + (options.expiresInMs ?? 7 * 24 * 60 * 60 * 1000)),
      usedAt: options.usedAt ?? null,
    },
  })
  return rawToken
}

beforeEach(async () => {
  await resetDb()
})

// Fase 3/F8 · Aceptación de invitación (consumo del token).
describe('aceptación de invitación', () => {
  it('crea la cuenta, vincula el expediente y consume el token', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const email = 'ana@test.dev'
    const token = await makeInvitation(student.id, email)

    const res = await invitationRoute.POST(post({ token, email, password: 'Password123' }))

    expect(res.status).toBe(200)
    const user = await db.user.findUniqueOrThrow({ where: { email } })
    expect(user.roles).toContain('STUDENT')
    expect((await db.student.findUniqueOrThrow({ where: { id: student.id } })).userId).toBe(user.id)
    expect((await db.studentInvitationToken.findFirstOrThrow({ where: { studentId: student.id } })).usedAt).not.toBeNull()
  })

  it('rechaza un token ya utilizado (409) y uno expirado (410)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const usedStudent = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Usada', lastName: 'U' })
    const expiredStudent = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Vieja', lastName: 'V' })
    const usedToken = await makeInvitation(usedStudent.id, 'usada@test.dev', { usedAt: new Date() })
    const expiredToken = await makeInvitation(expiredStudent.id, 'vieja@test.dev', { expiresInMs: -1000 })

    const reused = await invitationRoute.POST(post({ token: usedToken, email: 'usada@test.dev', password: 'Password123' }))
    expect(reused.status).toBe(409)

    const expired = await invitationRoute.POST(post({ token: expiredToken, email: 'vieja@test.dev', password: 'Password123' }))
    expect(expired.status).toBe(410)
  })

  it('rechaza un token inexistente (404) y un correo que no coincide (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const token = await makeInvitation(student.id, 'ana@test.dev')

    const notFound = await invitationRoute.POST(post({ token: `${randomUUID()}${randomUUID()}`, email: 'ana@test.dev', password: 'Password123' }))
    expect(notFound.status).toBe(404)

    const mismatch = await invitationRoute.POST(post({ token, email: 'otro@test.dev', password: 'Password123' }))
    expect(mismatch.status).toBe(400)
  })

  it('rechaza si el estudiante ya tiene otra cuenta de acceso (409)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const otherUser = await createUser({ email: 'otro@test.dev', roles: ['STUDENT'], schoolId: school.id })
    await db.student.update({ where: { id: student.id }, data: { userId: otherUser.id } })
    const token = await makeInvitation(student.id, 'ana@test.dev')

    const res = await invitationRoute.POST(post({ token, email: 'ana@test.dev', password: 'Password123' }))
    expect(res.status).toBe(409)
  })

  it('valida el cuerpo (400) y limita los intentos por IP (429)', async () => {
    const invalid = await invitationRoute.POST(post({ token: 'corto', email: 'x', password: '1' }))
    expect(invalid.status).toBe(400)

    let last = 0
    for (let index = 0; index < 11; index += 1) {
      const res = await invitationRoute.POST(post({ token: `${randomUUID()}${randomUUID()}`, email: 'ana@test.dev', password: 'Password123' }))
      last = res.status
    }
    expect(last).toBe(429)
  })
})
