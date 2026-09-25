'use client'

import { useEffect } from 'react'

export function PwaRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return
        if (!('serviceWorker' in navigator)) return
        if (!window.isSecureContext) return

        const onLoad = () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {})

            // Pide almacenamiento persistente para la PWA instalada: WebKit
            // otorga el modo persistente a las apps del home screen, lo que
            // evita que se evacúen cookies/cache al cerrar la app y se pierda
            // la sesión en iOS.
            if (navigator.storage?.persisted && navigator.storage?.persist) {
                navigator.storage
                    .persisted()
                    .then((persisted) => {
                        if (!persisted) return navigator.storage.persist()
                    })
                    .catch(() => {})
            }
        }

        window.addEventListener('load', onLoad)
        return () => window.removeEventListener('load', onLoad)
    }, [])

    return null
}