export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-surface-1 px-4">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
      <p className="mt-4 font-display text-sm uppercase tracking-widest text-ink-3">Cargando…</p>
    </div>
  )
}
