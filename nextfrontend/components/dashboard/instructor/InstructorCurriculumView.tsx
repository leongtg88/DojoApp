'use client'

import { useState } from 'react'
import { BookOpen, GraduationCap, Rows3, Search } from 'lucide-react'
import { RankCatalog } from '../shared/RankCatalog'
import { techniqueMetaLine } from '@/lib/dashboard/technique-format'
import type { AdminCurriculumData } from '@/types/dashboard'

interface InstructorCurriculumViewProps {
  curriculum: AdminCurriculumData
}

export function InstructorCurriculumView({ curriculum }: InstructorCurriculumViewProps) {
  const { ranks, techniques } = curriculum
  const [selectedRankId, setSelectedRankId] = useState(ranks[0]?.id ?? '')
  const [catalogQuery, setCatalogQuery] = useState('')

  const selectedRank = ranks.find(({ id }) => id === selectedRankId) ?? ranks[0]
  const totalTechniques = ranks.reduce((total, rank) => total + rank.techniqueCount, 0)

  const normalized = catalogQuery.trim().toLowerCase()
  const catalog = normalized
    ? techniques.filter((technique) => `${technique.name} ${technique.japaneseName ?? ''} ${technique.kanji ?? ''}`.toLowerCase().includes(normalized))
    : techniques

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Grados y katas</h1>
      <p className="mt-2 text-sm text-ink-3">Currículo de tu escuela en modo consulta. Puedes revisar grados, katas y técnicas sin editarlos.</p>

      {ranks.length === 0 ? (
        <section className="mt-7 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center">
          <GraduationCap aria-hidden="true" className="mx-auto size-7 text-accent" />
          <p className="mt-3 text-sm font-semibold text-ink">Aún no hay grados configurados.</p>
        </section>
      ) : (
        <>
          <section className="mt-7 grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg border border-edge bg-surface-2 p-5">
              <Rows3 aria-hidden="true" className="size-5 text-accent" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Grados configurados</p>
              <p className="mt-1 text-3xl font-bold text-ink">{ranks.length}</p>
            </article>
            <article className="rounded-lg border border-edge bg-surface-2 p-5">
              <BookOpen aria-hidden="true" className="size-5 text-ok-text" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Técnicas asociadas</p>
              <p className="mt-1 text-3xl font-bold text-ink">{totalTechniques}</p>
            </article>
          </section>

          <section className="mt-5 rounded-lg border border-edge bg-surface-2 p-4">
            <RankCatalog canReorder={false} onSelectRank={setSelectedRankId} ranks={ranks} selectedRankId={selectedRankId} />
          </section>

          {selectedRank && (
            <section className="mt-5 rounded-lg border border-edge bg-surface-2 p-5">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-md border border-white/10" style={{ backgroundColor: selectedRank.beltColor ?? '#3f3f46' }}>
                  <GraduationCap className="size-6 text-[#10131a]" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Grado seleccionado</p>
                  <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-bold text-ink">
                    {selectedRank.name}
                    <span className="inline-flex items-center rounded-full border border-edge-strong bg-surface-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">
                      {selectedRank.program === 'YOUTH' ? 'Niños' : 'Adultos'}
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-ink-3">
                    {selectedRank.kyuDan ?? `Posición ${selectedRank.order}`}
                    {selectedRank.isMaximumRank ? ' · Grado máximo' : ''}
                    {' · '}{selectedRank.techniqueCount} katas requeridas
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-edge pt-5">
                <p className="text-sm font-semibold text-ink-2">Katas del plan ({selectedRank.techniques.length})</p>
                {selectedRank.techniques.length === 0 ? (
                  <p className="mt-4 rounded-md border border-dashed border-edge-strong bg-surface-1 p-4 text-sm text-ink-3">Este grado aún no tiene katas asociadas.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-edge rounded-md border border-edge bg-surface-1">
                    {selectedRank.techniques.map((technique) => (
                      <li className="px-4 py-3" key={technique.id}>
                        <p className="text-sm font-semibold text-ink">
                          {technique.name}
                          {technique.japaneseName ? <span className="ml-1.5 text-xs font-normal text-ink-3">{technique.japaneseName}</span> : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-3">{techniqueMetaLine(technique)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          <section className="mt-5 rounded-lg border border-edge bg-surface-2 p-5">
            <p className="text-sm font-semibold text-ink-2">Catálogo de técnicas ({techniques.length})</p>
            <div className="relative mt-3">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
              <input
                aria-label="Buscar técnica"
                className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="Buscar técnica…"
                value={catalogQuery}
              />
            </div>
            {catalog.length === 0 ? (
              <p className="mt-4 rounded-md border border-dashed border-edge-strong bg-surface-1 p-4 text-sm text-ink-3">Sin resultados.</p>
            ) : (
              <ul className="mt-4 max-h-96 divide-y divide-edge overflow-y-auto rounded-md border border-edge bg-surface-1">
                {catalog.map((technique) => (
                  <li className="px-4 py-3" key={technique.id}>
                    <p className="text-sm font-semibold text-ink">
                      {technique.name}
                      {technique.japaneseName ? <span className="ml-1.5 text-xs font-normal text-ink-3">{technique.japaneseName}</span> : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-3">{techniqueMetaLine(technique)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
