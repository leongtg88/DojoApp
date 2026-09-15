'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import type { NotificationView } from '@/lib/notifications/queries'
import { NOTIFICATION_PRIORITY_STYLES, formatNotificationRelative } from '@/lib/notifications/format'

interface NotificationBellProps {
    initialUnreadCount?: number
}

interface NotificationResponse {
    items: NotificationView[]
    nextCursor: string | null
}

export function NotificationBell({ initialUnreadCount = 0 }: NotificationBellProps) {
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
    const [items, setItems] = useState<NotificationView[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let active = true

        async function fetchNotifications() {
            try {
                const response = await fetch('/api/dashboard/notifications?limit=6', { cache: 'no-store' })

                if (!response.ok || !active) return

                const data = (await response.json()) as NotificationResponse
                if (!active) return

                setItems(data.items)
                setUnreadCount(data.items.filter((item) => item.readAt === null).length)
            } catch (error) {
                console.error('[notifications] No fue posible cargar las notificaciones', error)
            }
        }

        void fetchNotifications()

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (!open) return

        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    async function handleMarkAllRead() {
        try {
            await fetch('/api/dashboard/notifications', { method: 'PATCH' })
            setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })))
            setUnreadCount(0)
        } catch (error) {
            console.error('[notifications] No fue posible marcar como leídas', error)
        }
    }

    async function handleOpenNotification(notification: NotificationView) {
        setOpen(false)

        if (notification.readAt !== null) return

        setItems((current) =>
            current.map((item) =>
                item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
            ),
        )
        setUnreadCount((current) => Math.max(0, current - 1))

        try {
            await fetch(`/api/dashboard/notifications/${notification.id}`, { method: 'PATCH' })
        } catch (error) {
            console.error('[notifications] No fue posible marcar la notificación', error)
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                aria-label={unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}
                className="relative flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                onClick={() => setOpen((current) => !current)}
                title="Notificaciones"
                type="button"
            >
                <Bell aria-hidden="true" className="size-4" />
                {unreadCount > 0 && (
                    <span className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold leading-4 text-[#0d1117]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-neutral-800 bg-[#161b22] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Notificaciones</p>
                        {unreadCount > 0 && (
                            <button
                                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
                                onClick={handleMarkAllRead}
                                type="button"
                            >
                                <CheckCheck aria-hidden="true" className="size-3.5" />
                                Marcar leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 && (
                            <p className="px-3 py-6 text-center text-xs text-neutral-500">No tienes notificaciones.</p>
                        )}

                        {items.map((item) => (
                            <Link
                                className={`flex gap-2.5 border-b border-neutral-800/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-neutral-800/50 ${item.readAt === null ? 'bg-cyan-500/5' : ''
                                    }`}
                                href="/dashboard/notificaciones"
                                key={item.id}
                                onClick={() => void handleOpenNotification(item)}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`mt-1.5 size-2 shrink-0 rounded-full ${NOTIFICATION_PRIORITY_STYLES[item.priority]}`}
                                />
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-bold text-white">{item.title}</span>
                                    <span className="mt-0.5 block text-[11px] leading-snug text-neutral-400">{item.body}</span>
                                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                                        {formatNotificationRelative(item.createdAt)}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>

                    <Link
                        className="block border-t border-neutral-800 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-cyan-400 transition-colors hover:bg-neutral-800/50 hover:text-cyan-300"
                        href="/dashboard/notificaciones"
                        onClick={() => setOpen(false)}
                    >
                        Ver todas
                    </Link>
                </div>
            )}
        </div>
    )
}
