'use client'

import type { ReactNode } from 'react'

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

/**
 * Diálogo de confirmación reutilizable para acciones destructivas del dashboard.
 * Incluye overlay oscuro, cierre al hacer clic fuera y botón de confirmación que
 * cambia a rojo cuando `isDestructive` está activo.
 */
export function ConfirmModal({ open, title, message, confirmLabel, isDestructive = false, children, onConfirm, onCancel }: ConfirmModalProps) {
    if (!open) return null

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onCancel}>
            <div className="w-full max-w-sm rounded-lg border border-edge bg-surface-2 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="border-b border-edge px-5 py-4">
                    <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                </div>
                <p className="px-5 py-4 text-sm text-ink-2">{message}</p>
                {children && <div className="border-t border-edge px-5 py-4">{children}</div>}
                <div className="flex items-center justify-end gap-2.5 border-t border-edge px-5 py-3.5">
                    <button type="button" onClick={onCancel} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink">
                        Cancelar
                    </button>
                    <button type="button" onClick={onConfirm} className={`rounded-md px-4 py-2 text-xs font-semibold text-white ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
