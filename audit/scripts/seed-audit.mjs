import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const auditDir = path.resolve(import.meta.dirname, '..')
const url = process.env.DATABASE_URL ?? ''
if (!/127\.0\.0\.1:55433\/dojo_audit/.test(url)) {
  throw new Error(`Refusing to seed a non-audit database: ${url}`)
}

const guardianPassword = process.env.GUARDIAN_PASSWORD ?? 'Audit-Guardian-2026!'
const hash = await bcrypt.hash(guardianPassword, 12)

const client = new pg.Client({ connectionString: url })
await client.connect()

const school = await client.query('select id from "School" order by id limit 1')
const branch = await client.query('select id from "Branch" order by id limit 1')
const juan = await client.query(
  `select s.id from "Student" s join "User" u on u.id = s."userId" where u.email = 'alumno@test.com'`,
)
const owner = await client.query(
  `select s.id from "Student" s join "User" u on u.id = s."userId" where u.email = 'sensei@toseigusoku.com'`,
)
const studentUser = await client.query(`select id from "User" where email = 'alumno@test.com'`)
if (!school.rows[0] || !branch.rows[0] || !juan.rows[0] || !owner.rows[0] || !studentUser.rows[0]) {
  throw new Error('Seed base incompleto: falta school/branch/Juan/owner/studentUser')
}

const schoolId = school.rows[0].id
const branchId = branch.rows[0].id
const juanId = juan.rows[0].id
const ownerStudentId = owner.rows[0].id
const studentUserId = studentUser.rows[0].id

await client.query('begin')

// Tutor de auditoría (GUARDIAN sin expediente propio).
await client.query(
  `insert into "User" (id, email, "emailVerified", "passwordHash", name, roles, "schoolId", "branchId", "createdAt", "updatedAt", "sessionVersion")
   values ('audit-guardian-user', 'tutor@audit.test', now(), $1, 'Tutor de Auditoría', array['GUARDIAN']::"Role"[], $2, $3, now(), now(), 0)
   on conflict (email) do update set
     "passwordHash" = excluded."passwordHash",
     roles = excluded.roles,
     name = excluded.name,
     "updatedAt" = now()`,
  [hash, schoolId, branchId],
)

// Hijo 1: Juan (ya existe y tiene datos). Se vincula al tutor.
await client.query(
  `update "Student" set "guardianId" = 'audit-guardian-user', "updatedAt" = now() where id = $1`,
  [juanId],
)
await client.query(
  `insert into "GuardianStudent" ("guardianId", "studentId", relationship)
   values ('audit-guardian-user', $1, 'Tutor legal')
   on conflict ("guardianId", "studentId") do nothing`,
  [juanId],
)

// Hijo 2: Ana (expediente nuevo, sin cuenta propia).
await client.query(
  `insert into "Student" (id, "userId", "guardianId", "schoolId", "branchId", "firstName", "lastName", "dateOfBirth", gender, status, "currentRank", "currentRankId", "planId", "planStartDate", "scholarshipType", "isCompetitor", "createdAt", "updatedAt")
   values ('audit-child-ana', null, 'audit-guardian-user', $1, $2, 'Ana', 'Pérez', '2014-03-10T00:00:00Z', 'FEMALE'::"Gender", 'ACTIVE'::"StudentStatus", 'Blanco', 'belt-youth-01-blanco', 'plan-basico', now(), 'NONE'::"ScholarshipType", false, now(), now())
   on conflict (id) do update set
     "guardianId" = excluded."guardianId",
     "firstName" = excluded."firstName",
     "lastName" = excluded."lastName",
     "updatedAt" = now()`,
  [schoolId, branchId],
)
await client.query(
  `insert into "GuardianStudent" ("guardianId", "studentId", relationship)
   values ('audit-guardian-user', 'audit-child-ana', 'Tutor legal')
   on conflict ("guardianId", "studentId") do nothing`,
)
await client.query(
  `insert into "ClassEnrollment" (id, "classId", "studentId", status, "updatedAt")
   values ('audit-enrollment-ana', 'schedule-child-tue', 'audit-child-ana', 'ACTIVE'::"ClassEnrollmentStatus", now())
   on conflict ("classId", "studentId") do update set status = 'ACTIVE'::"ClassEnrollmentStatus", "updatedAt" = now()`,
)

// Notificaciones de auditoría: una con enlace viejo y contexto de Ana,
// otra de técnicas (semánticamente debería ir a Entrenar) y una de control.
await client.query(
  `insert into "Notification" (id, "userId", "studentId", type, title, body, link, priority, "readAt")
   values
     ('audit-notif-ana-old', 'audit-guardian-user', 'audit-child-ana', 'CLASS_ENROLLED'::"NotificationType", 'Horario asignado (Ana)', 'Se asignó un horario a Ana.', '/dashboard/estudiante/horario', 'ACTION'::"NotificationPriority", null),
     ('audit-notif-juan-tec', 'audit-guardian-user', $1, 'TECHNIQUES_ASSIGNED'::"NotificationType", 'Nuevas técnicas asignadas (Juan)', 'Juan tiene 3 técnicas nuevas para practicar.', '/dashboard/estudiante/progreso', 'ACTION'::"NotificationPriority", null),
     ('audit-notif-juan-class', 'audit-guardian-user', $1, 'CLASS_ENROLLED'::"NotificationType", 'Horario asignado (Juan)', 'Se asignó un horario a Juan.', '/dashboard/estudiante/clases', 'INFO'::"NotificationPriority", null)
   on conflict (id) do update set
     "studentId" = excluded."studentId",
     link = excluded.link,
     title = excluded.title,
     body = excluded.body,
     "readAt" = null`,
  [juanId],
)

// Notificaciones del alumno: la de técnicas apunta a Progreso, pero el
// syllabus vive en Entrenar. La de horario es el control correcto.
await client.query(
  `insert into "Notification" (id, "userId", "studentId", type, title, body, link, priority, "readAt")
   values
     ('audit-notif-student-tec', $2, $1, 'TECHNIQUES_ASSIGNED'::"NotificationType", 'Técnicas nuevas para practicar (Juan)', 'Tu Sensei te asignó 3 técnicas nuevas.', '/dashboard/estudiante/progreso', 'ACTION'::"NotificationPriority", null),
     ('audit-notif-student-class', $2, $1, 'CLASS_ENROLLED'::"NotificationType", 'Horario asignado (Juan)', 'Se asignó un horario a Juan.', '/dashboard/estudiante/clases', 'ACTION'::"NotificationPriority", null)
   on conflict (id) do update set
     "studentId" = excluded."studentId",
     link = excluded.link,
     title = excluded.title,
     body = excluded.body,
     "readAt" = null`,
  [juanId, studentUserId],
)

await client.query('commit')

const fixtures = {
  guardianUserId: 'audit-guardian-user',
  guardianEmail: 'tutor@audit.test',
  juanStudentId: juanId,
  anaStudentId: 'audit-child-ana',
  ownerStudentId,
  schoolId,
  branchId,
  studentUserId,
  notificationIds: [
    'audit-notif-ana-old',
    'audit-notif-juan-tec',
    'audit-notif-juan-class',
    'audit-notif-student-tec',
    'audit-notif-student-class',
  ],
}
fs.writeFileSync(path.join(auditDir, 'reports', 'fixtures.json'), JSON.stringify(fixtures, null, 2))
console.log(JSON.stringify(fixtures, null, 2))

await client.end()
