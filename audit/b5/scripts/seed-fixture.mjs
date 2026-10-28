import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL ?? ''
if (!/127\.0\.0\.1:55434\/dojo_audit_b5/.test(url)) {
  throw new Error(`Refusing to seed a non-B5 audit database: ${url}`)
}

const adminBPassword = process.env.ADMIN_B_PASSWORD ?? 'Audit-SchoolB-2026!'
const guardianPassword = process.env.GUARDIAN_PASSWORD ?? 'Audit-Guardian-2026!'
const [adminBHash, guardianHash] = await Promise.all([
  bcrypt.hash(adminBPassword, 12),
  bcrypt.hash(guardianPassword, 12),
])

const client = new pg.Client({ connectionString: url })
await client.connect()

const schoolA = (await client.query('select id from "School" order by id limit 1')).rows[0]?.id
const branchA = (await client.query('select id from "Branch" order by id limit 1')).rows[0]?.id
const juan = (
  await client.query(
    `select s.id from "Student" s join "User" u on u.id = s."userId" where u.email = 'alumno@test.com'`,
  )
).rows[0]?.id
const owner = (
  await client.query(
    `select s.id from "Student" s join "User" u on u.id = s."userId" where u.email = 'sensei@toseigusoku.com'`,
  )
).rows[0]?.id
const adminA = (await client.query(`select id from "User" where email = 'admin@toseigusoku.com'`)).rows[0]?.id

if (!schoolA || !branchA || !juan || !owner || !adminA) {
  throw new Error('Seed base incompleto: falta school/branch/Juan/owner/admin')
}

const schoolB = 'audit-school-b'
const branchB = 'audit-branch-b'
const classB = 'audit-class-b'
const studentB = 'audit-student-b'

await client.query('begin')

// ===== Escuela B =====
await client.query(
  `insert into "School" (id, name, "createdAt", "updatedAt")
   values ($1, 'Dojo Auditoría B', now(), now())
   on conflict (id) do update set name = excluded.name, "updatedAt" = now()`,
  [schoolB],
)
await client.query(
  `insert into "Branch" (id, name, "schoolId", "createdAt", "updatedAt")
   values ($1, 'Sucursal B', $2, now(), now())
   on conflict (id) do update set name = excluded.name, "schoolId" = excluded."schoolId", "updatedAt" = now()`,
  [branchB, schoolB],
)
await client.query(
  `insert into "User" (id, email, "emailVerified", "passwordHash", name, roles, "schoolId", "branchId", "createdAt", "updatedAt", "sessionVersion")
   values ('audit-admin-b', 'admin.b@audit.test', now(), $1, 'Admin Escuela B', array['SCHOOL_ADMIN']::"Role"[], $2, $3, now(), now(), 0)
   on conflict (email) do update set
     "passwordHash" = excluded."passwordHash", roles = excluded.roles,
     "schoolId" = excluded."schoolId", "branchId" = excluded."branchId", "updatedAt" = now()`,
  [adminBHash, schoolB, branchB],
)
await client.query(
  `insert into "Class" (id, name, "branchId", "dayOfWeek", "startTime", "endTime", "updatedAt")
   values ($1, 'Karate B', $2, 2, '18:00', '19:30', now())
   on conflict (id) do update set name = excluded.name, "branchId" = excluded."branchId", "updatedAt" = now()`,
  [classB, branchB],
)
await client.query(
  `insert into "Student" (id, "schoolId", "branchId", "firstName", "lastName", "dateOfBirth", status, "currentRank", "currentRankId", "planId", "createdAt", "updatedAt")
   values ($1, $2, $3, 'Beto', 'Escuela B', '2013-04-12T00:00:00Z', 'ACTIVE'::"StudentStatus", 'Blanco', 'belt-youth-01-blanco', null, now(), now())
   on conflict (id) do update set "schoolId" = excluded."schoolId", "branchId" = excluded."branchId", "updatedAt" = now()`,
  [studentB, schoolB, branchB],
)
await client.query(
  `insert into "Enrollment" (id, origin, "schoolId", "branchId", "contactEmail", "applicantName", status, "updatedAt")
   values ('audit-enrollment-b', 'FORM'::"EnrollmentOrigin", $1, $2, 'pendiente-b@audit.test', 'Pendiente B', 'PENDING'::"EnrollmentStatus", now())
   on conflict ("contactEmail", status) do update set "updatedAt" = now()`,
  [schoolB, branchB],
)
await client.query(
  `insert into "StudentDocument" (id, "studentId", type, status, "fileName", "storageKey", "mimeType", "fileSize", "updatedAt")
   values ('audit-doc-b', $1, 'IDENTITY'::"StudentDocumentType", 'PENDING'::"StudentDocumentStatus", 'documento-b.pdf', 'audit/doc-b.pdf', 'application/pdf', 1200, now())
   on conflict ("storageKey") do update set status = excluded.status, "updatedAt" = now()`,
  [studentB],
)

// ===== Escuela A: pendientes =====
await client.query(
  `insert into "Enrollment" (id, origin, "schoolId", "branchId", "contactEmail", "applicantName", status, "updatedAt")
   values ('audit-enrollment-a', 'FORM'::"EnrollmentOrigin", $1, $2, 'pendiente-a@audit.test', 'Pendiente A', 'PENDING'::"EnrollmentStatus", now())
   on conflict ("contactEmail", status) do update set "updatedAt" = now()`,
  [schoolA, branchA],
)
await client.query(
  `insert into "StudentDocument" (id, "studentId", type, status, "fileName", "storageKey", "mimeType", "fileSize", "updatedAt")
   values ('audit-doc-a', $1, 'IDENTITY'::"StudentDocumentType", 'PENDING'::"StudentDocumentStatus", 'documento-a.pdf', 'audit/doc-a.pdf', 'application/pdf', 1200, now())
   on conflict ("storageKey") do update set status = excluded.status, "updatedAt" = now()`,
  [juan],
)
await client.query(
  `insert into "AbsenceJustification" (id, "studentId", "classId", date, reason, status, "updatedAt")
   values ('audit-just-a', $1, 'class-adult-regular', '2026-10-20T00:00:00Z', 'Justificación de auditoría', 'PENDING'::"AbsenceJustificationStatus", now())
   on conflict ("studentId", "classId", date) do update set status = excluded.status, reason = excluded.reason, "updatedAt" = now()`,
  [juan],
)

// ===== Alumnos para probar contadores =====
await client.query(
  `insert into "Student" (id, "schoolId", "branchId", "firstName", "lastName", "dateOfBirth", status, "currentRank", "currentRankId", "planId", "createdAt", "updatedAt")
   values ('audit-student-inactive', $1, $2, 'Inactivo', 'Auditoría', '2011-01-01T00:00:00Z', 'INACTIVE'::"StudentStatus", 'Blanco', 'belt-youth-01-blanco', null, now(), now())
   on conflict (id) do update set status = excluded.status, "updatedAt" = now()`,
  [schoolA, branchA],
)
await client.query(
  `insert into "Student" (id, "schoolId", "branchId", "firstName", "lastName", "dateOfBirth", status, "currentRank", "currentRankId", "planId", "createdAt", "updatedAt")
   values ('audit-student-sin-plan', $1, $2, 'Sin Plan', 'Con Horario', '2012-02-02T00:00:00Z', 'ACTIVE'::"StudentStatus", 'Blanco', 'belt-youth-01-blanco', null, now(), now())
   on conflict (id) do update set status = excluded.status, "updatedAt" = now()`,
  [schoolA, branchA],
)
await client.query(
  `insert into "Student" (id, "schoolId", "branchId", "firstName", "lastName", "dateOfBirth", status, "currentRank", "currentRankId", "planId", "createdAt", "updatedAt")
   values ('audit-student-sin-horario', $1, $2, 'Sin Horario', 'Con Plan', '2012-03-03T00:00:00Z', 'ACTIVE'::"StudentStatus", 'Blanco', 'belt-youth-01-blanco', 'plan-basico', now(), now())
   on conflict (id) do update set status = excluded.status, "planId" = excluded."planId", "updatedAt" = now()`,
  [schoolA, branchA],
)
await client.query(
  `insert into "ClassEnrollment" (id, "classId", "studentId", status, "updatedAt")
   values ('audit-enrollment-sin-plan', 'class-adult-regular', 'audit-student-sin-plan', 'ACTIVE'::"ClassEnrollmentStatus", now())
   on conflict ("classId", "studentId") do update set status = excluded.status, "updatedAt" = now()`,
)

// ===== Reposición online existente (para la tab de Asistencia) =====
await client.query(
  `insert into "Attendance" (id, "studentId", "classId", date, present, "hoursTrained", status, "punchedAt", "updatedAt")
   values ('audit-absence-online', $1, 'class-adult-regular', '2026-09-15T00:00:00Z', false, 1, 'ABSENT'::"AttendanceStatus", now(), now())
   on conflict (id) do update set status = excluded.status, "updatedAt" = now()`,
  [juan],
)
await client.query(
  `insert into "OnlineRecovery" (id, "studentId", "absenceId", status, "scheduledAt", "durationMinutes", "createdById", "updatedAt")
   values ('audit-online-recovery', $1, 'audit-absence-online', 'SCHEDULED'::"OnlineRecoveryStatus", '2026-11-05T15:00:00Z', 35, $2, now())
   on conflict ("absenceId") do update set status = excluded.status, "scheduledAt" = excluded."scheduledAt", "updatedAt" = now()`,
  [juan, adminA],
)

// ===== Tutor sin hijos (solo para autorización) =====
await client.query(
  `insert into "User" (id, email, "emailVerified", "passwordHash", name, roles, "schoolId", "branchId", "createdAt", "updatedAt", "sessionVersion")
   values ('audit-guardian-user', 'guardian@audit.test', now(), $1, 'Tutor Auditoría', array['GUARDIAN']::"Role"[], $2, $3, now(), now(), 0)
   on conflict (email) do update set "passwordHash" = excluded."passwordHash", roles = excluded.roles, "updatedAt" = now()`,
  [guardianHash, schoolA, branchA],
)

await client.query('commit')

const fixtures = {
  schoolA,
  branchA,
  schoolB,
  branchB,
  adminA,
  juanStudentId: juan,
  ownerStudentId: owner,
  adminBEmail: 'admin.b@audit.test',
  guardianEmail: 'guardian@audit.test',
  expected: {
    A: { pendingEnrollments: 1, pendingDocuments: 1, noPlan: 3, noSchedule: 3, pendingJustifications: 1, onlineRecoveries: 1, students: 5 },
    B: { pendingEnrollments: 1, pendingDocuments: 1, noPlan: 1, noSchedule: 1, students: 1 },
  },
  fixtureIds: {
    enrollmentA: 'audit-enrollment-a',
    documentA: 'audit-doc-a',
    justificationA: 'audit-just-a',
    onlineRecoveryA: 'audit-online-recovery',
    inactiveStudent: 'audit-student-inactive',
    sinPlanStudent: 'audit-student-sin-plan',
    sinHorarioStudent: 'audit-student-sin-horario',
    studentB,
  },
}
const reportsDir = path.resolve(import.meta.dirname, '..', 'reports')
fs.mkdirSync(reportsDir, { recursive: true })
fs.writeFileSync(path.join(reportsDir, 'fixtures.json'), JSON.stringify(fixtures, null, 2))
console.log(JSON.stringify(fixtures, null, 2))

await client.end()
