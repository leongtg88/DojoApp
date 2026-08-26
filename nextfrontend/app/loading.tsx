export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-brand-accent/20" />
        <div className="absolute inset-0 rounded-full border-4 border-brand-accent border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm text-gray-700/50 font-display uppercase tracking-widest">Cargando...</p>
    </div>
  );
}