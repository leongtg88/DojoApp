import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
            <section className="w-full max-w-md border border-white/10 bg-[#0f0f0f] rounded-2xl p-8 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-300 font-semibold">Acceso restringido</p>
                <h1 className="mt-3 text-2xl sm:text-3xl font-semibold">No tienes acceso a este panel.</h1>
                <p className="mt-3 text-sm text-white/40 leading-relaxed">
                    Tu cuenta no tiene los permisos necesarios para entrar a esta sección. Si crees que esto es un error, contacta a la administración del dojo.
                </p>
                <Link
                    href="/"
                    className="inline-block mt-7 hero-button px-6 py-3"
                >
                    Volver al inicio
                </Link>
            </section>
        </main>
    )
}