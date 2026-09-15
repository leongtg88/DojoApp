import { db } from '@/lib/db'
import { StudentStatus } from '@/lib/generated/prisma'
import type { AdminBeltRankSummary, AdminCurriculumData } from '@/types/dashboard'

function techniqueWithRanks<T extends { beltRankKatas: { beltRankId: string }[]; originKata?: { name: string } | null }>(technique: T) {
  const { beltRankKatas, originKata, ...rest } = technique
  return { ...rest, rankIds: beltRankKatas.map(({ beltRankId }) => beltRankId), originKataName: originKata?.name ?? null }
}

/**
 * Construye el catálogo curricular (grados + técnicas) para una escuela.
 * `schoolId` en `null` devuelve el catálogo global (súper admin).
 */
export async function getCurriculumForSchool(schoolId: string | null): Promise<AdminCurriculumData> {
  const schoolFilter = schoolId ? { OR: [{ schoolId }, { schoolId: null }] } : {}

  const ranks = await db.beltRank.findMany({
    where: schoolFilter,
    orderBy: [{ program: 'asc' }, { order: 'asc' }],
    select: {
      id: true,
      program: true,
      name: true,
      order: true,
      kyuDan: true,
      japaneseName: true,
      kanji: true,
      beltColor: true,
      beltSecondaryColor: true,
      isMaximumRank: true,
      minMonths: true,
      maxMonths: true,
      minAttendancePercent: true,
      estimatedDurationMonths: true,
      description: true,
      katas: { orderBy: { order: 'asc' }, select: { kata: { select: { id: true, name: true, japaneseName: true, kanji: true, description: true, category: true, order: true, difficulty: true, embusen: true, movementsCount: true, videoUrl: true, repetitionsCount: true, stance: true, level: true, kumiteType: true, distance: true, role: true, applicationType: true, originKataId: true, originKata: { select: { name: true } }, beltRankKatas: { select: { beltRankId: true }, orderBy: [{ beltRank: { program: 'asc' } }, { beltRank: { order: 'asc' } }, { order: 'asc' }] } } } } },
      _count: { select: { promotions: true } },
    },
  })

  const rankNames = ranks.map(({ name }) => name)
  const studentCounts = await db.student.groupBy({
    by: ['currentRank'],
    where: {
      currentRank: { in: rankNames },
      ...(schoolId ? { schoolId } : {}),
      status: StudentStatus.ACTIVE,
    },
    _count: { _all: true },
  })
  const countByRankName = new Map(studentCounts.map(({ currentRank, _count }) => [currentRank, _count._all]))

  const techniques = await db.technique.findMany({
    where: schoolFilter,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      japaneseName: true,
      kanji: true,
      description: true,
      category: true,
      order: true,
      difficulty: true,
      embusen: true,
      movementsCount: true,
      videoUrl: true,
      repetitionsCount: true,
      stance: true,
      level: true,
      kumiteType: true,
      distance: true,
      role: true,
      applicationType: true,
      originKataId: true,
      originKata: { select: { name: true } },
      beltRankKatas: { select: { beltRankId: true }, orderBy: [{ beltRank: { program: 'asc' } }, { beltRank: { order: 'asc' } }, { order: 'asc' }] },
    },
  })

  const mappedRanks: AdminBeltRankSummary[] = ranks.map((rank) => ({
    id: rank.id,
    program: rank.program,
    name: rank.name,
    order: rank.order,
    kyuDan: rank.kyuDan,
    japaneseName: rank.japaneseName,
    kanji: rank.kanji,
    beltColor: rank.beltColor,
    beltSecondaryColor: rank.beltSecondaryColor,
    isMaximumRank: rank.isMaximumRank,
    minMonths: rank.minMonths,
    maxMonths: rank.maxMonths,
    minAttendancePercent: rank.minAttendancePercent,
    estimatedDurationMonths: rank.estimatedDurationMonths,
    description: rank.description,
    techniqueCount: rank.katas.length,
    studentCount: countByRankName.get(rank.name) ?? 0,
    techniques: rank.katas.map(({ kata }) => techniqueWithRanks(kata)),
  }))

  return { ranks: mappedRanks, techniques: techniques.map(techniqueWithRanks) }
}
