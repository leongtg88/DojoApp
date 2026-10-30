import { randomUUID } from 'node:crypto'
import JSZip from 'jszip'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', async () => {
  const mod = await import('./route-auth')
  return { auth: mod.authMock.auth }
})

const storageMock = vi.hoisted(() => ({
  download: async (storageKey: string) => ({
    buffer: Buffer.from(`contenido:${storageKey}`),
    contentType: 'application/pdf',
  }),
}))

// El storage privado (Supabase Storage) se sustituye por dobles; el resto de
// helpers (como isMissingDocumentError) se conservan reales.
vi.mock('@/lib/document-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/document-storage')>()
  return {
    ...actual,
    downloadPrivateDocument: (storageKey: string) => storageMock.download(storageKey),
    sanitizeStorageName: (name: string) => name,
  }
})

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { routeParams } = await import('./http')
const { createSchool, createBranch, createStudent, createUser } = await import('./fixtures')

const downloadRoute = await import('@/app/api/dashboard/admin/students/[studentId]/documents/[documentId]/download/route')
const archiveRoute = await import('@/app/api/dashboard/admin/students/[studentId]/documents/archive/route')

async function loginAsAdmin(schoolId: string) {
  const admin = await createUser({ email: `a-${randomUUID()}@test.dev`, roles: ['SCHOOL_ADMIN'], schoolId })
  authMock.setUser(admin.id, { roles: ['SCHOOL_ADMIN'], schoolId })
  return admin
}

async function createDocument(studentId: string, overrides: { fileName?: string; type?: 'IDENTITY' | 'PASSPORT' } = {}) {
  const storageKey = `students/${studentId}/${randomUUID()}.pdf`
  const document = await db.studentDocument.create({
    data: {
      studentId,
      type: overrides.type ?? 'IDENTITY',
      fileName: overrides.fileName ?? 'Cédula.pdf',
      storageKey,
      mimeType: 'application/pdf',
      fileSize: 10,
    },
    select: { id: true },
  })

  return { id: document.id, storageKey }
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
  storageMock.download = async (storageKey: string) => ({
    buffer: Buffer.from(`contenido:${storageKey}`),
    contentType: 'application/pdf',
  })
})

describe('descarga de documentos del expediente', () => {
  it('descarga un documento del propio alumno como adjunto con su nombre original', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await createDocument(student.id)

    const res = await downloadRoute.GET(
      new Request('http://t/x'),
      routeParams({ studentId: student.id, documentId: document.id }),
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(res.headers.get('cache-control')).toContain('no-store')
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition.startsWith('attachment;')).toBe(true)
    expect(disposition).toContain('filename="Cedula.pdf"')
    expect(disposition).toContain("filename*=UTF-8''C%C3%A9dula.pdf")
    expect(await res.text()).toBe(`contenido:${document.storageKey}`)
  })

  it('no descarga un documento de otra escuela (404)', async () => {
    const ownSchool = await createSchool('Escuela A')
    const otherSchool = await createSchool('Escuela B')
    const branch = await createBranch(otherSchool.id)
    await loginAsAdmin(ownSchool.id)
    const student = await createStudent({ schoolId: otherSchool.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await createDocument(student.id)

    const res = await downloadRoute.GET(
      new Request('http://t/x'),
      routeParams({ studentId: student.id, documentId: document.id }),
    )

    expect(res.status).toBe(404)
  })

  it('rechaza a un instructor (403)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await createDocument(student.id)
    const instructor = await createUser({ email: `i-${randomUUID()}@test.dev`, roles: ['INSTRUCTOR'], schoolId: school.id })
    authMock.setUser(instructor.id, { roles: ['INSTRUCTOR'], schoolId: school.id })

    const res = await downloadRoute.GET(
      new Request('http://t/x'),
      routeParams({ studentId: student.id, documentId: document.id }),
    )

    expect(res.status).toBe(403)
  })

  it('responde 404 si el archivo ya no existe en el storage', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await createDocument(student.id)
    storageMock.download = async () => {
      const error = new Error('Object not found') as Error & { cause?: unknown }
      error.cause = { code: 'NoSuchKey', message: 'Object not found', statusCode: '404' }
      throw error
    }

    const res = await downloadRoute.GET(
      new Request('http://t/x'),
      routeParams({ studentId: student.id, documentId: document.id }),
    )

    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: string }).error).toContain('ya no está disponible')
  })

  it('responde 503 si el storage falla', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const document = await createDocument(student.id)
    storageMock.download = async () => {
      throw new Error('storage caído')
    }

    const res = await downloadRoute.GET(
      new Request('http://t/x'),
      routeParams({ studentId: student.id, documentId: document.id }),
    )

    expect(res.status).toBe(503)
  })

  it('genera un ZIP solo con los documentos del alumno', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const first = await createDocument(student.id, { fileName: 'Cédula.pdf' })
    await createDocument(student.id, { fileName: 'Pasaporte.pdf', type: 'PASSPORT' })

    const res = await archiveRoute.GET(new Request('http://t/x'), routeParams({ studentId: student.id }))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="documentos-ana-uno-')

    const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()))
    const names = Object.keys(zip.files)
    expect(names).toHaveLength(2)
    expect(names.some((name) => name.endsWith('Cédula.pdf'))).toBe(true)
    expect(names.some((name) => name.endsWith('Pasaporte.pdf'))).toBe(true)
    expect(names.some((name) => name.toLowerCase().endsWith('.xlsx'))).toBe(false)

    const contents = await Promise.all(names.map((name) => zip.file(name)!.async('string')))
    expect(contents).toContain(`contenido:${first.storageKey}`)
  })

  it('incluye un aviso en el ZIP cuando un archivo ya no existe', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const missing = await createDocument(student.id, { fileName: 'Perdido.pdf' })
    await createDocument(student.id, { fileName: 'Disponible.pdf', type: 'PASSPORT' })
    storageMock.download = async (storageKey: string) => {
      if (storageKey === missing.storageKey) {
        const error = new Error('Object not found') as Error & { cause?: unknown }
        error.cause = { code: 'NoSuchKey', message: 'Object not found', statusCode: '404' }
        throw error
      }
      return { buffer: Buffer.from(`contenido:${storageKey}`), contentType: 'application/pdf' }
    }

    const res = await archiveRoute.GET(new Request('http://t/x'), routeParams({ studentId: student.id }))

    expect(res.status).toBe(200)
    const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()))
    const names = Object.keys(zip.files)
    expect(names.some((name) => name.endsWith('Disponible.pdf'))).toBe(true)
    expect(names).toContain('ARCHIVOS-NO-DISPONIBLES.txt')
    const notice = await zip.file('ARCHIVOS-NO-DISPONIBLES.txt')!.async('string')
    expect(notice).toContain('Perdido.pdf')
  })

  it('no genera ZIP de un alumno de otra escuela (404)', async () => {
    const ownSchool = await createSchool('Escuela A')
    const otherSchool = await createSchool('Escuela B')
    const branch = await createBranch(otherSchool.id)
    await loginAsAdmin(ownSchool.id)
    const student = await createStudent({ schoolId: otherSchool.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    await createDocument(student.id)

    const res = await archiveRoute.GET(new Request('http://t/x'), routeParams({ studentId: student.id }))

    expect(res.status).toBe(404)
  })

  it('no genera ZIP si el alumno no tiene documentos (404)', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    await loginAsAdmin(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })

    const res = await archiveRoute.GET(new Request('http://t/x'), routeParams({ studentId: student.id }))

    expect(res.status).toBe(404)
  })
})
