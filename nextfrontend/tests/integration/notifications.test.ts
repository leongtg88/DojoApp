import { beforeEach, describe, expect, it } from 'vitest'

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createStudentAccount, createUser } = await import('./fixtures')
const { notifyAssignment, notifySchoolStaff } = await import('@/lib/notifications/create')
const { listNotifications } = await import('@/lib/notifications/queries')

beforeEach(resetDb)

// Fase 8 · F8-04 — Notificaciones in-app con enlace a la página correcta.
describe('F8-04 · notificaciones', () => {
  it('notifica al alumno con el enlace de progreso', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId, userId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })

    await notifyAssignment({ type: 'TECHNIQUES_ASSIGNED', studentId, count: 3 })

    const page = await listNotifications(userId)
    expect(page.unreadCount).toBe(1)
    expect(page.items[0]).toMatchObject({ type: 'TECHNIQUES_ASSIGNED', link: '/dashboard/estudiante/entrenar', studentId })
  })

  it('deduplica los avisos de asistencia sin leer', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId, userId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })

    await notifyAssignment({ type: 'ATTENDANCE_CONFIRMED', studentId, count: 1 })
    await notifyAssignment({ type: 'ATTENDANCE_CONFIRMED', studentId, count: 1 })

    const page = await listNotifications(userId)
    expect(page.items).toHaveLength(1)
    expect(page.unreadCount).toBe(1)
  })

  it('notifica al staff con el enlace del expediente del alumno', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const admin = await createUser({ email: 'staff@test.dev', roles: ['SCHOOL_ADMIN'], schoolId: school.id })
    const { studentId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })

    await notifySchoolStaff({ type: 'DOCUMENT_UPLOADED', studentId, data: { documentName: 'la foto de perfil' } })

    const notifications = await db.notification.findMany({ where: { userId: admin.id } })
    expect(notifications).toHaveLength(1)
    expect(notifications[0].link).toBe(`/dashboard/admin/alumnos/${studentId}`)
  })

  it('el enlace del punch apunta a la asistencia del admin', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const admin = await createUser({ email: 'staff2@test.dev', roles: ['SCHOOL_ADMIN'], schoolId: school.id })
    const { studentId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })

    await notifySchoolStaff({ type: 'ATTENDANCE_PUNCHED', studentId, data: { hoursTrained: 1.5 } })

    const notification = await db.notification.findFirstOrThrow({ where: { userId: admin.id } })
    expect(notification.link).toBe('/dashboard/admin/asistencia')
  })

  it('los avisos de documento aprobado y rechazado enlazan al perfil', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)
    const { studentId, userId } = await createStudentAccount({ schoolId: school.id, branchId: branch.id })

    await notifyAssignment({ type: 'DOCUMENT_APPROVED', studentId, data: { documentName: 'la foto de perfil' } })
    await notifyAssignment({ type: 'DOCUMENT_REJECTED', studentId, data: { documentName: 'la cédula', reviewNotes: 'borrosa' } })

    const page = await listNotifications(userId)
    const links = page.items.map((item) => `${item.type}:${item.link}`)
    expect(links).toContain('DOCUMENT_APPROVED:/dashboard/estudiante/perfil')
    expect(links).toContain('DOCUMENT_REJECTED:/dashboard/estudiante/perfil')
  })
})
