// COPIA AMPLIADA DE PROPUESTA (no ejecutada desde audit/).
// Para ejecutarla, mover a nextfrontend/tests/integration/ y correr la suite de integración.
// Cambio propuesto: INSTRUCTOR y GUARDIAN también son roles incorrectos para /admin.

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
vi.mock('@/lib/document-storage', () => ({
  downloadPrivateDocument: async () => ({ buffer: Buffer.from('x'), contentType: 'image/png' }),
  uploadPrivateDocument: async () => {},
  deletePrivateDocuments: async () => {},
  createPrivateDocumentUrl: async () => 'https://signed.example/x',
  sanitizeStorageName: (name: string) => name,
}))
vi.mock('@/lib/integrations/n8n', () => ({ postToN8n: async () => {} }))
vi.mock('@/lib/pdf/carnet-data', () => ({ generateCarnetForStudent: async () => {} }))

const { db, resetDb } = await import('./db')
const { authMock } = await import('./route-auth')
const { jsonRequest } = await import('./http')
const { createSchool } = await import('./fixtures')

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type Handler = (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>
type Panel = 'admin' | 'instructor' | 'student' | 'user'
type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

interface Entry {
  route: string
  method: HttpMethod
  panel: Panel
  load: () => Promise<Record<string, unknown>>
  params?: Record<string, string>
}

const e = (
  route: string,
  method: HttpMethod,
  panel: Panel,
  load: () => Promise<Record<string, unknown>>,
  params?: Record<string, string>,
): Entry => ({ route, method, panel, load, params })

const ROUTES: Entry[] = [
  // ===== admin =====
  e('admin/attendance', 'GET', 'admin', () => import('@/app/api/dashboard/admin/attendance/route')),
  e('admin/attendance', 'POST', 'admin', () => import('@/app/api/dashboard/admin/attendance/route')),
  e('admin/attendance/pass', 'POST', 'admin', () => import('@/app/api/dashboard/admin/attendance/pass/route')),
  e('admin/attendance/justification/[id]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/attendance/justification/[justificationId]/route'), { justificationId: 'x' }),
  e('admin/belt-ranks', 'GET', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/route')),
  e('admin/belt-ranks', 'POST', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/route')),
  e('admin/belt-ranks/[id]', 'PUT', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/[rankId]/route'), { rankId: 'x' }),
  e('admin/belt-ranks/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/[rankId]/route'), { rankId: 'x' }),
  e('admin/belt-ranks/[id]/katas', 'PUT', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/[rankId]/katas/route'), { rankId: 'x' }),
  e('admin/belt-ranks/apply-curriculum', 'POST', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/apply-curriculum/route')),
  e('admin/belt-ranks/reorder', 'PUT', 'admin', () => import('@/app/api/dashboard/admin/belt-ranks/reorder/route')),
  e('admin/branches', 'GET', 'admin', () => import('@/app/api/dashboard/admin/branches/route')),
  e('admin/classes', 'GET', 'admin', () => import('@/app/api/dashboard/admin/classes/route')),
  e('admin/classes', 'POST', 'admin', () => import('@/app/api/dashboard/admin/classes/route')),
  e('admin/classes/[id]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/classes/[classId]/route'), { classId: 'x' }),
  e('admin/classes/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/classes/[classId]/route'), { classId: 'x' }),
  e('admin/classes/[id]/enroll', 'POST', 'admin', () => import('@/app/api/dashboard/admin/classes/[classId]/enroll/route'), { classId: 'x' }),
  e('admin/classes/[id]/enroll', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/classes/[classId]/enroll/route'), { classId: 'x' }),
  e('admin/enrollments/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/enrollments/[enrollmentId]/route'), { enrollmentId: 'x' }),
  e('admin/enrollments/[id]/convert', 'POST', 'admin', () => import('@/app/api/dashboard/admin/enrollments/[enrollmentId]/convert/route'), { enrollmentId: 'x' }),
  e('admin/exam-convocations', 'GET', 'admin', () => import('@/app/api/dashboard/admin/exam-convocations/route')),
  e('admin/exam-convocations', 'POST', 'admin', () => import('@/app/api/dashboard/admin/exam-convocations/route')),
  e('admin/exam-convocations/[id]', 'PUT', 'admin', () => import('@/app/api/dashboard/admin/exam-convocations/[convocationId]/route'), { convocationId: 'x' }),
  e('admin/exam-convocations/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/exam-convocations/[convocationId]/route'), { convocationId: 'x' }),
  e('admin/holidays', 'GET', 'admin', () => import('@/app/api/dashboard/admin/holidays/route')),
  e('admin/holidays', 'POST', 'admin', () => import('@/app/api/dashboard/admin/holidays/route')),
  e('admin/holidays/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/holidays/[holidayId]/route'), { holidayId: 'x' }),
  e('admin/instructors', 'POST', 'admin', () => import('@/app/api/dashboard/admin/instructors/route')),
  e('admin/plans', 'GET', 'admin', () => import('@/app/api/dashboard/admin/plans/route')),
  e('admin/plans', 'POST', 'admin', () => import('@/app/api/dashboard/admin/plans/route')),
  e('admin/plans/[id]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/plans/[planId]/route'), { planId: 'x' }),
  e('admin/plans/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/plans/[planId]/route'), { planId: 'x' }),
  e('admin/reviews', 'GET', 'admin', () => import('@/app/api/dashboard/admin/reviews/route')),
  e('admin/reviews/[id]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/reviews/[reviewId]/route'), { reviewId: 'x' }),
  e('admin/reviews/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/reviews/[reviewId]/route'), { reviewId: 'x' }),
  e('admin/students', 'GET', 'admin', () => import('@/app/api/dashboard/admin/students/route')),
  e('admin/students', 'POST', 'admin', () => import('@/app/api/dashboard/admin/students/route')),
  e('admin/students/export', 'GET', 'admin', () => import('@/app/api/dashboard/admin/students/export/route')),
  e('admin/students/assign-techniques', 'POST', 'admin', () => import('@/app/api/dashboard/admin/students/assign-techniques/route')),
  e('admin/students/assign-techniques-bulk', 'POST', 'admin', () => import('@/app/api/dashboard/admin/students/assign-techniques-bulk/route')),
  e('admin/students/[id]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/route'), { studentId: 'x' }),
  e('admin/students/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/route'), { studentId: 'x' }),
  e('admin/students/[id]/documents/[doc]', 'GET', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/documents/[documentId]/route'), { studentId: 'x', documentId: 'x' }),
  e('admin/students/[id]/documents/[doc]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/documents/[documentId]/route'), { studentId: 'x', documentId: 'x' }),
  e('admin/students/[id]/documents/[doc]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/documents/[documentId]/route'), { studentId: 'x', documentId: 'x' }),
  e('admin/students/[id]/export', 'GET', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/export/route'), { studentId: 'x' }),
  e('admin/students/[id]/export/zip', 'GET', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/export/zip/route'), { studentId: 'x' }),
  e('admin/students/[id]/export-pdf', 'GET', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/export-pdf/route'), { studentId: 'x' }),
  e('admin/students/[id]/invite', 'POST', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/invite/route'), { studentId: 'x' }),
  e('admin/students/[id]/placement', 'PUT', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/placement/route'), { studentId: 'x' }),
  e('admin/students/[id]/promotions', 'POST', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/promotions/route'), { studentId: 'x' }),
  e('admin/students/[id]/techniques', 'PUT', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/techniques/route'), { studentId: 'x' }),
  e('admin/students/[id]/techniques/[t]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/students/[studentId]/techniques/[techniqueId]/route'), { studentId: 'x', techniqueId: 'x' }),
  e('admin/techniques', 'GET', 'admin', () => import('@/app/api/dashboard/admin/techniques/route')),
  e('admin/techniques', 'POST', 'admin', () => import('@/app/api/dashboard/admin/techniques/route')),
  e('admin/techniques/[id]', 'PATCH', 'admin', () => import('@/app/api/dashboard/admin/techniques/[techniqueId]/route'), { techniqueId: 'x' }),
  e('admin/techniques/[id]', 'DELETE', 'admin', () => import('@/app/api/dashboard/admin/techniques/[techniqueId]/route'), { techniqueId: 'x' }),
  e('admin/techniques/[id]/assign', 'POST', 'admin', () => import('@/app/api/dashboard/admin/techniques/[techniqueId]/assign/route'), { techniqueId: 'x' }),
  e('admin/whatsapp/messages', 'GET', 'admin', () => import('@/app/api/dashboard/admin/whatsapp/messages/route')),
  e('admin/whatsapp/messages', 'POST', 'admin', () => import('@/app/api/dashboard/admin/whatsapp/messages/route')),

  // ===== instructor =====
  e('instructor/attendance', 'POST', 'instructor', () => import('@/app/api/dashboard/instructor/attendance/route')),
  e('instructor/attendance/[id]', 'PATCH', 'instructor', () => import('@/app/api/dashboard/instructor/attendance/[attendanceId]/route'), { attendanceId: 'x' }),
  e('instructor/attendance/confirm-all', 'POST', 'instructor', () => import('@/app/api/dashboard/instructor/attendance/confirm-all/route')),
  e('instructor/attendance/justification/[id]', 'PATCH', 'instructor', () => import('@/app/api/dashboard/instructor/attendance/justification/[justificationId]/route'), { justificationId: 'x' }),
  e('instructor/students', 'GET', 'instructor', () => import('@/app/api/dashboard/instructor/students/route')),
  e('instructor/students/search', 'GET', 'instructor', () => import('@/app/api/dashboard/instructor/students/search/route')),
  e('instructor/students/[id]/katas', 'GET', 'instructor', () => import('@/app/api/dashboard/instructor/students/[studentId]/katas/route'), { studentId: 'x' }),
  e('instructor/techniques', 'POST', 'instructor', () => import('@/app/api/dashboard/instructor/techniques/route')),
  e('instructor/techniques', 'PATCH', 'instructor', () => import('@/app/api/dashboard/instructor/techniques/route')),
  e('instructor/techniques/assign', 'PUT', 'instructor', () => import('@/app/api/dashboard/instructor/techniques/assign/route')),
  e('instructor/techniques/assign-bulk', 'POST', 'instructor', () => import('@/app/api/dashboard/instructor/techniques/assign-bulk/route')),
  e('instructor/techniques/[id]/assign', 'POST', 'instructor', () => import('@/app/api/dashboard/instructor/techniques/[techniqueId]/assign/route'), { techniqueId: 'x' }),

  // ===== student =====
  e('student/absence', 'POST', 'student', () => import('@/app/api/dashboard/student/absence/route')),
  e('student/absence', 'DELETE', 'student', () => import('@/app/api/dashboard/student/absence/route')),
  e('student/documents', 'GET', 'student', () => import('@/app/api/dashboard/student/documents/route')),
  e('student/documents', 'POST', 'student', () => import('@/app/api/dashboard/student/documents/route')),
  e('student/documents', 'DELETE', 'student', () => import('@/app/api/dashboard/student/documents/route')),
  e('student/practice', 'POST', 'student', () => import('@/app/api/dashboard/student/practice/route')),
  e('student/profile', 'PATCH', 'student', () => import('@/app/api/dashboard/student/profile/route')),
  e('student/techniques/[id]', 'PATCH', 'student', () => import('@/app/api/dashboard/student/techniques/[techniqueId]/route'), { techniqueId: 'x' }),
  e('student/techniques/[id]/practice', 'POST', 'student', () => import('@/app/api/dashboard/student/techniques/[techniqueId]/practice/route'), { techniqueId: 'x' }),
  e('student/techniques/[id]/practice', 'DELETE', 'student', () => import('@/app/api/dashboard/student/techniques/[techniqueId]/practice/route'), { techniqueId: 'x' }),

  // ===== notificaciones (cualquier rol del dashboard) =====
  e('notifications', 'GET', 'user', () => import('@/app/api/dashboard/notifications/route')),
  e('notifications', 'PATCH', 'user', () => import('@/app/api/dashboard/notifications/route')),
  e('notifications', 'DELETE', 'user', () => import('@/app/api/dashboard/notifications/route')),
  e('notifications/[id]', 'PATCH', 'user', () => import('@/app/api/dashboard/notifications/[notificationId]/route'), { notificationId: 'x' }),
]

const WRONG_ROLES: Record<Panel, TestRole[]> = {
  admin: ['STUDENT', 'INSTRUCTOR', 'GUARDIAN'],
  instructor: ['STUDENT'],
  student: ['INSTRUCTOR'],
  user: [],
}

async function invoke(entry: Entry): Promise<Response> {
  const mod = await entry.load()
  const handler = mod[entry.method] as Handler
  const request = entry.method === 'GET' ? new Request('http://t/api') : jsonRequest('http://t/api', entry.method, {})
  return handler(request, { params: Promise.resolve(entry.params ?? {}) })
}

async function loginAs(roles: TestRole[], schoolId: string | null) {
  const user = await db.user.create({ data: { email: `u-${randomUUID()}@test.dev`, roles, schoolId } })
  authMock.setUser(user.id, { roles, schoolId })
  return user
}

beforeEach(async () => {
  await resetDb()
  authMock.setUser(null)
})

// Matriz de autorización: ninguna ruta del dashboard responde 2xx sin sesión.
describe('matriz de autorización · sin sesión', () => {
  it.each(ROUTES)('$method $route → 401/403', async (entry) => {
    authMock.setUser(null)
    const response = await invoke(entry)
    expect([401, 403]).toContain(response.status)
  })
})

// Matriz de autorización: rol sin permiso → 403.
describe('matriz de autorización · rol incorrecto', () => {
  it.each(ROUTES.filter((entry) => entry.panel !== 'user'))('$method $route → 403', async (entry) => {
    const school = await createSchool()
    await loginAs(WRONG_ROLES[entry.panel], school.id)
    const response = await invoke(entry)
    expect(response.status).toBe(403)
  })
})

// UX-B1: el tutor usa el mismo portal y debe poder abrir su bandeja.
describe('matriz de autorización · notificaciones del tutor', () => {
  const entry = (route: string, method: HttpMethod): Entry => {
    const found = ROUTES.find((item) => item.route === route && item.method === method)
    if (!found) throw new Error(`Ruta de prueba no encontrada: ${method} ${route}`)
    return found
  }

  it('GUARDIAN puede listar, marcar todas y marcar una notificación', async () => {
    const school = await createSchool()
    await loginAs(['GUARDIAN'], school.id)

    expect((await invoke(entry('notifications', 'GET'))).status).toBe(200)
    expect((await invoke(entry('notifications', 'PATCH'))).status).toBe(200)

    // El rol pasa el guard; la notificación 'x' no existe → 404, no 403.
    expect((await invoke(entry('notifications/[id]', 'PATCH'))).status).toBe(404)
  })
})
