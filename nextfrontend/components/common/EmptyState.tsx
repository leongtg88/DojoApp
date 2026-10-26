import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export type EmptyStateAction =
    | { label: string; href: string }
    | { label: string; onClick: () => void }

export interface EmptyStateProps {
    /** Icono decorativo (lucide). Se oculta a lectores de pantalla. */
    icon?: LucideIcon
    title: string
    /** Qué puede hacer la persona o qué pasará después. Nada de "No hay datos". */
    description?: string
    /** Acción real: un enlace o un botón. Si no existe, se omite. */
    action?: EmptyStateAction
    /**
     * `panel` (por defecto): bloque con borde discontinuo para una página o sección.
     * `inline`: sin borde ni fondo, para usarlo dentro de una tarjeta que ya los tiene.
     */
    variant?: 'panel' | 'inline'
    className?: string
}

const ACTION_CLASSES =
    'inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400'

const VARIANTS = {
    panel: 'rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center',
    inline: 'px-5 py-6 text-center',
} as const

/**
 * UX-A3 · Estado vacío reutilizable.
 *
 * Regla de la guía (principio 6): todo estado vacío explica qué pasa y, cuando
 * la app lo permite, ofrece una acción. Nunca un "No hay datos" a secas.
 */
export function EmptyState({ icon: Icon, title, description, action, variant = 'panel', className = '' }: EmptyStateProps) {
    return (
        <div className={`${VARIANTS[variant]} ${className}`}>
            {Icon && <Icon aria-hidden="true" className="mx-auto size-7 text-ink-4" />}
            <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
            {description && <p className="mx-auto mt-1 max-w-md text-xs text-ink-3">{description}</p>}
            {action && (
                <div className="mt-4 flex justify-center">
                    {'href' in action ? (
                        <Link className={ACTION_CLASSES} href={action.href}>{action.label}</Link>
                    ) : (
                        <button className={ACTION_CLASSES} onClick={action.onClick} type="button">{action.label}</button>
                    )}
                </div>
            )}
        </div>
    )
}
