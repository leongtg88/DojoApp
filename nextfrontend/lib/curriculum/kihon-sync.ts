import type { PrismaClient } from '@/lib/generated/prisma'
import { KIHON_TECHNIQUES } from './kihon'

/**
 * Sincroniza el catálogo oficial de Kihon (global, schoolId = null) de forma
 * idempotente y NO destructiva:
 * - Solo crea/actualiza técnicas globales con sus datos de categoría.
 * - No elimina técnicas ni datos de alumnos.
 * - Las técnicas personalizadas por escuela no se tocan.
 * - No vincula técnicas a grados (eso se hace desde «Grados y técnicas»).
 *
 * La usan tanto el seed como `prisma/sync-kihon.ts` para que un reset del
 * catálogo no deje las técnicas de Kihon fuera de la base de datos.
 */
export async function syncKihonCatalog(db: PrismaClient): Promise<number> {
  for (const kihon of KIHON_TECHNIQUES) {
    const data = {
      name: kihon.name,
      japaneseName: kihon.japaneseName ?? null,
      kanji: kihon.kanji ?? null,
      description: kihon.description ?? null,
      category: 'KIHON' as const,
      kihonCategory: kihon.kihonCategory,
      order: kihon.order,
      repetitionsCount: kihon.repetitionsCount ?? null,
      stance: kihon.stance ?? null,
      level: kihon.level ?? null,
      schoolId: null,
    }

    await db.technique.upsert({
      where: { id: kihon.id },
      update: data,
      create: { id: kihon.id, ...data },
    })
  }

  return KIHON_TECHNIQUES.length
}
