import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// El almacenamiento privado (Supabase Storage) se sustituye por dobles.
vi.mock('@/lib/document-storage', () => ({
  uploadPrivateDocument: async () => {},
  deletePrivateDocuments: async () => {},
  createPrivateDocumentUrl: async () => 'https://signed.example/documento',
  sanitizeStorageName: (name: string) => name,
}))

vi.mock('@/lib/notifications/create', () => ({
  notifyAssignment: async () => {},
  notifySchoolStaff: async () => {},
  notifyReviewSubmitted: async () => {},
}))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { readJson } = await import('./http')
const { createSchool, createBranch, createStudentAccount } = await import('./fixtures')

const documentsRoute = await import('@/app/api/dashboard/student/documents/route')

async function loginAsStudent(schoolId: string, branchId: string) {
  const account = await createStudentAccount({ schoolId, branchId })
  authMock.setUser(account.userId, { roles: ['STUDENT'] })
  return account
}

function uploadRequest(studentId: string, type: string, fileName = 'documento.png', mime = 'image/png') {
  const form = new FormData()
  form.append('type', type)
  form.append('file', new File([new Uint8Array([1, 2, 3, 4])], fileName, { type: mime }))
  return new Request('http://t/x', { method: 'POST', headers: { 'x-student-id': studentId }, body: form })
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 5 · F5-06 — Documentos del alumno: subir, abrir y eliminar.
describe('F5-06 · documentos del alumno', () => {
  it('sube un documento y expira el anterior del mismo tipo', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const previous = await db.studentDocument.create({
      data: { studentId, type: 'IDENTITY', status: 'PENDING', fileName: 'viejo.png', storageKey: 'students/x/viejo.png', mimeType: 'image/png', fileSize: 10 },
      select: { id: true },
    })

    const res = await documentsRoute.POST(uploadRequest(studentId, 'IDENTITY'))

    expect(res.status).toBe(200)
    expect(await db.studentDocument.count({ where: { studentId } })).toBe(2)
    expect((await db.studentDocument.findUniqueOrThrow({ where: { id: previous.id } })).status).toBe('EXPIRED')
  })

  it('rechaza un tipo de documento inválido (400)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)

    const res = await documentsRoute.POST(uploadRequest(studentId, 'INVALIDO'))
    expect(res.status).toBe(400)
  })

  it('abre y elimina un documento propio', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const document = await db.studentDocument.create({
      data: { studentId, type: 'IDENTITY', fileName: 'cedula.png', storageKey: 'students/x/cedula.png', mimeType: 'image/png', fileSize: 10 },
      select: { id: true },
    })

    const open = await documentsRoute.GET(new Request(`http://t/x?documentId=${document.id}`))
    expect(open.status).toBe(200)
    expect((await readJson<{ url: string }>(open)).url).toBe('https://signed.example/documento')

    const removed = await documentsRoute.DELETE(new Request(`http://t/x?documentId=${document.id}`, { method: 'DELETE' }))
    expect(removed.status).toBe(200)
    expect(await db.studentDocument.count({ where: { studentId } })).toBe(0)
  })

  it('no permite abrir un documento de otro alumno (404)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const otherAccount = await createStudentAccount({ schoolId: school.id, branchId: branch.id })
    const foreign = await db.studentDocument.create({
      data: { studentId: otherAccount.studentId, type: 'IDENTITY', fileName: 'x.png', storageKey: 'students/y/x.png', mimeType: 'image/png', fileSize: 10 },
      select: { id: true },
    })

    const res = await documentsRoute.GET(new Request(`http://t/x?documentId=${foreign.id}`, { headers: { 'x-student-id': studentId } }))
    expect(res.status).toBe(404)
  })

  it('un tutor de otra familia no puede abrir el documento (403)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId } = await loginAsStudent(school.id, branch.id)
    const document = await db.studentDocument.create({
      data: { studentId, type: 'IDENTITY', fileName: 'x.png', storageKey: 'students/z/x.png', mimeType: 'image/png', fileSize: 10 },
      select: { id: true },
    })

    // Sesión de un tutor sin vínculo con el alumno dueño del documento.
    const guardian = await db.user.create({ data: { email: `g-${randomUUID()}@test.dev`, roles: ['GUARDIAN'] } })
    authMock.setUser(guardian.id, { roles: ['GUARDIAN'] })

    const res = await documentsRoute.GET(
      new Request(`http://t/x?documentId=${document.id}`, { headers: { 'x-student-id': studentId } }),
    )
    expect(res.status).toBe(403)
  })
})
