import { PrismaClient, Role, ClassAudience } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import { ADULT_RANKS, YOUTH_RANKS, KATAS, examDayForRank, type Program } from '@/lib/curriculum/programs'
import { syncKihonCatalog } from '@/lib/curriculum/kihon-sync'
import { dominicanHolidays } from '@/lib/dashboard/holidays'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

// Credenciales del seed. Nunca quedan en texto plano en el repo: si las variables
// SEED_*_PASSWORD están definidas en .env.local (fuera del repo) se usan esas;
// si no, se genera una contraseña aleatoria y se muestra una sola vez al ejecutar.
const randomPassword = () => crypto.randomBytes(12).toString('base64url')
const seedPasswords = {
  owner: process.env.SEED_OWNER_PASSWORD || randomPassword(),
  admin: process.env.SEED_ADMIN_PASSWORD || randomPassword(),
  instructor: process.env.SEED_INSTRUCTOR_PASSWORD || randomPassword(),
  student: process.env.SEED_STUDENT_PASSWORD || randomPassword(),
}

// En re-seeds, si la variable SEED_*_PASSWORD está definida explícitamente se
// actualiza el passwordHash (e invalida sesiones viejas) de la cuenta existente;
// si no, no se pisa la contraseña actual.
const pwdUpdate = (envKey: string, hash: string) =>
  process.env[envKey] ? { passwordHash: hash, sessionVersion: { increment: 1 } } : {}

async function main() {
  const school = await db.school.upsert({
    where: { id: 'tosei-gusoku-school' },
    update: {},
    create: { id: 'tosei-gusoku-school', name: 'Tosei Gusoku' },
  })

  const branch = await db.branch.upsert({
    where: { id: 'tosei-gusoku-main-branch' },
    update: {},
    create: { id: 'tosei-gusoku-main-branch', name: 'Sucursal principal', schoolId: school.id },
  })

  // ============ FERIADOS (RD, global) ============
  // Se siembran para poder verlos/ajustarlos desde el admin. El cálculo de horas
  // disponibles también aplica los feriados oficiales aunque no estén en la BD.
  const currentYear = new Date().getFullYear()
  for (const year of [currentYear, currentYear + 1]) {
    for (const holiday of dominicanHolidays(year)) {
      const month = String(holiday.date.getMonth() + 1).padStart(2, '0')
      const day = String(holiday.date.getDate()).padStart(2, '0')
      const id = `holiday-${year}-${month}-${day}`
      await db.holiday.upsert({
        where: { id },
        update: { name: holiday.name, date: holiday.date, recurring: false },
        create: { id, name: holiday.name, date: holiday.date, recurring: false, schoolId: null },
      })
    }
  }

  // ============ PLANES / MENSUALIDADES ============
  const PLANS = [
    { id: 'plan-basico', name: 'Básico', description: '1 a 2 clases por semana.', monthlyHours: 8, price: 2500, isUnlimited: false },
    { id: 'plan-full', name: 'Full', description: 'Clases ilimitadas en horarios regulares.', monthlyHours: 12, price: 3500, isUnlimited: false },
    { id: 'plan-competidor', name: 'Competidor', description: 'Alto rendimiento con horas extendidas.', monthlyHours: 24, price: 4500, isUnlimited: false },
    { id: 'plan-beca', name: 'Beca', description: 'Plan especial con apoyo económico o por mérito.', monthlyHours: 12, price: 0, isUnlimited: false },
  ] as const
  for (const [index, plan] of PLANS.entries()) {
    await db.plan.upsert({
      where: { id: plan.id },
      update: { name: plan.name, description: plan.description, monthlyHours: plan.monthlyHours, price: plan.price, currency: 'DOP', isUnlimited: plan.isUnlimited, sortOrder: index + 1, schoolId: school.id },
      create: { ...plan, sortOrder: index + 1, schoolId: school.id },
    })
  }

  // ============ HORARIOS (un bloque por día; los horarios multidía comparten nombre) ============
  // Prisma 7 exige ISO-8601 (o Date) para columnas TIME; se normaliza HH:MM -> 1970-01-01THH:MM:00.000Z
  const toTimeInput = (t: string) => `1970-01-01T${t}:00.000Z`
  const SCHEDULES = [
    { id: 'schedule-adult-mon', name: 'Adultos Noche', audience: 'ADULTS', dayOfWeek: 1, startTime: '19:00', endTime: '20:30', description: 'Lunes - Clase de adultos/avanzados.' },
    { id: 'schedule-adult-wed', name: 'Adultos Noche', audience: 'ADULTS', dayOfWeek: 3, startTime: '19:00', endTime: '20:30', description: 'Miércoles - Clase de adultos/avanzados.' },
    { id: 'schedule-child-tue', name: 'Niños Tarde', audience: 'CHILDREN', dayOfWeek: 2, startTime: '16:00', endTime: '17:30', description: 'Martes - Clase de niños.' },
    { id: 'schedule-child-thu', name: 'Niños Tarde', audience: 'CHILDREN', dayOfWeek: 4, startTime: '16:00', endTime: '17:30', description: 'Jueves - Clase de niños.' },
    { id: 'schedule-mixed-sat', name: 'Mixta Sábado', audience: 'MIXED', dayOfWeek: 6, startTime: '09:00', endTime: '10:30', description: 'Sábado - Clase mixta (niños y adultos).' },
    { id: 'schedule-adult-fri', name: 'Adultos Noche', audience: 'ADULTS', dayOfWeek: 5, startTime: '19:00', endTime: '20:30', description: 'Viernes - Clase de adultos/avanzados.' },
    { id: 'schedule-mixed-sun', name: 'Mixta Domingo', audience: 'MIXED', dayOfWeek: 0, startTime: '09:00', endTime: '10:30', description: 'Domingo - Clase mixta (niños y adultos).' },
  ] as const
  for (const schedule of SCHEDULES) {
    await db.class.upsert({
      where: { id: schedule.id },
      update: { name: schedule.name, audience: schedule.audience as ClassAudience, dayOfWeek: schedule.dayOfWeek, startTime: toTimeInput(schedule.startTime), endTime: toTimeInput(schedule.endTime), description: schedule.description, active: true },
      create: { ...schedule, audience: schedule.audience as ClassAudience, branchId: branch.id, startTime: toTimeInput(schedule.startTime), endTime: toTimeInput(schedule.endTime), active: true },
    })
  }

  // Limpieza del catálogo legado. Es DESTRUCTIVA: borra el historial de grados y
  // las katas asignadas de TODOS los alumnos, por lo que sólo se ejecuta con
  // SEED_RESET=1 (pensada para una base de desarrollo). En re-seeds normales se
  // omite para no perder datos reales.
  if (process.env.SEED_RESET === '1') {
    console.log('SEED_RESET=1 → limpieza del catálogo legado (borra historial de grados y técnicas de alumnos)…')
    await db.$transaction([
      db.beltRankKata.deleteMany(),
      db.studentRankHistory.deleteMany(),
      db.studentTechnique.deleteMany(),
      db.technique.deleteMany(),
      db.beltRank.deleteMany(),
    ])
  } else {
    console.log('Limpieza de catálogo omitida (usa SEED_RESET=1 para forzarla).')
  }

  // ============ GRADOS por programa (primero, para que las katas puedan referenciarlos) ============
  // Los grados globales tienen un índice único parcial (program, order) WHERE
  // schoolId IS NULL. Para renumerar sin choques, aparcamos primero los grados
  // canónicos en órdenes temporales distintos (no-op si ya se borraron).
  for (const [index, rank] of [...ADULT_RANKS, ...YOUTH_RANKS].entries()) {
    await db.beltRank.updateMany({ where: { id: rank.id }, data: { order: -(index + 1) } })
  }

  for (const [program, ranks] of [['ADULT', ADULT_RANKS], ['YOUTH', YOUTH_RANKS]] as const) {
    for (const rank of ranks) {
      await db.beltRank.upsert({
        where: { id: rank.id },
        update: {
          program: program as Program,
          name: rank.name,
          kyuDan: rank.kyuDan,
          japaneseName: rank.japaneseName,
          kanji: rank.kanji,
          order: rank.order,
          beltColor: rank.beltColor,
          beltSecondaryColor: rank.beltSecondaryColor ?? null,
          description: rank.description ?? null,
          isMaximumRank: rank.isMaximumRank,
          minMonths: rank.minMonths,
          maxMonths: rank.maxMonths,
          estimatedDurationMonths: rank.maxMonths ?? rank.minMonths,
          minAttendancePercent: 80,
          examDay: examDayForRank(program, rank.order),
          schoolId: null,
        },
        create: {
          id: rank.id,
          program: program as Program,
          name: rank.name,
          kyuDan: rank.kyuDan,
          japaneseName: rank.japaneseName,
          kanji: rank.kanji,
          order: rank.order,
          beltColor: rank.beltColor,
          beltSecondaryColor: rank.beltSecondaryColor ?? null,
          description: rank.description ?? null,
          isMaximumRank: rank.isMaximumRank,
          minMonths: rank.minMonths,
          maxMonths: rank.maxMonths,
          estimatedDurationMonths: rank.maxMonths ?? rank.minMonths,
          minAttendancePercent: 80,
          examDay: examDayForRank(program, rank.order),
          schoolId: null,
        },
      })
    }
  }

  // ============ KATAS (catálogo global, reutilizan Technique.category = KATA) ============
  const kataNameToId = new Map<string, string>()
  for (const kata of KATAS) {
    const created = await db.technique.upsert({
      where: { id: kata.id },
      update: {
        name: kata.name,
        kanji: kata.kanji,
        category: 'KATA',
        order: kata.order,
        schoolId: null,
      },
      create: {
        id: kata.id,
        name: kata.name,
        kanji: kata.kanji,
        category: 'KATA',
        order: kata.order,
        schoolId: null,
      },
    })
    kataNameToId.set(created.name, created.id)
  }

  // ============ KIHON (catálogo global de fundamentos) ============
  // Se re-sincroniza aquí para que un SEED_RESET no deje el catálogo Kihon
  // vacío: el reset borra todas las técnicas y solo se recrean las katas.
  const kihonCount = await syncKihonCatalog(db)
  console.log(`Kihon sincronizados: ${kihonCount}`)

  // ============ VINCULACIÓN grado ↔ katas requeridas (BeltRankKata) ============
  for (const ranks of [ADULT_RANKS, YOUTH_RANKS]) {
    for (const rank of ranks) {
      await db.beltRankKata.createMany({
        data: rank.katas.flatMap((kataName, index) => {
          const kataId = kataNameToId.get(kataName)
          if (!kataId) return []
          return [{ beltRankId: rank.id, kataId, order: index + 1 }]
        }),
        skipDuplicates: true,
      })
    }
  }

  const adminPassword = await bcrypt.hash(seedPasswords.admin, 12)

  await db.user.upsert({
    where: { email: 'admin@toseigusoku.com' },
    update: pwdUpdate('SEED_ADMIN_PASSWORD', adminPassword),
    create: {
      email: 'admin@toseigusoku.com',
      passwordHash: adminPassword,
      name: 'Administrador Tosei Gusoku',
      roles: [Role.SCHOOL_ADMIN],
      emailVerified: new Date(),
      schoolId: school.id,
      branchId: branch.id,
    },
  })

  const instructorPassword = await bcrypt.hash(seedPasswords.instructor, 12)

  const instructor = await db.user.upsert({
    where: { email: 'instructor@toseigusoku.com' },
    update: pwdUpdate('SEED_INSTRUCTOR_PASSWORD', instructorPassword),
    create: {
      email: 'instructor@toseigusoku.com',
      passwordHash: instructorPassword,
      name: 'Instructor Principal',
      roles: [Role.INSTRUCTOR],
      emailVerified: new Date(),
      schoolId: school.id,
      branchId: branch.id,
      instructorProfile: {
        create: {
          bio: 'Instructor principal de Tosei Gusoku.',
          specialties: ['Kihon', 'Kata', 'Defensa personal'],
        },
      },
    },
  })

  const studentPassword = await bcrypt.hash(seedPasswords.student, 12)

  const studentUser = await db.user.upsert({
    where: { email: 'alumno@test.com' },
    update: pwdUpdate('SEED_STUDENT_PASSWORD', studentPassword),
    create: {
      email: 'alumno@test.com',
      passwordHash: studentPassword,
      name: 'Juan Pérez',
      roles: [Role.STUDENT],
      emailVerified: new Date(),
      schoolId: school.id,
      branchId: branch.id,
    },
  })

  // Demo: alumno menor (2012 → programa YOUTH). Entra como cinturón blanco por
  // defecto con su currículo de katas precargado (siguiente grado).
  const student = await db.student.upsert({
    where: { userId: studentUser.id },
    update: {
      currentRank: 'Blanco',
      currentRankId: 'belt-youth-01-blanco',
      firstName: 'Juan',
      lastName: 'Pérez',
      planId: 'plan-basico',
      planStartDate: new Date(),
      scholarshipType: 'MERIT',
      scholarshipNote: 'Programa piloto de API: apoyo por mérito en el tatami.',
      isCompetitor: false,
    },
    create: {
      userId: studentUser.id,
      schoolId: school.id,
      branchId: branch.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: new Date('2012-05-20'),
      gender: 'MALE',
      contactPhone: '+18095551234',
      medicalInfo: null,
      emergencyContact: 'María Pérez - +18095550000',
      currentRank: 'Blanco',
      currentRankId: 'belt-youth-01-blanco',
      status: 'ACTIVE',
      planId: 'plan-basico',
      planStartDate: new Date(),
      scholarshipType: 'MERIT',
      scholarshipNote: 'Programa piloto de API: apoyo por mérito en el tatami.',
      isCompetitor: false,
    },
  })

  // Inscripción demo del estudiante: el gate de login exige que una cuenta
  // cuya única función sea STUDENT provenga de una inscripción.
  await db.enrollment.upsert({
    where: { contactEmail_status: { contactEmail: 'alumno@test.com', status: 'ENROLLED' } },
    update: {},
    create: {
      origin: 'ASSISTANT',
      schoolId: school.id,
      branchId: branch.id,
      applicantName: 'Juan Pérez',
      contactEmail: 'alumno@test.com',
      status: 'ENROLLED',
      studentId: student.id,
    },
  })

  // Cuenta owner multirol (principal del dojo). Datos genéricos: se autocompletan desde su perfil en el panel del estudiante.
  const ownerPassword = await bcrypt.hash(seedPasswords.owner, 12)

  const ownerUser = await db.user.upsert({
    where: { email: 'sensei@toseigusoku.com' },
    update: pwdUpdate('SEED_OWNER_PASSWORD', ownerPassword),
    create: {
      email: 'sensei@toseigusoku.com',
      passwordHash: ownerPassword,
      name: 'Sensei Tosei Gusoku',
      roles: [Role.SUPERADMIN, Role.SCHOOL_ADMIN, Role.INSTRUCTOR, Role.STUDENT],
      emailVerified: new Date(),
      schoolId: school.id,
      branchId: branch.id,
      instructorProfile: {
        create: {
          bio: 'Instructor titular del dojo Tosei Gusoku.',
          specialties: ['Kihon', 'Kata', 'Kumite', 'Defensa personal'],
        },
      },
    },
  })

  await db.student.upsert({
    where: { userId: ownerUser.id },
    // No se fuerza el grado en re-seeds: respeta el grado real del expediente.
    // El expediente del owner no es un alumno que entrene: no cuenta en
    // los pendientes de "sin plan/sin horario".
    update: { excludeFromPendingCounts: true },
    create: {
      userId: ownerUser.id,
      schoolId: school.id,
      branchId: branch.id,
      firstName: 'Sensei',
      lastName: 'Tosei Gusoku',
      dateOfBirth: new Date('1990-01-01'),
      medicalInfo: null,
      emergencyContact: null,
      currentRank: 'Nidan',
      currentRankId: 'belt-adult-13-nidan',
      status: 'ACTIVE',
      excludeFromPendingCounts: true,
    },
  })

  const regularClass = await db.class.upsert({
    where: { id: 'class-adult-regular' },
    update: {},
    create: {
      id: 'class-adult-regular',
      name: 'Karate general',
      description: 'Kihon, kata y preparación física.',
      branchId: branch.id,
      instructorId: instructor.id,
      dayOfWeek: 2,
      startTime: toTimeInput('19:00'),
      endTime: toTimeInput('20:30'),
    },
  })

  await db.classEnrollment.upsert({
    where: { classId_studentId: { classId: regularClass.id, studentId: student.id } },
    update: { status: 'ACTIVE', endedAt: null },
    create: { classId: regularClass.id, studentId: student.id, status: 'ACTIVE' },
  })

  // Horario de referencia del alumno demo: un alumno activo en una clase de
  // cada día de la semana (INV-04), para que el pase de lista del instructor
  // tenga roster sin depender del día en que se ejecute la suite o se use la app.
  for (const schedule of SCHEDULES) {
    await db.classEnrollment.upsert({
      where: { classId_studentId: { classId: schedule.id, studentId: student.id } },
      update: { status: 'ACTIVE', endedAt: null },
      create: { classId: schedule.id, studentId: student.id, status: 'ACTIVE' },
    })
  }

  // Asigna el instructor principal a los bloques de horario del dojo.
  await db.class.updateMany({
    where: {
      id: { in: SCHEDULES.map((schedule) => schedule.id) },
    },
    data: { instructorId: instructor.id },
  })

  // Historial de grado del demo: ingresó como blanco (YOUTH).
  await db.studentRankHistory.upsert({
    where: { id: 'rank-history-juan-white' },
    update: {},
    create: {
      id: 'rank-history-juan-white',
      studentId: student.id,
      beltRankId: 'belt-youth-01-blanco',
      promotedBy: instructor.id,
      notes: 'Grado inicial registrado.',
    },
  })

  // Currículo precargado: las katas del siguiente grado (Blanco/Amarillo) quedan
  // asignadas al expediente como PENDING para que el dashboard las muestre.
  const juanKataIds = ['kata-kihon-ichi', 'kata-kihon-ni', 'kata-kihon-san', 'kata-kihon-shi', 'kata-kihon-go']
  await db.studentTechnique.createMany({
    data: juanKataIds.map((kataId) => ({ studentId: student.id, techniqueId: kataId })),
    skipDuplicates: true,
  })

  // Asistencias demo del alumno (punch-in): 2 confirmadas + 1 pendiente
  const today = new Date()
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(today.getDate() - 2)
  const sixDaysAgo = new Date(today)
  sixDaysAgo.setDate(today.getDate() - 6)

  await db.attendance.upsert({
    where: { id: 'att-demo-punch-1' },
    update: {},
    create: {
      id: 'att-demo-punch-1',
      studentId: student.id,
      date: twoDaysAgo,
      hoursTrained: 1.5,
      sessionType: 'Kihon & Katas',
      status: 'CONFIRMED',
      punchedAt: twoDaysAgo,
      confirmedAt: twoDaysAgo,
      confirmedById: instructor.id,
      notes: 'Buen ritmo en Kihon Kata Ichi.',
    },
  })

  await db.attendance.upsert({
    where: { id: 'att-demo-punch-2' },
    update: {},
    create: {
      id: 'att-demo-punch-2',
      studentId: student.id,
      date: sixDaysAgo,
      hoursTrained: 2,
      sessionType: 'Bunkai & Kumite',
      status: 'CONFIRMED',
      punchedAt: sixDaysAgo,
      confirmedAt: sixDaysAgo,
      confirmedById: instructor.id,
    },
  })

  await db.attendance.upsert({
    where: { id: 'att-demo-punch-3' },
    update: {},
    create: {
      id: 'att-demo-punch-3',
      studentId: student.id,
      date: today,
      hoursTrained: 1.5,
      sessionType: 'Kihon & Katas',
      status: 'PENDING',
      punchedAt: today,
      notes: 'Punch de hoy, pendiente de confirmación.',
    },
  })

  console.log('Seed completado correctamente')
  // Solo se muestran los passwords generados aleatoriamente; los que vienen de
  // variables de entorno no se imprimen.
  if (!process.env.SEED_OWNER_PASSWORD) console.log(`Owner (multirol): sensei@toseigusoku.com / ${seedPasswords.owner}`)
  if (!process.env.SEED_ADMIN_PASSWORD) console.log(`Administrador: admin@toseigusoku.com / ${seedPasswords.admin}`)
  if (!process.env.SEED_INSTRUCTOR_PASSWORD) console.log(`Instructor: instructor@toseigusoku.com / ${seedPasswords.instructor}`)
  if (!process.env.SEED_STUDENT_PASSWORD) console.log(`Alumno: alumno@test.com / ${seedPasswords.student}`)
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })