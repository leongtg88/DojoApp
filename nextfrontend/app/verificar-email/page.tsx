'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Verificando tu correo...')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setMessage('El enlace de verificación está incompleto.')
      return
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const result = await response.json() as { message?: string; error?: string }
        if (!response.ok) throw new Error(result.error || 'No se pudo verificar el correo')
        setSuccess(true)
        setMessage(result.message || 'Correo verificado correctamente.')
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'No se pudo verificar el correo.')
      })
  }, [searchParams])

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <section className="w-full max-w-md border border-white/10 bg-[#0f0f0f] rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">Verificación de correo</h1>
        <p className={success ? 'text-emerald-300' : 'text-white/60'}>{message}</p>
        {success && (
          <Link href="/login" className="inline-block mt-6 hero-button px-6 py-3">
            Ir al inicio de sesión
          </Link>
        )}
      </section>
    </main>
  )
}