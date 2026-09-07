'use client'

import { Download, Share2 } from 'lucide-react'
import { requestAppInstall, useIsInstalledPwa } from '@/lib/pwa'

export function InstallAppBand() {
    const isInstalled = useIsInstalledPwa()
    if (isInstalled) return null

    return (
        <section className="px-8 py-14 md:py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto rounded-3xl border border-white/10 bg-black/90 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <span className="inline-block px-3.5 py-1 bg-brand-accent/15 border border-brand-accent/30 text-brand-accent rounded-full text-xs font-bold font-display uppercase tracking-wider animate-pulse">
                        El dojo en tu bolsillo
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                        Instala la app en tu teléfono
                    </h2>
                    <p className="text-sm sm:text-base text-white/60 font-sans leading-relaxed max-w-xl">
                        Accede a la web como una app real: se abre a pantalla completa, carga más rápido y queda tu logo de
                        Tosei Gusoku en la pantalla de inicio.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-3 md:items-end">
                    <button
                        type="button"
                        onClick={requestAppInstall}
                        className="hero-button-dark"
                    >
                        <Download className="w-4 h-4" />
                        Instalar la App
                    </button>
                    <p className="text-xs text-white/50 font-sans flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" /> En iPhone: Compartir → «Añadir a pantalla de inicio»
                    </p>
                </div>
            </div>
        </section>
    )
}