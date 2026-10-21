'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, ShieldCheck } from 'lucide-react'
import type { AbsencePostClosePolicy } from '@/types/dashboard'

interface AdminAbsencePolicyCardProps {
  initialPolicy: AbsencePostClosePolicy
  schools: { id: string; name: string }[]
  initialSchoolId: string | null
}

const POLICY_OPTIONS: { value: AbsencePostClosePolicy; label: string; detail: string }[] = [
  {
    value: 'LOCK_AT_CLOSE',
    label: 'Bloquear al cierre',
    detail: 'Si el cuatrimestre cierra con faltas sin reponer, el derecho a examen de ese cuatrimestre no se restaura con reposiciones posteriores.',
  },
  {
    value: 'RESTORE_ON_RECOVERY',
    label: 'Restaurar con la reposición',
    detail: 'Si el alumno repone después del cierre, el derecho a examen se restaura en la siguiente carga.',
  },
]

export function AdminAbsencePolicyCard({ initialPolicy, schools, initialSchoolId }: AdminAbsencePolicyCardProps) {
  const router = useRouter()
  const [schoolId, setSchoolId] = useState(initialSchoolId)
  const [policy, setPolicy] = useState(initialPolicy)
  const [loadingSchool, setLoadingSchool] = useState(false)
  const [policyLoaded, setPolicyLoaded] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedPolicy = POLICY_OPTIONS.find((option) => option.value === policy) ?? POLICY_OPTIONS[0]

  async function handleSchoolChange(nextSchoolId: string) {
    setSchoolId(nextSchoolId)
    setLoadingSchool(true)
    setPolicyLoaded(false)
    setError(null)
    setSuccess(false)

    const response = await fetch(`/api/dashboard/admin/attendance/policy?schoolId=${encodeURIComponent(nextSchoolId)}`)
    const data = await response.json().catch(() => null)
    setLoadingSchool(false)

    if (!response.ok) {
      setError(data?.error ?? 'No fue posible cargar la política de esa escuela.')
      return
    }

    setPolicy(data.policy)
    setPolicyLoaded(true)
  }

  async function handleSave() {
    if (saving || !schoolId) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const response = await fetch('/api/dashboard/admin/attendance/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy, schoolId: schools.length > 0 ? schoolId : undefined }),
    })
    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'No fue posible guardar la política.')
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
      <div className="flex items-start gap-3 border-b border-edge pb-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Reposiciones</p>
          <h2 className="mt-1 font-display text-lg font-bold text-ink">Política al cierre del cuatrimestre</h2>
          <p className="mt-1 text-xs text-ink-3">
            Define qué pasa con el derecho a examen cuando el cuatrimestre cierra con faltas 3.ª+ sin reponer.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {schools.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="absence-policy-school">
              Escuela
            </label>
            <select
              className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
              disabled={loadingSchool || saving}
              id="absence-policy-school"
              onChange={(event) => handleSchoolChange(event.target.value)}
              value={schoolId ?? ''}
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="absence-policy-value">
            Política
          </label>
          <select
            className="w-full rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink focus:border-cyan-500 focus:outline-none"
            disabled={loadingSchool || saving || !schoolId || !policyLoaded}
            id="absence-policy-value"
            onChange={(event) => setPolicy(event.target.value as AbsencePostClosePolicy)}
            value={policy}
          >
            {POLICY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-3">{selectedPolicy.detail}</p>
      <p className="mt-1 text-[11px] text-ink-4">
        Los cambios aplican a los cierres a partir de ahora. Los cuatrimestres ya cerrados conservan la política vigente al cerrar.
      </p>

      {error && <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-danger-text">{error}</p>}
      {success && (
        <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-ok-text">
          Política actualizada. Se aplicará a los cierres a partir de ahora.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
          disabled={saving || loadingSchool || !schoolId || !policyLoaded}
          onClick={handleSave}
          type="button"
        >
          {saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
          {saving ? 'Guardando...' : 'Guardar política'}
        </button>
      </div>
    </section>
  )
}
