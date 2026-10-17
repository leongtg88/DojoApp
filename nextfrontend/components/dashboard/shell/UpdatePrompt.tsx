'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

/** Cada cuánto se consulta la versión mientras la app sigue abierta. */
const CHECK_INTERVAL_MS = 10 * 60 * 1000
/** Igual que DashboardShell: ignoramos los cambios de pestaña fugaces. */
const MIN_HIDDEN_MS = 1_000

export const UPDATE_DISMISSED_STORAGE_KEY = 'tosei:update-dismissed-version'

interface UpdatePromptProps {
    /** Solo para pruebas: permite observar la recarga sin navegar. */
    onReload?: () => void
}

/**
 * Build con el que se cargó esta pestaña. Next inyecta `data-dpl-id` cuando
 * hay `deploymentId` configurado; el valor queda congelado en el HTML inicial,
 * así que sirve para detectar que el servidor ya sirve otro build.
 */
function readClientDeploymentId(): string | null {
    if (typeof document === 'undefined') return null
    return document.documentElement.dataset.dplId?.trim() || null
}

function readDismissedVersion(): string | null {
    try {
        return sessionStorage.getItem(UPDATE_DISMISSED_STORAGE_KEY)
    } catch {
        // storage no disponible
        return null
    }
}

/**
 * Avisa de que hay un despliegue nuevo. Una PWA instalada no tiene botón de
 * recargar y puede quedarse días en memoria ejecutando el bundle viejo, así
 * que sin este aviso el usuario no tiene forma de saber que debe actualizar.
 */
export function UpdatePrompt({ onReload }: UpdatePromptProps = {}) {
    const clientVersion = useRef<string | null>(null)
    const checking = useRef(false)
    const [pendingVersion, setPendingVersion] = useState<string | null>(null)
    const [reloading, setReloading] = useState(false)

    const check = useCallback(async () => {
        const current = clientVersion.current
        if (!current || checking.current) return
        if (document.visibilityState === 'hidden') return

        checking.current = true
        try {
            const response = await fetch('/api/app-version', { cache: 'no-store' })
            if (!response.ok) return

            const data = (await response.json()) as { version?: string | null }
            const version = typeof data.version === 'string' ? data.version.trim() : ''
            if (!version) return

            if (version === current) {
                // Se actualizó (por ejemplo, recarga manual): retiramos el aviso.
                setPendingVersion(null)
                return
            }

            if (readDismissedVersion() === version) return

            setPendingVersion(version)
        } catch {
            // Sin conexión o endpoint caído: no interrumpimos al usuario.
        } finally {
            checking.current = false
        }
    }, [])

    useEffect(() => {
        clientVersion.current = readClientDeploymentId()
        if (!clientVersion.current) return

        void check()
        const intervalId = window.setInterval(() => void check(), CHECK_INTERVAL_MS)

        let hiddenAt = 0
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                hiddenAt = Date.now()
                return
            }
            if (Date.now() - hiddenAt >= MIN_HIDDEN_MS) void check()
        }

        document.addEventListener('visibilitychange', handleVisibility)
        return () => {
            window.clearInterval(intervalId)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [check])

    if (!pendingVersion) return null

    const handleUpdate = () => {
        setReloading(true)
        // Le pedimos al SW que busque un sw.js nuevo; si no responde, la recarga
        // igualmente trae el build vigente porque las navegaciones van a la red.
        void navigator.serviceWorker
            ?.getRegistration()
            .then((registration) => registration?.update())
            .catch(() => {})

        if (onReload) {
            onReload()
            return
        }
        window.location.reload()
    }

    const handleDismiss = () => {
        try {
            sessionStorage.setItem(UPDATE_DISMISSED_STORAGE_KEY, pendingVersion)
        } catch {
            // storage no disponible
        }
        setPendingVersion(null)
    }

    return (
        <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 print:hidden md:inset-x-auto md:bottom-6 md:right-6 md:w-96">
            <div className="flex items-start gap-3 rounded-xl border border-edge bg-surface-2/95 p-3 shadow-lg shadow-black/40 backdrop-blur">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-accent">
                    <RefreshCw aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <div aria-atomic="true" aria-live="polite" role="status">
                        <p className="text-xs font-bold text-ink">Hay una actualización disponible</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-ink-3">Actualiza para ver los cambios más recientes.</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <button
                            className="rounded-md bg-cyan-500 px-2.5 py-1 text-[11px] font-bold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60"
                            disabled={reloading}
                            onClick={handleUpdate}
                            type="button"
                        >
                            {reloading ? 'Actualizando…' : 'Actualizar'}
                        </button>
                        <button
                            className="rounded-md px-2 py-1 text-[11px] font-semibold text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                            onClick={handleDismiss}
                            type="button"
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
