import { PrismaClient, Role } from '@/lib/generated/prisma'
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

// Declara el "grado base" de cada kata para compatibilidad: el grado ADULT de menor
// order que la exige. La fuente autoritativa del curriculum es BeltRankKata.
function homeRankIdFor(kataName: string): string | null {
  const match = ADULT_RANKS.filter((rank) => rank.katas.includes(kataName)).sort((a, b) => a.order - b.order)[0]
  return match?.id ?? null
}

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
          isMaximumRank: rank.isMaximumRank,
          minMonths: rank.minMonths,
          maxMonths: rank.maxMonths,
          estimatedDurationMonths: rank.maxMonths,
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
          isMaximumRank: rank.isMaximumRank,
          minMonths: rank.minMonths,
          maxMonths: rank.maxMonths,
          estimatedDurationMonths: rank.maxMonths,
          minAttendancePercent: 80,
          schoolId: null,
        },
      })
    }
  }

  // ============ KATAS (catálogo global, reutilizan Technique.category = KATA) ============
  const kataNameToId = new Map<string, string>()
  for (const kata of KATAS) {
    const homeRankId = homeRankIdFor(kata.name)
    const created = await db.technique.upsert({
      where: { id: kata.id },
      update: {
        name: kata.name,
        kanji: kata.kanji,
        category: 'KATA',
        order: kata.order,
        rankId: homeRankId,
        schoolId: null,
      },
      create: {
        id: kata.id,
        name: kata.name,
        kanji: kata.kanji,
        category: 'KATA',
        order: kata.order,
        rankId: homeRankId,
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
      role: Role.SCHOOL_ADMIN,
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
      role: Role.INSTRUCTOR,
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
      role: Role.STUDENT,
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
      firstName: 'Juan',
      lastName: 'Pérez',
    },
    create: {
      userId: studentUser.id,
      schoolId: school.id,
      branchId: branch.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: new Date('2012-05-20'),
      gender: 'male',
      contactPhone: '+18095551234',
      medicalInfo: null,
      emergencyContact: 'María Pérez - +18095550000',
      currentRank: 'Blanco',
      status: 'ACTIVE',
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
      role: Role.SUPERADMIN,
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
    update: { currentRank: 'Negro' },
    create: {
      userId: ownerUser.id,
      schoolId: school.id,
      branchId: branch.id,
      firstName: 'Sensei',
      lastName: 'Tosei Gusoku',
      dateOfBirth: new Date('1990-01-01'),
      medicalInfo: null,
      emergencyContact: null,
      currentRank: 'Negro',
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
      startTime: '19:00',
      endTime: '20:30',
    },
  })

  await db.classEnrollment.upsert({
    where: { classId_studentId: { classId: regularClass.id, studentId: student.id } },
    update: { status: 'ACTIVE', endedAt: null },
    create: { classId: regularClass.id, studentId: student.id, status: 'ACTIVE' },
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