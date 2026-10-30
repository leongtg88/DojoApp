import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const storageMock = vi.hoisted(() => ({
  list: vi.fn(async () => [] as Array<{ name: string; createdAt: string | null }>),
  remove: vi.fn(async () => {}),
  move: vi.fn(async () => {}),
}))

vi.mock('@/lib/document-storage', () => ({
  listPrivateDocuments: storageMock.list,
  deletePrivateDocuments: storageMock.remove,
  movePrivateDocument: storageMock.move,
  sanitizeStorageName: (name: string) => name,
}))

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createStudent } = await import('./fixtures')
const { purgeStalePendingUploads } = await import('@/lib/dashboard/registration-purge')

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

beforeEach(async () => {
  await resetDb()
  storageMock.list.mockClear()
  storageMock.remove.mockClear()
  storageMock.move.mockClear()
  storageMock.list.mockResolvedValue([])
})

describe('purgeStalePendingUploads', () => {
  it('no borra los documentos ya asociados a un expediente', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const keptName = `${randomUUID()}-IDENTITY-cedula.pdf`
    const orphanName = `${randomUUID()}-IDENTITY-huerfano.pdf`

    await db.studentDocument.create({
      data: {
        studentId: student.id,
        type: 'IDENTITY',
        fileName: 'cedula.pdf',
        storageKey: `enrollments/pending/${keptName}`,
        mimeType: 'application/pdf',
        fileSize: 10,
      },
    })

    storageMock.list.mockResolvedValue([
      { name: keptName, createdAt: daysAgo(3) },
      { name: orphanName, createdAt: daysAgo(3) },
    ])

    const purged = await purgeStalePendingUploads(24)

    expect(purged).toBe(1)
    expect(storageMock.remove).toHaveBeenCalledWith([`enrollments/pending/${orphanName}`])
  })

  it('no borra nada si todos los archivos viejos están asociados', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const student = await createStudent({ schoolId: school.id, branchId: branch.id, firstName: 'Ana', lastName: 'Uno' })
    const name = `${randomUUID()}-PASSPORT-pasaporte.pdf`

    await db.studentDocument.create({
      data: {
        studentId: student.id,
        type: 'PASSPORT',
        fileName: 'pasaporte.pdf',
        storageKey: `enrollments/pending/${name}`,
        mimeType: 'application/pdf',
        fileSize: 10,
      },
    })
    storageMock.list.mockResolvedValue([{ name, createdAt: daysAgo(3) }])

    const purged = await purgeStalePendingUploads(24)

    expect(purged).toBe(0)
    expect(storageMock.remove).not.toHaveBeenCalled()
  })

  it('migra a ruta definitiva los documentos válidos que sigan en pendientes', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const enrollment = await db.enrollment.create({
      data: {
        origin: 'FORM',
        contactEmail: `familia-${randomUUID()}@test.dev`,
        schoolId: school.id,
        branchId: branch.id,
      },
      select: { id: true },
    })
    const applicant = await db.enrollmentApplicant.create({
      data: {
        enrollmentId: enrollment.id,
        name: 'Ana Adulta',
        dateOfBirth: new Date('1990-05-01T00:00:00.000Z'),
        profileData: {},
      },
      select: { id: true },
    })
    const name = `${randomUUID()}-IDENTITY-cedula.pdf`
    const storageKey = `enrollments/pending/${name}`
    const document = await db.studentDocument.create({
      data: {
        enrollmentId: enrollment.id,
        applicantId: applicant.id,
        type: 'IDENTITY',
        fileName: 'cedula.pdf',
        storageKey,
        mimeType: 'application/pdf',
        fileSize: 10,
      },
      select: { id: true },
    })
    storageMock.list.mockResolvedValue([{ name, createdAt: daysAgo(3) }])

    const purged = await purgeStalePendingUploads(24)

    expect(purged).toBe(0)
    expect(storageMock.remove).not.toHaveBeenCalled()
    expect(storageMock.move).toHaveBeenCalledWith(
      storageKey,
      `enrollments/${enrollment.id}/${applicant.id}/${document.id}-cedula.pdf`,
    )
    const updated = await db.studentDocument.findUniqueOrThrow({ where: { id: document.id } })
    expect(updated.storageKey).toBe(`enrollments/${enrollment.id}/${applicant.id}/${document.id}-cedula.pdf`)
  })

  it('respeta la vigencia de las subidas recientes', async () => {
    const name = `${randomUUID()}-IDENTITY-reciente.pdf`
    storageMock.list.mockResolvedValue([{ name, createdAt: daysAgo(0) }])

    const purged = await purgeStalePendingUploads(24)

    expect(purged).toBe(0)
    expect(storageMock.remove).not.toHaveBeenCalled()
  })
})
