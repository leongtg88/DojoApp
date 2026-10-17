'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cookie, ChevronDown, X } from 'lucide-react'
import { useConsent } from './ConsentProvider'

/**
 * Banner de consentimiento de cookies. Se muestra en el sitio público hasta
 * que el usuario decide (acepta, rechaza o guarda preferencias). En las
 * pantallas de dashboard y autenticación se oculta para no interferir.
 *
 * El diálogo interno solo se monta cuando el banner debe verse: así el estado
 * de los toggles se reinicia con la decisión vigente cada vez que se reabre,
 * sin necesidad de un efecto.
 */
export function CookieConsentBanner() {
  const { isBannerOpen } = useConsent()
  const pathname = usePathname()

  const isDashboard = pathname.startsWith('/dashboard')
  const isAuth = pathname.startsWith('/registro') || pathname === '/login'
  if (!isBannerOpen || isDashboard || isAuth) return null

  return <CookieConsentDialog />
}

function CookieConsentDialog() {
  const { consent, hasDecision, acceptAll, rejectAll, savePreferences, closeBanner } = useConsent()
  const [showPreferences, setShowPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Consentimiento de cookies"
      className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="relative p-4 sm:p-5">
          {/* Solo se puede cerrar sin cambios si el usuario ya había decidido;
              en la primera visita debe elegir una opción. */}
          {hasDecision && (
            <button
              type="button"
              onClick={closeBanner}
              aria-label="Cerrar sin cambios"
              className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-sm font-bold text-gray-900">
                Usamos cookies
              </h2>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                Usamos cookies estrictamente necesarias para el funcionamiento y tu
                seguridad (inicio de sesión y verificación de identidad). Con tu
                permiso, también usamos cookies analíticas y de marketing para
                mejorar el sitio y medir campañas. Puedes cambiar tu elección
                cuando quieras —{' '}
                <Link href="/cookies" className="text-brand-accent hover:underline">
                  Política de Cookies
                </Link>
                {' '}y{' '}
                <Link href="/privacidad" className="text-brand-accent hover:underline">
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Panel de preferencias (colapsable) */}
          {showPreferences && (
            <div className="mt-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <label className="flex items-start justify-between gap-4 rounded-lg bg-white p-3">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-800">
                    Estrictamente necesarias
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">
                    Imprescindibles para iniciar sesión y para la verificación de
                    identidad (huella / Face ID). No se pueden desactivar.
                  </span>
                </span>
                <span className="mt-1 shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  Siempre activas
                </span>
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg bg-white p-3">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-800">
                    Analíticas
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">
                    Nos ayudan a entender cómo se usa el sitio (Google Analytics).
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-brand-accent)]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg bg-white p-3">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-800">
                    Marketing
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">
                    Permiten medir la eficacia de nuestras campañas (Meta Pixel).
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-brand-accent)]"
                />
              </label>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {showPreferences ? (
              <>
                <button
                  type="button"
                  onClick={() => savePreferences({ analytics, marketing })}
                  className="rounded-lg bg-brand-accent px-4 py-2 text-xs font-bold text-gray-900 transition-colors hover:bg-brand-accent-hover hover:text-white"
                >
                  Guardar preferencias
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Volver
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Preferencias
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Rechazar
                </button>
                {/* Mismo efecto que el botón "Empieza Hoy" del hero: fondo y
                    borde siguen el color animado (color-change) vía bg-current. */}
                <div
                  className="inline-block rounded-lg bg-current backdrop-blur-sm shadow-xl/30 border border-current hover:bg-white hover:border-white transition-colors duration-300"
                  style={{ animation: 'color-change 10s infinite linear' }}
                >
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="w-full px-4 py-2 text-xs font-bold text-gray-900 cursor-pointer"
                  >
                    Aceptar todo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
