import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

interface RestablecerPasswordPageProps {
	searchParams: Promise<{ token?: string }>
}

export default async function RestablecerPasswordPage({ searchParams }: RestablecerPasswordPageProps) {
	const { token } = await searchParams

	if (!token) {
		return (
			<main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
				<section className="w-full max-w-md border border-white/10 bg-[#0f0f0f] rounded-2xl p-8 text-center">
					<h1 className="text-2xl font-semibold">Enlace incompleto</h1>
					<p className="mt-3 text-sm text-white/60">El enlace de recuperación está incompleto o es inválido.</p>
					<Link href="/login" className="inline-block mt-6 hero-button px-6 py-3">Solicitar un nuevo enlace</Link>
				</section>
			</main>
		)
	}

	return <ResetPasswordForm token={token} />
}