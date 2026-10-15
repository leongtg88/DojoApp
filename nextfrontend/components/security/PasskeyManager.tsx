'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Fingerprint, Loader2, Plus, ShieldCheck, Smartphone, Trash2 } from 'lucide-react'

export interface PasskeyCredential {
  id: string
  deviceName: string | null
  deviceType: string | null
  backedUp: boolean
  createdAt: string
  lastUsedAt: string | null
}

interface PasskeyManagerProps {
  initialCredentials: PasskeyCredential[]
}

// Formatea una fecha ISO a dd/mm/aaaa usando partes UTC para que el HTML del
// servidor y el del cliente coincidan (evita errores de hidratación).
function formatDay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function guessDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Este dispositivo'
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Dispositivo Android'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows'
  return 'Este dispositivo'
}

export function PasskeyManager({ initialCredentials }: PasskeyManagerProps) {
  const [credentials, setCredentials] = useState<PasskeyCredential[]>(initialCredentials)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const { browserSupportsWebAuthn, platformAuthenticatorIsAvailable } = await import('@simplewebauthn/browser')
        if (!browserSupportsWebAuthn()) {
          if (active) setSupported(false)
          return
        }
        const available = await platformAuthenticatorIsAvailable()
        if (active) setSupported(available)
      } catch {
        if (active) setSupported(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/webauthn/credentials')
    if (!res.ok) return
    const data = (await res.json()) as { credentials: PasskeyCredential[] }
    setCredentials(data.credentials)
  }, [])

  const handleRegister = useCallback(async () => {
    setError(null)
    setNotice(null)
    setBusy('register')

    try {
      const { startRegistration } = await import('@simplewebauthn/browser')

      const optionsRes = await fetch('/api/auth/webauthn/register/options', { method: 'POST' })
      const optionsJSON = await optionsRes.json().catch(() => null)
      if (!optionsRes.ok) {
        throw new Error((optionsJSON as { error?: string } | null)?.error ?? 'No se pudieron obtener las opciones.')
      }

      const attestation = await startRegistration({ optionsJSON })

      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attestation, deviceName: guessDeviceName() }),
      })
      const data = (await verifyRes.json().catch(() => null)) as { error?: string } | null
      if (!verifyRes.ok) {
        throw new Error(data?.error ?? 'No se pudo activar la huella.')
      }

      await refresh()
      setNotice('¡Listo! Ya puedes entrar con tu huella desde este dispositivo.')
    } catch (err) {
      if ((err as Error)?.name === 'NotAllowedError') {
        setError('Cancelaste la operación o no se reconoció la huella.')
      } else {
        setError((err as Error)?.message || 'No se pudo activar la huella.')
      }
    } finally {
      setBusy(null)
    }
  }, [refresh])

  const handleDelete = useCallback(async (id: string) => {
    setError(null)
    setNotice(null)
    setBusy(id)

    try {
      const res = await fetch(`/api/auth/webauthn/credentials/${id}`, { method: 'DELETE' })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        throw new Error(data?.error ?? 'No se pudo eliminar el dispositivo.')
      }
      setCredentials((prev) => prev.filter((credential) => credential.id !== id))
      setNotice('Dispositivo eliminado. Ya no podrá entrar con su huella.')
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo eliminar el dispositivo.')
    } finally {
      setBusy(null)
    }
  }, [])

  return (
    <section className="rounded-2xl border border-edge bg-surface-2 p-6 shadow-sm">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-accent-text">
          <Fingerprint className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink">Ingreso con huella / Face ID</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Activa el acceso sin contraseña usando la huella, el rostro o el PIN de este dispositivo. Tu biometría nunca sale del
            dispositivo: solo guardamos una clave pública.
          </p>
        </div>
      </header>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-800/50 bg-red-950/40 p-3 text-xs text-danger-text">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-3 text-xs text-ok-text">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {supported === false && (
        <p className="mt-5 rounded-xl border border-edge bg-surface-1 p-3 text-xs text-ink-3">
          Este dispositivo o navegador no permite el acceso con huella. Prueba desde un teléfono o computadora con lector
          biométrico, usando Safari, Chrome o Edge.
        </p>
      )}

      {supported && (
        <div className="mt-5">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60"
            disabled={busy !== null}
            onClick={handleRegister}
            type="button"
          >
            {busy === 'register' ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
            Activar en este dispositivo
          </button>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-4">Dispositivos vinculados</p>

        {credentials.length === 0 ? (
          <p className="rounded-xl border border-dashed border-edge p-4 text-xs text-ink-3">
            Aún no has activado el ingreso con huella en ningún dispositivo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {credentials.map((credential) => (
              <li
                className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-surface-1 px-4 py-3"
                key={credential.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Smartphone aria-hidden="true" className="size-4 shrink-0 text-ink-4" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{credential.deviceName ?? 'Dispositivo'}</p>
                    <p className="text-[11px] text-ink-4">
                      Añadido el {formatDay(credential.createdAt)}
                      {credential.lastUsedAt ? ` · último uso ${formatDay(credential.lastUsedAt)}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  aria-label={`Eliminar ${credential.deviceName ?? 'dispositivo'}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-ink-3 transition-colors hover:bg-red-950/40 hover:text-danger-text disabled:opacity-60"
                  disabled={busy !== null}
                  onClick={() => handleDelete(credential.id)}
                  type="button"
                >
                  {busy === credential.id ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <Trash2 aria-hidden="true" className="size-3.5" />}
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
