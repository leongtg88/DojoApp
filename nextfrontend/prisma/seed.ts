import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
})

const RANKS = [
  {
    id: 'belt-white',
    name: 'Blanco',
    kyuDan: '10.º kyu',
    japaneseName: 'Jukyu',
    kanji: '十級',
    order: 1,
    beltColor: '#F4F4F5',
    beltSecondaryColor: '#E4E4E7',
    isMaximumRank: false,
    estimatedDurationMonths: 3,
    description: 'Grado de iniciación. Fundamento, etiqueta y primeras bases.',
  },
  {
    id: 'belt-yellow',
    name: 'Amarillo',
    kyuDan: '9.º kyu',
    japaneseName: 'Kyukyu',
    kanji: '九級',
    order: 2,
    beltColor: '#FACC15',
    beltSecondaryColor: '#CA8A04',
    isMaximumRank: false,
    estimatedDurationMonths: 3,
    description: 'Primera kata oficial y defensa personal básica.',
  },
  {
    id: 'belt-orange',
    name: 'Naranja',
    kyuDan: '8.º kyu',
    japaneseName: 'Hachikyu',
    kanji: '八級',
    order: 3,
    beltColor: '#F97316',
    beltSecondaryColor: '#C2410C',
    isMaximumRank: false,
    estimatedDurationMonths: 4,
    description: 'Katas Heian superiores y combinaciones de kihon.',
  },
  {
    id: 'belt-green',
    name: 'Verde',
    kyuDan: '7.º kyu',
    japaneseName: 'Nanakyu',
    kanji: '七級',
    order: 4,
    beltColor: '#16A34A',
    beltSecondaryColor: '#15803D',
    isMaximumRank: false,
    estimatedDurationMonths: 4,
    description: 'Introducción a katas avanzadas y kumite controlado.',
  },
  {
    id: 'belt-blue',
    name: 'Azul',
    kyuDan: '6.º kyu',
    japaneseName: 'Rokkyu',
    kanji: '六級',
    order: 5,
    beltColor: '#2563EB',
    beltSecondaryColor: '#1D4ED8',
    isMaximumRank: false,
    estimatedDurationMonths: 5,
    description: 'Katas de gran embusen y velocidad de ejecución.',
  },
  {
    id: 'belt-brown',
    name: 'Marrón',
    kyuDan: '3.º kyu',
    japaneseName: 'Sankyu',
    kanji: '三級',
    order: 6,
    beltColor: '#78350F',
    beltSecondaryColor: '#451A03',
    isMaximumRank: false,
    estimatedDurationMonths: 6,
    description: 'Grado previo a cinturón negro. Katas mayores y bunkai.',
  },
  {
    id: 'belt-black',
    name: 'Negro',
    kyuDan: '1.º dan',
    japaneseName: 'Shodan',
    kanji: '初段',
    order: 7,
    beltColor: '#18181B',
    beltSecondaryColor: '#B8B070',
    isMaximumRank: true,
    estimatedDurationMonths: 12,
    description: 'Grado máximo del plan oficial de estudio del dojo.',
  },
] as const

const KATAS = [
  { id: 'technique-kata-heian-shodan', name: 'Heian Shodan', japaneseName: 'Heian Shodan', kanji: '平安初段', description: 'Primera kata de la serie Heian. Bases de esquivas y postura.', movementsCount: 21, embusen: 'I', difficulty: 'Básica', rankId: 'belt-white', order: 1 },
  { id: 'technique-kata-heian-nidan', name: 'Heian Nidan', japaneseName: 'Heian Nidan', kanji: '平安二段', description: 'Introducción a las ayunashi y patadas maegeri.', movementsCount: 26, embusen: 'I', difficulty: 'Básica', rankId: 'belt-white', order: 2 },
  { id: 'technique-kata-juroku', name: 'Juroku', japaneseName: 'Juroku', kanji: '十六', description: 'Kata de embusen en cruz. Dominio del giro y la respiración.', movementsCount: 16, embusen: 'Cruz', difficulty: 'Básica', rankId: 'belt-white', order: 3 },
  { id: 'technique-kata-heian-sandan', name: 'Heian Sandan', japaneseName: 'Heian Sandan', kanji: '平安三段', description: 'Incluye uke con bloqueos múltiples y shuto uke.', movementsCount: 20, embusen: 'I', difficulty: 'Básica', rankId: 'belt-yellow', order: 1 },
  { id: 'technique-kata-heian-yondan', name: 'Heian Yondan', japaneseName: 'Heian Yondan', kanji: '平安四段', description: 'Combina técnicas altas y bajas con relieve de kime.', movementsCount: 27, embusen: 'I', difficulty: 'Intermedia', rankId: 'belt-yellow', order: 2 },
  { id: 'technique-kata-heian-godan', name: 'Heian Godan', japaneseName: 'Heian Godan', kanji: '平安五段', description: 'Embusen con desplazamientos diagonales y jujidari.', movementsCount: 23, embusen: 'I', difficulty: 'Intermedia', rankId: 'belt-yellow', order: 3 },
  { id: 'technique-kata-tekki-shodan', name: 'Tekki Shodan', japaneseName: 'Tekki Shodan', kanji: '鉄騎初段', description: 'Kata de kiba dachi en línea lateral. Fortalecimiento de piernas.', movementsCount: 29, embusen: 'Línea lateral', difficulty: 'Intermedia', rankId: 'belt-orange', order: 1 },
  { id: 'technique-kata-matsukaze', name: 'Matsukaze', japaneseName: 'Matsukaze', kanji: '松風', description: 'Kata característica de la línea Inoue Ha. Viento entre pinos.', movementsCount: 38, embusen: 'Inoue', difficulty: 'Intermedia', rankId: 'belt-orange', order: 2 },
  { id: 'technique-kata-bassai-dai', name: 'Bassai Dai', japaneseName: 'Bassai Dai', kanji: '抜塞大', description: 'La fortaleza del castillo. Potencia y kime explosivo.', movementsCount: 42, embusen: 'Cruz', difficulty: 'Avanzada', rankId: 'belt-green', order: 1 },
  { id: 'technique-kata-seienchin', name: 'Seienchin', japaneseName: 'Seienchin', kanji: '征遠鎮', description: 'Kata de sanchin con fuerza y respiración profunda.', movementsCount: 35, embusen: 'Shiko', difficulty: 'Avanzada', rankId: 'belt-green', order: 2 },
  { id: 'technique-kata-enpi', name: 'Enpi', japaneseName: 'Enpi', kanji: '燕飛', description: 'Vuelo de la golondrina. Cambios de ritmo agudos.', movementsCount: 37, embusen: 'Ágil', difficulty: 'Avanzada', rankId: 'belt-blue', order: 1 },
  { id: 'technique-kata-kanku-dai', name: 'Kanku Dai', japaneseName: 'Kanku Dai', kanji: '観空大', description: 'Gran visión del cielo. La kata más extensa de la serie.', movementsCount: 65, embusen: 'Gran Cielo', difficulty: 'Avanzada', rankId: 'belt-brown', order: 1 },
  { id: 'technique-kata-tekki-nidan', name: 'Tekki Nidan', japaneseName: 'Tekki Nidan', kanji: '鉄騎二段', description: 'Continuación del kiba dachi con técnicas a dos bandas.', movementsCount: 31, embusen: 'Línea lateral', difficulty: 'Avanzada', rankId: 'belt-brown', order: 2 },
  { id: 'technique-kata-rohai', name: 'Rohai', japaneseName: 'Rohai', kanji: '鷺牌', description: 'La garza blanca. Kata de grado de maestro, delicada y precisa.', movementsCount: 30, embusen: 'Garza', difficulty: 'Avanzada', rankId: 'belt-black', order: 1 },
] as const

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

  for (const rank of RANKS) {
    await db.beltRank.upsert({
      where: { id: rank.id },
      update: {
        name: rank.name,
        kyuDan: rank.kyuDan,
        japaneseName: rank.japaneseName,
        kanji: rank.kanji,
        order: rank.order,
        beltColor: rank.beltColor,
        beltSecondaryColor: rank.beltSecondaryColor,
        isMaximumRank: rank.isMaximumRank,
        estimatedDurationMonths: rank.estimatedDurationMonths,
        description: rank.description,
        minAttendancePercent: 80,
      },
      create: {
        id: rank.id,
        name: rank.name,
        kyuDan: rank.kyuDan,
        japaneseName: rank.japaneseName,
        kanji: rank.kanji,
        order: rank.order,
        beltColor: rank.beltColor,
        beltSecondaryColor: rank.beltSecondaryColor,
        isMaximumRank: rank.isMaximumRank,
        estimatedDurationMonths: rank.estimatedDurationMonths,
        description: rank.description,
        schoolId: school.id,
        minAttendancePercent: 80,
      },
    })
  }

  await db.technique.upsert({
    where: { id: 'technique-kihon-basico' },
    update: { category: 'KIHON', name: 'Kihon básico' },
    create: {
      id: 'technique-kihon-basico',
      name: 'Kihon básico',
      description: 'Técnicas fundamentales de desplazamiento y golpeo.',
      category: 'KIHON',
      rankId: 'belt-white',
      order: 1,
      schoolId: school.id,
    },
  })

  await db.technique.upsert({
    where: { id: 'technique-kata-taikyoku-shodan' },
    update: { category: 'KATA', name: 'Kata Taikyoku Shodan' },
    create: {
      id: 'technique-kata-taikyoku-shodan',
      name: 'Kata Taikyoku Shodan',
      japaneseName: 'Taikyoku Shodan',
      kanji: '太極初段',
      description: 'Kata inicial para estudiantes principiantes.',
      category: 'KATA',
      rankId: 'belt-white',
      order: 1,
      movementsCount: 21,
      embusen: 'I',
      difficulty: 'Básica',
      schoolId: school.id,
    },
  })

  for (const kata of KATAS) {
    await db.technique.upsert({
      where: { id: kata.id },
      update: {
        name: kata.name,
        japaneseName: kata.japaneseName,
        kanji: kata.kanji,
        description: kata.description,
        category: 'KATA',
        rankId: kata.rankId,
        order: kata.order,
        movementsCount: kata.movementsCount,
        embusen: kata.embusen,
        difficulty: kata.difficulty,
      },
      create: {
        ...kata,
        category: 'KATA',
        schoolId: school.id,
      },
    })
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
      emailVerified: new Date(),
      schoolId: school.id,
      branchId: branch.id,
    },
  })

  const student = await db.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      schoolId: school.id,
      branchId: branch.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: new Date('2012-05-20'),
      contactPhone: '+18095551234',
      medicalInfo: null,
      emergencyContact: 'María Pérez - +18095550000',
      currentRank: 'Amarillo',
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
      notes: 'Buen ritmo en Heian Shodan.',
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

  await db.studentTechnique.upsert({
    where: { studentId_techniqueId: { studentId: student.id, techniqueId: 'technique-kata-heian-shodan' } },
    update: {},
    create: {
      studentId: student.id,
      techniqueId: 'technique-kata-heian-shodan',
      approved: true,
      approvedBy: instructor.id,
      approvedAt: new Date(),
      practiceHours: 12,
    },
  })

  await db.studentTechnique.upsert({
    where: { studentId_techniqueId: { studentId: student.id, techniqueId: 'technique-kata-heian-nidan' } },
    update: {},
    create: {
      studentId: student.id,
      techniqueId: 'technique-kata-heian-nidan',
      approved: false,
      inPractice: true,
      practiceHours: 5,
      notes: 'Practicar el giro de shuto uke y la respiración.',
    },
  })

  await db.studentTechnique.upsert({
    where: { studentId_techniqueId: { studentId: student.id, techniqueId: 'technique-kata-taikyoku-shodan' } },
    update: {},
    create: {
      studentId: student.id,
      techniqueId: 'technique-kata-taikyoku-shodan',
      approved: false,
      notes: 'Practicar embusen y postura inicial.',
    },
  })

  await db.studentRankHistory.upsert({
    where: { id: 'rank-history-juan-yellow' },
    update: {},
    create: {
      id: 'rank-history-juan-yellow',
      studentId: student.id,
      beltRankId: 'belt-yellow',
      promotedBy: instructor.id,
      notes: 'Grado inicial registrado.',
    },
  })

  console.log('Seed completado correctamente')
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