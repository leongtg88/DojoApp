import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <h1 className="text-6xl sm:text-8xl font-extrabold font-display text-gray-700">404</h1>
      <p className="text-lg sm:text-xl text-gray-700/70 font-sans max-w-md">
        Esta página no existe o fue movida. Pero tu camino del cinturón negro sigue aquí.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Link href="/" className="hero-button glass-card-hover">
          Volver al Inicio
        </Link>
        <Link href="/asistente" className="hero-button glass-card-hover">
          Hablar con el Asistente
        </Link>
      </div>
    </div>
  );
}