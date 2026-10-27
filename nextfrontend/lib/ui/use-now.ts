'use client'

import { useSyncExternalStore } from 'react'

/**
 * Fecha/hora del cliente, disponible solo después de la hidratación.
 *
 * Evita el desajuste de hidratación cuando un componente cliente necesita
 * `new Date()` para decir "hoy" o "mañana": el servidor (y el primer render del
 * cliente durante la hidratación) reciben `null`, y en cuanto React se suscribe
 * el valor real entra sin provocar un `setState` dentro de un efecto.
 *
 * Se actualiza una vez por minuto, así que un panel abierto mucho tiempo no se
 * queda con una hora vieja.
 */
let currentTime: Date | null = null
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function emit(): void {
    for (const listener of listeners) listener()
}

function start(): void {
    if (timer !== null) return
    currentTime = new Date()
    emit()
    timer = setInterval(() => {
        currentTime = new Date()
        emit()
    }, 60_000)
}

function stop(): void {
    if (listeners.size > 0 || timer === null) return
    clearInterval(timer)
    timer = null
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    start()

    return () => {
        listeners.delete(listener)
        stop()
    }
}

function getSnapshot(): Date | null {
    return currentTime
}

function getServerSnapshot(): Date | null {
    return null
}

export function useNow(): Date | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
