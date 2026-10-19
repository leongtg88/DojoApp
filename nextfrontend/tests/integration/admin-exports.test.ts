import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

// El storage privado se sustituye por dobles (los exports no deben tocar Supabase).
vi.mock('@/lib/document-storage', () => ({
  downloadPrivateDocument: async () => ({ buffer: Buffer.from('foto'), contentType: 'image/png' }),
  sanitizeStorageName: (name: string) => name,
}))

const { resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { routeParams } = await import('./http')
const { createSchool, createBranch, createStudent, createUser } = await import('./fixtures')

const exportAllRoute = await import('@/app/api/dashboard/admin/students/export/route')
const exportZipRoute = await import('@/app/api/dashboard/admin/students/[studentId]/export/zip/route')
const exportPdfRoute = await import('@/app/api/dashboard/admin/students/[studentId]/export-pdf/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Fase 8 · F8-05 — Exportaciones (Excel del padrón, ZIP y carnet PDF).
describe('F8-05 · exportaciones', () => {
  it('exporta el padrón a Excel (.xlsx)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

    const res = await exportAllRoute.GET(new Request('http://t/x'))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('exporta el expediente en ZIP', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

    const res = await exportZipRoute.GET(new Request('http://t/x'), routeParams({ studentId: student.id }))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
    expect(new Uint8Array(await res.arrayBuffer()).length).toBeGreaterThan(0)
  })

  it('genera el carnet de la federación en PDF', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

    const res = await exportPdfRoute.GET(new Request('http://t/x'), routeParams({ studentId: student.id }))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(0)
    // Firma de archivo PDF (%PDF).
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('%PDF')
  })

  it('no exporta el carnet de un alumno inexistente (404)', async () => {
    const school = await createSchool()
    await loginAsAdmin(school.id)

    const res = await exportPdfRoute.GET(new Request('http://t/x'), routeParams({ studentId: 'no-existe' }))
    expect(res.status).toBe(404)
  })
})
