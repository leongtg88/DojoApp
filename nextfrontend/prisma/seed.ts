import { PrismaClient, Role, ClassAudience } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { ADULT_RANKS, YOUTH_RANKS, KATAS, type Program } from '@/lib/curriculum/programs'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

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
  ] as const
  for (const schedule of SCHEDULES) {
    await db.class.upsert({
      where: { id: schedule.id },
      update: { name: schedule.name, audience: schedule.audience as ClassAudience, dayOfWeek: schedule.dayOfWeek, startTime: toTimeInput(schedule.startTime), endTime: toTimeInput(schedule.endTime), description: schedule.description, active: true },
      create: { ...schedule, audience: schedule.audience as ClassAudience, branchId: branch.id, startTime: toTimeInput(schedule.startTime), endTime: toTimeInput(schedule.endTime), active: true },
    })
  }

  // Limpieza de datos demo/legado (la DB es de desarrollo). El catálogo anterior
  // de grados (belt-white...belt-black) y técnicas (technique-kata-*) se reemplaza
  // por el curriculum oficial de 21 katas y 30 grados (12 adultos + 18 niños).
  console.log('Limpieza de catálogo legado (demo/dev)...')
  await db.$transaction([
    db.beltRankKata.deleteMany(),
    db.studentRankHistory.deleteMany(),
    db.studentTechnique.deleteMany(),
    db.technique.deleteMany(),
    db.beltRank.deleteMany(),
  ])

  // ============ GRADOS por programa (primero, para que las katas puedan referenciarlos) ============
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

  const adminPassword = await bcrypt.hash('Admin123!', 12)

  await db.user.upsert({
    where: { email: 'admin@toseigusoku.com' },
    update: {},
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

  const instructorPassword = await bcrypt.hash('Instructor123!', 12)

  const instructor = await db.user.upsert({
    where: { email: 'instructor@toseigusoku.com' },
    update: {},
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

  const studentPassword = await bcrypt.hash('Alumno123!', 12)

  const studentUser = await db.user.upsert({
    where: { email: 'alumno@test.com' },
    update: {},
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
  const ownerPassword = await bcrypt.hash('Sensei123!', 12)

  const ownerUser = await db.user.upsert({
    where: { email: 'sensei@toseigusoku.com' },
    update: {},
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
    update: { currentRank: 'Shodan', currentRankId: 'belt-adult-12-negro' },
    create: {
      userId: ownerUser.id,
      schoolId: school.id,
      branchId: branch.id,
      firstName: 'Sensei',
      lastName: 'Tosei Gusoku',
      dateOfBirth: new Date('1990-01-01'),
      medicalInfo: null,
      emergencyContact: null,
      currentRank: 'Shodan',
      currentRankId: 'belt-adult-12-negro',
      status: 'ACTIVE',
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

  // Horario de referencia del alumno demo: Niños Tarde (bloque Martes).
  await db.classEnrollment.upsert({
    where: { classId_studentId: { classId: 'schedule-child-tue', studentId: student.id } },
    update: { status: 'ACTIVE', endedAt: null },
    create: { classId: 'schedule-child-tue', studentId: student.id, status: 'ACTIVE' },
  })

  // Asigna el instructor principal a los bloques de horario del dojo.
  await db.class.updateMany({
    where: {
      id: { in: ['schedule-adult-mon', 'schedule-adult-wed', 'schedule-child-tue', 'schedule-child-thu', 'schedule-mixed-sat'] },
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
  console.log('Owner (multirol): sensei@toseigusoku.com / Sensei123!')
  console.log('Administrador: admin@toseigusoku.com / Admin123!')
  console.log('Instructor: instructor@toseigusoku.com / Instructor123!')
  console.log('Alumno: alumno@test.com / Alumno123!')
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })