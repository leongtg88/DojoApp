'use client'

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-surface-1 px-4 text-center">
      <p className="font-display text-lg font-bold text-ink">Algo salió mal</p>
      <p className="max-w-md text-sm text-ink-3">No pudimos cargar esta sección. Intenta de nuevo.</p>
      <button
        className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400"
        onClick={reset}
        type="button"
      >
        Reintentar
      </button>
    </div>
  )
}
