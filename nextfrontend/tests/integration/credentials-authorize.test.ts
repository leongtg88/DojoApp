import { beforeEach, describe, expect, it } from 'vitest'
import bcrypt from 'bcryptjs'

const { db, resetDb } = await import('./db')
const { createSchool, createBranch } = await import('./fixtures')
const { authorizeCredentials } = await import('@/lib/auth/credentials-authorize')

type TestRole = 'STUDENT' | 'GUARDIAN' | 'INSTRUCTOR' | 'SCHOOL_ADMIN' | 'SUPERADMIN'

const headersFor = (ip: string) => ({ get: (name: string) => (name === 'x-forwarded-for' ? ip : null) })
const HEADERS = headersFor('203.0.113.9')

async function makeUser({
  email,
  password,
  roles = ['STUDENT'],
  verified = true,
  schoolId = null,
}: {
  email: string
  password: string
  roles?: TestRole[]
  verified?: boolean
  schoolId?: string | null
}) {
  return db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      emailVerified: verified ? new Date() : null,
      roles,
      schoolId,
    },
    select: { id: true },
  })
}

beforeEach(resetDb)

// Wiring exacto del login (authorizeCredentials): rate-limit, verificación y gate.
describe('authorizeCredentials', () => {
  it('devuelve el usuario con credenciales válidas', async () => {
    await makeUser({ email: 'admin@test.dev', password: 'Clave1234', roles: ['SCHOOL_ADMIN'] })

    const user = await authorizeCredentials({ email: 'admin@test.dev', password: 'Clave1234' }, HEADERS)

    expect(user).toMatchObject({ email: 'admin@test.dev', roles: ['SCHOOL_ADMIN'] })
    expect(user?.sessionVersion).toBe(0)
  })

  it('rechaza contraseña incorrecta y correo inexistente', async () => {
    await makeUser({ email: 'a@test.dev', password: 'Clave1234', roles: ['SCHOOL_ADMIN'] })

    expect(await authorizeCredentials({ email: 'a@test.dev', password: 'mala' }, HEADERS)).toBeNull()
    expect(await authorizeCredentials({ email: 'nadie@test.dev', password: 'Clave1234' }, HEADERS)).toBeNull()
  })

  it('rechaza credenciales incompletas', async () => {
    expect(await authorizeCredentials({ email: '', password: 'x' }, HEADERS)).toBeNull()
    expect(await authorizeCredentials({ email: 'a@test.dev', password: '' }, HEADERS)).toBeNull()
    expect(await authorizeCredentials(null, HEADERS)).toBeNull()
  })

  it('exige el correo verificado', async () => {
    await makeUser({ email: 'nv@test.dev', password: 'Clave1234', roles: ['SCHOOL_ADMIN'], verified: false })
    expect(await authorizeCredentials({ email: 'nv@test.dev', password: 'Clave1234' }, HEADERS)).toBeNull()
  })

  it('bloquea el correo tras 5 fallos consecutivos (incluso con la clave correcta)', async () => {
    await makeUser({ email: 'lock@test.dev', password: 'Clave1234', roles: ['SCHOOL_ADMIN'] })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await authorizeCredentials({ email: 'lock@test.dev', password: 'mala' }, HEADERS)).toBeNull()
    }

    expect(await authorizeCredentials({ email: 'lock@test.dev', password: 'Clave1234' }, HEADERS)).toBeNull()
  })

  it('un login exitoso reinicia el contador de fallos del correo', async () => {
    await makeUser({ email: 'reset@test.dev', password: 'Clave1234', roles: ['SCHOOL_ADMIN'] })

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await authorizeCredentials({ email: 'reset@test.dev', password: 'mala' }, HEADERS)
    }

    expect(await authorizeCredentials({ email: 'reset@test.dev', password: 'Clave1234' }, HEADERS)).not.toBeNull()
    // Tras el reset, 4 fallos no bloquean (si el reset no hubiera ocurrido, serían 7 y bloquearían).
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await authorizeCredentials({ email: 'reset@test.dev', password: 'mala' }, HEADERS)
    }
    expect(await authorizeCredentials({ email: 'reset@test.dev', password: 'Clave1234' }, HEADERS)).not.toBeNull()
  })

  it('el gate bloquea a un alumno sin expediente y permite con inscripción', async () => {
    const school = await createSchool()
    const branch = await createBranch(school.id)

    const blocked = await makeUser({ email: 'sin@test.dev', password: 'Clave1234', roles: ['STUDENT'], schoolId: school.id })
    await db.student.create({
      data: { userId: blocked.id, schoolId: school.id, branchId: branch.id, firstName: 'Sin', lastName: 'Expediente', dateOfBirth: new Date('2010-01-01T00:00:00.000Z') },
    })
    expect(await authorizeCredentials({ email: 'sin@test.dev', password: 'Clave1234' }, HEADERS)).toBeNull()

    const allowed = await makeUser({ email: 'con@test.dev', password: 'Clave1234', roles: ['STUDENT'], schoolId: school.id })
    const student = await db.student.create({
      data: { userId: allowed.id, schoolId: school.id, branchId: branch.id, firstName: 'Con', lastName: 'Inscripción', dateOfBirth: new Date('2010-01-01T00:00:00.000Z') },
      select: { id: true },
    })
    await db.enrollment.create({ data: { origin: 'FORM', studentId: student.id, contactEmail: 'con@test.dev', status: 'ENROLLED' } })

    expect(await authorizeCredentials({ email: 'con@test.dev', password: 'Clave1234' }, HEADERS)).toMatchObject({ email: 'con@test.dev' })
  })

  it('limita los intentos por IP (60/ventana)', async () => {
    const ip = '198.51.100.7'
    const headers = headersFor(ip)

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await authorizeCredentials({ email: `u${attempt}@test.dev`, password: 'Clave1234' }, headers)
    }

    await makeUser({ email: 'nuevo@test.dev', password: 'Clave1234', roles: ['SCHOOL_ADMIN'] })
    expect(await authorizeCredentials({ email: 'nuevo@test.dev', password: 'Clave1234' }, headers)).toBeNull()
  })
})
