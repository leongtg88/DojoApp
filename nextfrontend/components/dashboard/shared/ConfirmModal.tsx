'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { COPY } from '@/lib/ui/copy'

export interface ConfirmModalProps {
    open: boolean
    title: string
    message: string
    confirmLabel: string
    isDestructive?: boolean
    children?: ReactNode
    onConfirm: () => void
    onCancel: () => void
}

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo de confirmación reutilizable para acciones destructivas del dashboard.
 * Incluye overlay oscuro, cierre al hacer clic fuera y botón de confirmación que
 * cambia a rojo cuando `isDestructive` está activo.
 *
 * Accesibilidad (UX-A2): foco atrapado mientras está abierto, `Esc` cancela y al
 * cerrar el foco vuelve al elemento que abrió el diálogo. El foco inicial va al
 * botón de cancelar para que la acción destructiva nunca quede preseleccionada.
 */
export function ConfirmModal({ open, title, message, confirmLabel, isDestructive = false, children, onConfirm, onCancel }: ConfirmModalProps) {
    const titleId = useId()
    const messageId = useId()
    const dialogRef = useRef<HTMLDivElement>(null)
    const cancelRef = useRef<HTMLButtonElement>(null)
    const onCancelRef = useRef(onCancel)

    useEffect(() => {
        onCancelRef.current = onCancel
    }, [onCancel])

    useEffect(() => {
        if (!open) return

        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
        cancelRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onCancelRef.current()
                return
            }
            if (event.key !== 'Tab') return

            const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onCancel}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                className="w-full max-w-sm rounded-lg border border-edge bg-surface-2 shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="border-b border-edge px-5 py-4">
                    <h3 id={titleId} className="font-display text-lg font-bold text-ink">{title}</h3>
                </div>
                <p id={messageId} className="px-5 py-4 text-sm text-ink-2">{message}</p>
                {children && <div className="border-t border-edge px-5 py-4">{children}</div>}
                <div className="flex items-center justify-end gap-2.5 border-t border-edge px-5 py-3.5">
                    <button ref={cancelRef} type="button" onClick={onCancel} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink">
                        {COPY.actions.cancel}
                    </button>
                    <button type="button" onClick={onConfirm} className={`rounded-md px-4 py-2 text-xs font-semibold text-white ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
