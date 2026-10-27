'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface TabItem {
    id: string
    label: string
    content: ReactNode
    /** Contador opcional (pendientes, avisos). */
    badge?: number
}

interface TabsProps {
    items: TabItem[]
    /** Etiqueta accesible del conjunto de pestañas. */
    label: string
    defaultTab?: string
}

/**
 * UX-B0/B6 · Pestañas accesibles.
 *
 * `role="tablist"`, `aria-selected`, panel asociado y navegación con flechas,
 * Inicio y Fin. Los paneles se montan una vez y se ocultan con `hidden`.
 * 44 px de alto para uso en móvil.
 */
export function Tabs({ items, label, defaultTab }: TabsProps) {
    const [active, setActive] = useState(defaultTab ?? items[0]?.id ?? '')
    const baseId = useId()
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const index = items.findIndex((item) => item.id === active)
        if (index < 0 || items.length === 0) return

        let nextIndex: number | null = null
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length
        else if (event.key === 'Home') nextIndex = 0
        else if (event.key === 'End') nextIndex = items.length - 1
        if (nextIndex === null) return

        event.preventDefault()
        const nextId = items[nextIndex].id
        setActive(nextId)
        tabRefs.current[nextId]?.focus()
    }

    return (
        <div>
            <div
                aria-label={label}
                className="flex flex-wrap gap-2"
                onKeyDown={handleKeyDown}
                role="tablist"
            >
                {items.map((item) => {
                    const selected = item.id === active
                    return (
                        <button
                            aria-controls={`${baseId}-panel-${item.id}`}
                            aria-selected={selected}
                            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-bold transition-colors ${selected ? 'border-cyan-500/50 bg-cyan-500/15 text-accent-text' : 'border-edge-strong bg-surface-1 text-ink-3 hover:bg-surface-3 hover:text-ink'}`}
                            id={`${baseId}-tab-${item.id}`}
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            ref={(element) => {
                                tabRefs.current[item.id] = element
                            }}
                            role="tab"
                            tabIndex={selected ? 0 : -1}
                            type="button"
                        >
                            {item.label}
                            {typeof item.badge === 'number' && item.badge > 0 && (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-warn-text">{item.badge}</span>
                            )}
                        </button>
                    )
                })}
            </div>

            {items.map((item) => (
                <div
                    aria-labelledby={`${baseId}-tab-${item.id}`}
                    className="mt-5"
                    hidden={item.id !== active}
                    id={`${baseId}-panel-${item.id}`}
                    key={item.id}
                    role="tabpanel"
                >
                    {item.content}
                </div>
            ))}
        </div>
    )
}
