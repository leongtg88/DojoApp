import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Acceso restringido</p>
            <h1 className="mt-3 text-3xl font-bold text-[#1c1b1b]">No tienes acceso a este panel.</h1>
            <Link className="mt-6 w-fit font-semibold text-red-700 underline" href="/">
                Volver al inicio
            </Link>
        </main>
    )
}