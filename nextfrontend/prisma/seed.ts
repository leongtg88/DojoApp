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

async function main() {
  const school = await db.school.upsert({
    where: {
      id: 'tosei-gusoku-school',
    },
    update: {},
    create: {
      id: 'tosei-gusoku-school',
      name: 'Tosei Gusoku',
    },
  })

  const branch = await db.branch.upsert({
    where: {
      id: 'tosei-gusoku-main-branch',
    },
    update: {},
    create: {
      id: 'tosei-gusoku-main-branch',
      name: 'Sucursal principal',
      schoolId: school.id,
    },
  })

  const whiteBelt = await db.beltRank.upsert({
    where: {
      id: 'belt-white',
    },
    update: {},
    create: {
      id: 'belt-white',
      name: 'Blanco',
      order: 1,
      schoolId: school.id,
    },
  })

  const yellowBelt = await db.beltRank.upsert({
    where: {
      id: 'belt-yellow',
    },
    update: {},
    create: {
      id: 'belt-yellow',
      name: 'Amarillo',
      order: 2,
      schoolId: school.id,
    },
  })

  await db.beltRank.upsert({
    where: {
      id: 'belt-orange',
    },
    update: {},
    create: {
      id: 'belt-orange',
      name: 'Naranja',
      order: 3,
      schoolId: school.id,
    },
  })

  await db.technique.upsert({
    where: {
      id: 'technique-kihon-basico',
    },
    update: { category: 'KIHON' },
    create: {
      id: 'technique-kihon-basico',
      name: 'Kihon básico',
      description: 'Técnicas fundamentales de desplazamiento y golpeo.',
      category: 'KIHON',
      rankId: whiteBelt.id,
      schoolId: school.id,
    },
  })

  await db.technique.upsert({
    where: {
      id: 'technique-kata-taikyoku-shodan',
    },
    update: { category: 'KATA' },
    create: {
      id: 'technique-kata-taikyoku-shodan',
      name: 'Kata Taikyoku Shodan',
      description: 'Kata inicial para estudiantes principiantes.',
      category: 'KATA',
      rankId: yellowBelt.id,
      schoolId: school.id,
    },
  })

  const adminPassword = await bcrypt.hash('Admin123!', 12)

  await db.user.upsert({
    where: {
      email: 'admin@toseigusoku.com',
    },
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
    where: {
      email: 'instructor@toseigusoku.com',
    },
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
    where: {
      email: 'alumno@test.com',
    },
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
    where: {
      userId: studentUser.id,
    },
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
    where: {
      id: 'class-adult-regular',
    },
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
    where: {
      classId_studentId: {
        classId: regularClass.id,
        studentId: student.id,
      },
    },
    update: {
      status: 'ACTIVE',
      endedAt: null,
    },
    create: {
      classId: regularClass.id,
      studentId: student.id,
      status: 'ACTIVE',
    },
  })

  await db.studentTechnique.upsert({
    where: {
      studentId_techniqueId: {
        studentId: student.id,
        techniqueId: 'technique-kihon-basico',
      },
    },
    update: {},
    create: {
      studentId: student.id,
      techniqueId: 'technique-kihon-basico',
      approved: true,
      approvedBy: instructor.id,
      approvedAt: new Date(),
    },
  })

  await db.studentTechnique.upsert({
    where: {
      studentId_techniqueId: {
        studentId: student.id,
        techniqueId: 'technique-kata-taikyoku-shodan',
      },
    },
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
      beltRankId: yellowBelt.id,
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