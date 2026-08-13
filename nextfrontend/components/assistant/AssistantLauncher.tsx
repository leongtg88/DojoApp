'use client';

export default function AssistantLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-full bg-red-700 px-6 py-3 text-white shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      aria-label="Abrir asistente de Tosei Gusoku"
    >
      Empieza Hoy
    </button>
  );
}
