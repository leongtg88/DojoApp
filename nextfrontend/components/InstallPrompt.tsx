'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, X } from 'lucide-react'
import {
    INSTALL_REQUEST_EVENT,
    isAppInstalled,
    isInstallPromptDismissed,
    markAppInstalled,
    markInstallPromptDismissed,
} from '@/lib/pwa'

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const PROMPT_TARGET_ROUTES = ['/', '/inscripcion']
const PROMPT_SEEN_SESSION_KEY = 'tosei:install-prompt-seen-session'

function isIos(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function InstallPrompt() {
    const pathname = usePathname()
    const isTargetRoute = PROMPT_TARGET_ROUTES.includes(pathname)
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
    const [visible, setVisible] = useState(false)

    const [prevIsTarget, setPrevIsTarget] = useState(isTargetRoute)
    if (prevIsTarget !== isTargetRoute) {
        setPrevIsTarget(isTargetRoute)
        if (!isTargetRoute) {
            setVisible(false)
        }
    }

    useEffect(() => {
        if (!isTargetRoute) return

        if (isAppInstalled() || isInstallPromptDismissed()) return

        let seenInSession = false
        try {
            seenInSession = sessionStorage.getItem(PROMPT_SEEN_SESSION_KEY) === '1'
        } catch {
            // storage no disponible
        }
        if (seenInSession) return

        let currentDeferred: BeforeInstallPromptEvent | null = null

        const show = () => {
            if (seenInSession) return
            try {
                sessionStorage.setItem(PROMPT_SEEN_SESSION_KEY, '1')
            } catch {
                // storage no disponible
            }
            seenInSession = true
            setVisible(true)
        }

        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault()
            currentDeferred = event as BeforeInstallPromptEvent
            setDeferred(currentDeferred)
            show()
        }

        const onRequestInstall = () => {
            if (currentDeferred || isIos()) show()
        }

        const onAppInstalled = () => {
            markAppInstalled()
            setVisible(false)
            setDeferred(null)
            currentDeferred = null
        }

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
        window.addEventListener('appinstalled', onAppInstalled)
        window.addEventListener(INSTALL_REQUEST_EVENT, onRequestInstall)

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
            window.removeEventListener('appinstalled', onAppInstalled)
            window.removeEventListener(INSTALL_REQUEST_EVENT, onRequestInstall)
        }
    }, [isTargetRoute])

    if (!visible || !isTargetRoute) return null

    const handleInstall = async () => {
        if (!deferred) return
        await deferred.prompt()
        const { outcome } = await deferred.userChoice
        if (outcome === 'accepted') markAppInstalled()
        setDeferred(null)
        setVisible(false)
    }

    const handleDismiss = () => {
        markInstallPromptDismissed()
        setDeferred(null)
        setVisible(false)
    }

    return (
        <div className="fixed bottom-4 inset-x-4 z-[70] max-w-sm mx-auto rounded-2xl border border-white/10 bg-black/85 backdrop-blur-md p-4 pl-5 shadow-2xl shadow-black/50">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center">
                    <Download className="w-5 h-5 text-brand-accent" />
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-white leading-snug">Instala la app de Tosei Gusoku Dojo</p>
                    {deferred ? (
                        <button
                            type="button"
                            onClick={handleInstall}
                            className="hero-button-dark px-4! py-2!"
                        >
                            <Download className="w-4 h-4" />
                            Instalar app
                        </button>
                    ) : (
                        <p className="text-xs text-white/60 leading-relaxed">
                            En iPhone: toca el botón <span className="text-white/90">Compartir</span> y elige{' '}
                            <span className="text-white/90">«Añadir a pantalla de inicio»</span>.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}