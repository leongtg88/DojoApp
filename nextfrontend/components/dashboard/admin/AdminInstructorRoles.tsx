'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GraduationCap, Loader2, Plus, Search, ShieldCheck, UserMinus, UserPlus, Users, X } from 'lucide-react'
import type { AdminInstructorCandidate } from '@/types/dashboard'

interface AdminInstructorRolesProps {
  candidates: AdminInstructorCandidate[]
}

export function AdminInstructorRoles({ candidates }: AdminInstructorRolesProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const instructors = candidates.filter((candidate) => candidate.isInstructor)
  const available = candidates.filter((candidate) => !candidate.isInstructor)
  const normalized = query.trim().toLowerCase()
  const filteredAvailable = normalized
    ? available.filter((candidate) => `${candidate.name} ${candidate.email} ${candidate.memberNumber ?? ''}`.toLowerCase().includes(normalized))
    : available

  async function toggleInstructor(candidate: AdminInstructorCandidate) {
    setPendingId(candidate.studentId)
    setError(null)

    const response = await fetch('/api/dashboard/admin/instructors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: candidate.studentId, grant: !candidate.isInstructor }),
    })

    setPendingId(null)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'No fue posible actualizar el rol.')
      return
    }

    router.refresh()
  }

  function renderCandidate(candidate: AdminInstructorCandidate) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3" key={candidate.studentId}>
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
            {candidate.name}
            {candidate.isInstructor && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-900/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                <ShieldCheck aria-hidden="true" className="size-3" />Instructor
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-3">
            {candidate.email}
            {candidate.currentRank ? ` · ${candidate.currentRank}` : ''}
            {candidate.memberNumber ? ` · ${candidate.memberNumber}` : ''}
          </p>
        </div>
        <button
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${candidate.isInstructor ? 'border-red-500/40 bg-red-500/10 text-danger-text hover:bg-red-500/20' : 'border-cyan-500/40 bg-cyan-950/30 text-accent-text hover:bg-cyan-900/50'}`}
          disabled={pendingId === candidate.studentId}
          onClick={() => void toggleInstructor(candidate)}
          type="button"
        >
          {pendingId === candidate.studentId ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : candidate.isInstructor ? (
            <UserMinus aria-hidden="true" className="size-3.5" />
          ) : (
            <UserPlus aria-hidden="true" className="size-3.5" />
          )}
          {candidate.isInstructor ? 'Quitar instructor' : 'Hacer instructor'}
        </button>
      </li>
    )
  }

  return (
    <section className="mt-3 rounded-lg border border-edge bg-surface-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <GraduationCap aria-hidden="true" className="size-4" />Instructores del dojo
          </p>
          <p className="mt-2 max-w-xl text-xs text-ink-3">
            Los instructores activos pueden ver el panel de grados y katas en solo lectura. Usa “Agregar instructor” para
            habilitar a un alumno con cuenta activa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3 py-1.5 text-xs font-semibold text-ink-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-accent" />{instructors.length} instructores
          </span>
          <button
            type="button"
            aria-expanded={showAdd}
            onClick={() => {
              setShowAdd((value) => !value)
              setQuery('')
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${showAdd ? 'border-edge-strong bg-surface-1 text-ink-2 hover:bg-surface-3' : 'border-cyan-500/40 bg-cyan-950/30 text-accent-text hover:bg-cyan-900/50'}`}
          >
            {showAdd ? <X aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
            {showAdd ? 'Cerrar' : 'Agregar instructor'}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-danger-text">{error}</p>}

      {candidates.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-edge-strong bg-surface-1 p-4 text-xs text-ink-3">
          <Users aria-hidden="true" className="size-4" />Aún no hay alumnos activos con cuenta para habilitar como instructores.
        </p>
      ) : (
        <>
          {showAdd && (
            <div className="mt-4 rounded-md border border-edge bg-surface-1 p-4">
              <p className="text-xs font-semibold text-ink-2">Buscar alumno activo para habilitar como instructor</p>
              <div className="relative mt-3">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
                <input
                  autoFocus
                  aria-label="Buscar alumno"
                  className="w-full rounded-md border border-edge-strong bg-surface-1 py-2 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar alumno por nombre, correo o matrícula…"
                  value={query}
                />
              </div>

              {filteredAvailable.length === 0 ? (
                <p className="mt-3 rounded-md border border-dashed border-edge-strong bg-surface-2 p-4 text-xs text-ink-3">
                  {available.length === 0 ? 'Todos los alumnos activos con cuenta ya son instructores.' : `Sin resultados para “${query}”.`}
                </p>
              ) : (
                <ul className="mt-3 max-h-64 divide-y divide-edge overflow-y-auto rounded-md border border-edge bg-surface-2">
                  {filteredAvailable.map((candidate) => renderCandidate(candidate))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4">
            {instructors.length === 0 ? (
              <p className="rounded-md border border-dashed border-edge-strong bg-surface-1 p-4 text-xs text-ink-3">
                Aún no hay instructores activos en el dojo.
              </p>
            ) : (
              <ul className="divide-y divide-edge rounded-md border border-edge bg-surface-1">
                {instructors.map((candidate) => renderCandidate(candidate))}
              </ul>
            )}
          </div>
        </>
      )}

      <p className="mt-3 text-[10px] text-ink-4">El nuevo rol se activa cuando la persona vuelve a iniciar sesión.</p>
    </section>
  )
}
