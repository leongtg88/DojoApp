import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest, routeParams } = await import('./http')
const { createSchool, createBranch, createStudent } = await import('./fixtures')

const documentRoute = await import('@/app/api/dashboard/admin/students/[studentId]/documents/[documentId]/route')

/** Crea un admin y deja la sesión con roles (la ruta los lee del `session.user`). */
async function loginAsAdmin(schoolId: string | null) {
  const admin = await db.user.create({ data: { email: `admin-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId } })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

async function makeDocument(studentId: string) {
  return db.studentDocument.create({
    data: {
      studentId,
      type: 'IDENTITY',
      fileName: 'cedula.pdf',
      storageKey: `students/${studentId}/${randomUUID()}.pdf`,
      mimeType: 'application/pdf',
      fileSize: 1024,
    },
    select: { id: true },
  })
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 3 · F3-06 — Revisión de documentos (aprobar / rechazar / volver a pendiente).
describe('F3-06 · revisar documentos', () => {
  it('aprueba un documento y marca la fecha de revisión', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await makeDocument(student.id)

    const res = await documentRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'APPROVED', reviewNotes: null }),
      routeParams({ studentId: student.id, documentId: document.id }),
    )

    expect(res.status).toBe(200)
    const updated = await db.studentDocument.findUniqueOrThrow({ where: { id: document.id } })
    expect(updated.status).toBe('APPROVED')
    expect(updated.reviewedAt).not.toBeNull()
  })

  it('exige observación al rechazar (400) y la guarda cuando se envía', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await makeDocument(student.id)

    const withoutNotes = await documentRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'REJECTED', reviewNotes: null }),
      routeParams({ studentId: student.id, documentId: document.id }),
    )
    expect(withoutNotes.status).toBe(400)

    const withNotes = await documentRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'REJECTED', reviewNotes: 'Foto borrosa' }),
      routeParams({ studentId: student.id, documentId: document.id }),
    )
    expect(withNotes.status).toBe(200)
    const updated = await db.studentDocument.findUniqueOrThrow({ where: { id: document.id } })
    expect(updated.status).toBe('REJECTED')
    expect(updated.reviewNotes).toBe('Foto borrosa')
  })

  it('al volver a "Pendiente" limpia la revisión', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await makeDocument(student.id)
    await db.studentDocument.update({ where: { id: document.id }, data: { status: 'REJECTED', reviewNotes: 'x', reviewedAt: new Date() } })

    const res = await documentRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'PENDING', reviewNotes: null }),
      routeParams({ studentId: student.id, documentId: document.id }),
    )
    expect(res.status).toBe(200)
    const updated = await db.studentDocument.findUniqueOrThrow({ where: { id: document.id } })
    expect(updated.status).toBe('PENDING')
    expect(updated.reviewNotes).toBeNull()
    expect(updated.reviewedAt).toBeNull()
  })

  it('no alcanza documentos de otra escuela (404)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    const student = await createStudent({ schoolId: other.id, branchId: otherBranch.id, firstName: 'Ajeno', lastName: 'X' })
    const document = await makeDocument(student.id)
    await loginAsAdmin(school.id)

    const res = await documentRoute.PATCH(
      jsonRequest('http://t/x', 'PATCH', { status: 'APPROVED', reviewNotes: null }),
      routeParams({ studentId: student.id, documentId: document.id }),
    )
    expect(res.status).toBe(404)
    expect((await db.studentDocument.findUniqueOrThrow({ where: { id: document.id } })).status).toBe('PENDING')
  })

  it('no genera la URL firmada de un documento de otra escuela (404)', async () => {
    const school = await createSchool('A')
    const other = await createSchool('B')
    const otherBranch = await createBranch(other.id)
    const student = await createStudent({ schoolId: other.id, branchId: otherBranch.id, firstName: 'Ajeno', lastName: 'X' })
    const document = await makeDocument(student.id)
    await loginAsAdmin(school.id)

    const res = await documentRoute.GET(
      jsonRequest('http://t/x', 'GET'),
      routeParams({ studentId: student.id, documentId: document.id }),
    )
    expect(res.status).toBe(404)
  })
})
