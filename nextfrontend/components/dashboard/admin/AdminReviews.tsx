'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Clock, Star, Trash2, X } from 'lucide-react'
import type { ReviewStatus, ReviewSummary } from '@/types/dashboard'

interface AdminReviewsProps {
  reviews: ReviewSummary[]
}

const FILTERS: { key: ReviewStatus | 'ALL'; label: string }[] = [
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Aprobadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
  { key: 'ALL', label: 'Todas' },
]

const STATUS_STYLES: Record<ReviewStatus, string> = {
  PENDING: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  APPROVED: 'border-emerald-500/40 bg-emerald-500/10 text-ok-text',
  REJECTED: 'border-rose-500/40 bg-rose-500/10 text-danger-text',
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminReviews({ reviews }: AdminReviewsProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<ReviewStatus | 'ALL'>('PENDING')
  const [busyId, setBusyId] = useState<string | null>(null)

  const pendingCount = reviews.filter((review) => review.status === 'PENDING').length
  const visible = filter === 'ALL' ? reviews : reviews.filter((review) => review.status === filter)

  async function updateStatus(id: string, status: ReviewStatus) {
    setBusyId(id)
    try {
      const response = await fetch(`/api/dashboard/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        window.alert(data?.error ?? 'No se pudo actualizar la reseña.')
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function removeReview(id: string) {
    if (!window.confirm('¿Eliminar esta reseña permanentemente?')) return
    setBusyId(id)
    try {
      const response = await fetch(`/api/dashboard/admin/reviews/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        window.alert(data?.error ?? 'No se pudo eliminar la reseña.')
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Administración</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Reseñas de familias</h1>
          <p className="mt-2 max-w-xl text-xs text-ink-3">
            Aprueba o rechaza los mensajes que dejan los padres desde la web. Solo las reseñas aprobadas se
            publican en el sitio.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
            <Clock className="size-4" aria-hidden="true" />
            {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === item.key
                ? 'border-cyan-500 bg-cyan-500 text-[#0d1117]'
                : 'border-edge-strong bg-surface-1 text-ink-2 hover:bg-surface-3'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-lg border border-edge bg-surface-2 px-4 py-6 text-xs text-ink-3">
          No hay reseñas en este filtro.
        </p>
      ) : (
        <section className="mt-6 grid gap-4">
          {visible.map((review) => (
            <article
              key={review.id}
              className={`rounded-lg border bg-surface-2 p-5 ${busyId === review.id ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{review.authorName}</h3>
                  {review.relationship && <p className="text-xs text-ink-3">{review.relationship}</p>}
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[review.status]}`}>
                  {STATUS_LABELS[review.status]}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`size-4 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-4'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-xs text-ink-4">{formatDate(review.createdAt)}</span>
                {review.email && <span className="text-xs text-ink-4">· {review.email}</span>}
              </div>

              <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{review.message}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-edge pt-3">
                {review.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(review.id, 'APPROVED')}
                    disabled={busyId === review.id}
                    className="flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-ok-text hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Aprobar
                  </button>
                )}
                {review.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(review.id, 'REJECTED')}
                    disabled={busyId === review.id}
                    className="flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-3 disabled:opacity-50"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Rechazar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeReview(review.id)}
                  disabled={busyId === review.id}
                  className="ml-auto flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-danger-text hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
