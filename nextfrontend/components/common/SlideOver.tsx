'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SlideOverProps {
    open: boolean
    onClose: () => void
    title: string
    children: ReactNode
}

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * UX-B0/B8 · Panel lateral accesible.
 *
 * Foco atrapado, `Esc` cierra y el foco vuelve al elemento que lo abrió.
 * Se usa en móvil para el expediente del alumno.
 */
export function SlideOver({ open, onClose, title, children }: SlideOverProps) {
    const titleId = useId()
    const panelRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const onCloseRef = useRef(onClose)

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        if (!open) return

        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
        closeRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onCloseRef.current()
                return
            }
            if (event.key !== 'Tab') return

            const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
            if (!focusables || focusables.length === 0) return

            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            previouslyFocused?.focus()
        }
    }, [open])

    if (!open) return null

    return (
        <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50" role="dialog">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface-2 shadow-2xl" ref={panelRef}>
                <div className="flex items-center justify-between gap-3 border-b border-edge px-5 py-4">
                    <h2 className="font-display text-lg font-bold text-ink" id={titleId}>{title}</h2>
                    <button
                        aria-label="Cerrar panel"
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                        onClick={onClose}
                        ref={closeRef}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
            </div>
        </div>
    )
}
