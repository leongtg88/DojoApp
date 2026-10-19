import { beforeEach, describe, expect, it } from 'vitest'

const { db, resetDb } = await import('./db')
const { createSchool, createBranch, createRank, createTechnique, createStudent } = await import('./fixtures')
const { getCurriculumForSchool } = await import('@/lib/dashboard/curriculum-queries')
const { getAdminCalendar } = await import('@/lib/dashboard/calendar-queries')

beforeEach(resetDb)

describe('getCurriculumForSchool', () => {
  it('combina el catálogo global con el de la escuela y cuenta alumnos por grado', async () => {
    const schoolA = await createSchool('Escuela A')
    const schoolB = await createSchool('Escuela B')
    const branchA = await createBranch(schoolA.id)

    const rankAName = 'Amarillo'
    await createRank({ schoolId: null, order: 1, name: 'Blanco' })
    const rankA = await createRank({ schoolId: schoolA.id, order: 2, name: rankAName })
    await createRank({ schoolId: schoolB.id, order: 3, name: 'Rojo de B' })

    await createTechnique('Kata global', null, 'KATA')
    await createTechnique('Kata de A', schoolA.id, 'KATA')
    await createTechnique('Kata de B', schoolB.id, 'KATA')

    // Alumno con FK al grado + alumno legacy (solo por nombre denormalizado).
    const byFk = await createStudent({ schoolId: schoolA.id, branchId: branchA.id, firstName: 'Uno', lastName: 'Fk' })
    await db.student.update({ where: { id: byFk.id }, data: { currentRankId: rankA.id } })
    await createStudent({ schoolId: schoolA.id, branchId: branchA.id, firstName: 'Dos', lastName: 'Legacy', currentRank: rankAName })

    const data = await getCurriculumForSchool(schoolA.id)

    expect(data.ranks.map((rank) => rank.name).sort()).toEqual(['Amarillo', 'Blanco'])
    const amarillo = data.ranks.find((rank) => rank.name === 'Amarillo')
    expect(amarillo?.studentCount).toBe(2)
    expect(amarillo?.techniqueCount).toBe(0)

    expect(data.techniques.map((technique) => technique.name).sort()).toEqual(['Kata de A', 'Kata global'])
    expect(data.techniques.every((technique) => Array.isArray(technique.rankIds))).toBe(true)
  })

  it('cuenta la técnica asignada a un grado (techniqueCount)', async () => {
    const schoolA = await createSchool('Escuela A')
    const kata = await createTechnique('Kata asignada', schoolA.id, 'KATA')
    await createRank({ schoolId: schoolA.id, order: 1, name: 'Blanco', kataIds: [kata.id] })

    const data = await getCurriculumForSchool(schoolA.id)

    expect(data.ranks).toHaveLength(1)
    expect(data.ranks[0].techniqueCount).toBe(1)
    expect(data.ranks[0].techniques[0].name).toBe('Kata asignada')
    expect(data.ranks[0].techniques[0].rankIds).toEqual([data.ranks[0].id])
  })

  it('con schoolId null (súper admin) devuelve el catálogo completo', async () => {
    const schoolA = await createSchool('Escuela A')
    await createRank({ schoolId: null, order: 1, name: 'Global' })
    await createRank({ schoolId: schoolA.id, order: 1, name: 'De escuela' })

    const data = await getCurriculumForSchool(null)

    expect(data.ranks.map((rank) => rank.name).sort()).toEqual(['De escuela', 'Global'])
  })
})

describe('getAdminCalendar', () => {
  it('incluye feriados globales y de la escuela, y solo las convocatorias propias', async () => {
    const schoolA = await createSchool('Escuela A')
    const schoolB = await createSchool('Escuela B')

    await db.holiday.create({ data: { name: 'Feriado global', date: new Date('2026-01-01T00:00:00.000Z'), schoolId: null } })
    await db.holiday.create({ data: { name: 'Feriado A', date: new Date('2026-02-01T00:00:00.000Z'), schoolId: schoolA.id } })
    await db.holiday.create({ data: { name: 'Feriado B', date: new Date('2026-03-01T00:00:00.000Z'), schoolId: schoolB.id } })

    await db.examConvocation.create({
      data: { schoolId: schoolA.id, date: new Date('2026-04-01T00:00:00.000Z'), examDay: 'SATURDAY', label: 'Examen A' },
    })
    await db.examConvocation.create({
      data: { schoolId: schoolB.id, date: new Date('2026-05-01T00:00:00.000Z'), examDay: 'SUNDAY' },
    })

    const data = await getAdminCalendar(schoolA.id)

    expect(data.holidays.map((holiday) => holiday.name).sort()).toEqual(['Feriado A', 'Feriado global'])
    expect(data.convocations).toHaveLength(1)
    expect(data.convocations[0].label).toBe('Examen A')
    expect(data.convocations[0].examDay).toBe('SATURDAY')
    expect(typeof data.holidays[0].date).toBe('string')
  })

  it('con schoolId null devuelve todos los feriados y convocatorias', async () => {
    const schoolA = await createSchool('Escuela A')
    await db.holiday.create({ data: { name: 'Feriado global', date: new Date('2026-01-01T00:00:00.000Z'), schoolId: null } })
    await db.holiday.create({ data: { name: 'Feriado A', date: new Date('2026-02-01T00:00:00.000Z'), schoolId: schoolA.id } })

    const data = await getAdminCalendar(null)

    expect(data.holidays).toHaveLength(2)
  })
})
