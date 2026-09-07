'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(display-mode: standalone)').matches) return true
    const nav = navigator as Navigator & { standalone?: boolean }
    return typeof nav.standalone === 'boolean' && nav.standalone
}

function isIos(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function InstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (isStandalone()) return

        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault()
            setDeferred(event as BeforeInstallPromptEvent)
            setVisible(true)
        }

        const onAppInstalled = () => {
            setVisible(false)
            setDeferred(null)
        }

        let timer: ReturnType<typeof setTimeout> | undefined
        if (isIos()) {
            timer = setTimeout(() => setVisible(true), 0)
        }

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
        window.addEventListener('appinstalled', onAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
            window.removeEventListener('appinstalled', onAppInstalled)
            if (timer !== undefined) clearTimeout(timer)
        }
    }, [])

    if (!visible) return null

    const handleInstall = async () => {
        if (!deferred) return
        await deferred.prompt()
        const { outcome } = await deferred.userChoice
        setDeferred(null)
        if (outcome === 'accepted') setVisible(false)
    }

    return (
        <div className="fixed bottom-4 inset-x-4 z-[70] max-w-sm mx-auto rounded-2xl border border-white/10 bg-black/85 backdrop-blur-md p-4 pl-5 shadow-2xl shadow-black/50">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setVisible(false)}
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
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-gray-900 hover:bg-brand-accent-hover transition-colors"
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