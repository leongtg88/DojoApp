'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface ResetPasswordFormProps {
	token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
	const router = useRouter()
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		setMessage(null)

		if (password.length < 8) {
			setError('La contraseña debe tener al menos 8 caracteres.')
			return
		}

		if (password !== confirmPassword) {
			setError('Las contraseñas no coinciden.')
			return
		}

		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password }),
			})
			const payload = await response.json().catch(() => ({})) as { message?: string; error?: string }

			if (!response.ok) {
				throw new Error(payload.error ?? 'No se pudo restablecer la contraseña.')
			}

			setMessage(payload.message ?? 'Tu contraseña fue actualizada.')
			setTimeout(() => router.push('/login'), 1500)
		} catch (reason: unknown) {
			setError(reason instanceof Error ? reason.message : 'No se pudo restablecer la contraseña.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
			<section className="w-full max-w-md border border-white/10 bg-[#0f0f0f] rounded-2xl p-8">
				<p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-semibold">Recuperación de cuenta</p>
				<h1 className="mt-2 text-2xl sm:text-3xl font-semibold">Nueva contraseña</h1>
				<p className="mt-2 text-sm text-white/40">Elige una contraseña nueva para tu cuenta. Después podrás iniciar sesión de nuevo.</p>

				<form onSubmit={handleSubmit} className="mt-6 space-y-4">
					<div className="space-y-1.5">
						<label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-white/50">Nueva contraseña</label>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								minLength={8}
								required
								placeholder="Mínimo 8 caracteres"
								className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-white/25 focus:border-cyan-400"
							/>
							<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40 hover:text-white">
								{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
							</button>
						</div>
					</div>

					<div className="space-y-1.5">
						<label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wide text-white/50">Confirmar contraseña</label>
						<div className="relative">
							<input
								id="confirmPassword"
								type={showConfirm ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								minLength={8}
								required
								placeholder="Repite la contraseña"
								className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-white/25 focus:border-cyan-400"
							/>
							<button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'} className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40 hover:text-white">
								{showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
							</button>
						</div>
					</div>

					{error && <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</p>}
					{message && <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">{message}</p>}

					<button type="submit" disabled={isLoading} className="hero-button w-full inline-flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-60">
						{isLoading && <Loader2 className="size-4 animate-spin" />}
						{isLoading ? 'Guardando…' : 'Restablecer contraseña'}
					</button>
				</form>
			</section>
		</main>
	)
}