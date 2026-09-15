'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellOff, CheckCheck } from 'lucide-react'
import type { NotificationView } from '@/lib/notifications/queries'
import { NOTIFICATION_PRIORITY_LABELS, NOTIFICATION_PRIORITY_STYLES, formatNotificationRelative } from '@/lib/notifications/format'

interface NotificationsCenterProps {
    initialItems: NotificationView[]
    initialNextCursor: string | null
    initialUnreadCount: number
}

interface NotificationResponse {
    items: NotificationView[]
    nextCursor: string | null
    unreadCount: number
}

export function NotificationsCenter({ initialItems, initialNextCursor, initialUnreadCount }: NotificationsCenterProps) {
    const [items, setItems] = useState(initialItems)
    const [nextCursor, setNextCursor] = useState(initialNextCursor)
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
    const [loadingMore, setLoadingMore] = useState(false)

    async function handleMarkAllRead() {
        try {
            await fetch('/api/dashboard/notifications', { method: 'PATCH' })
            setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })))
            setUnreadCount(0)
        } catch (error) {
            console.error('[notifications] No fue posible marcar como leídas', error)
        }
    }

    async function handleOpen(notification: NotificationView) {
        if (notification.readAt !== null) return

        setItems((current) =>
            current.map((item) => (item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item)),
        )
        setUnreadCount((current) => Math.max(0, current - 1))

        try {
            await fetch(`/api/dashboard/notifications/${notification.id}`, { method: 'PATCH' })
        } catch (error) {
            console.error('[notifications] No fue posible marcar la notificación', error)
        }
    }

    async function handleLoadMore() {
        if (!nextCursor) return

        setLoadingMore(true)

        try {
            const response = await fetch(`/api/dashboard/notifications?limit=20&cursor=${nextCursor}`, {
                cache: 'no-store',
            })

            if (response.ok) {
                const data = (await response.json()) as NotificationResponse
                setItems((current) => [...current, ...data.items])
                setNextCursor(data.nextCursor)
            }
        } catch (error) {
            console.error('[notifications] No fue posible cargar más notificaciones', error)
        } finally {
            setLoadingMore(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-xl font-extrabold text-white">Notificaciones</h1>
                    <p className="text-sm text-neutral-400">
                        {unreadCount > 0 ? `${unreadCount} sin leer` : 'Estás al día'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-bold text-cyan-400 transition-colors hover:border-cyan-500 hover:text-cyan-300"
                        onClick={handleMarkAllRead}
                        type="button"
                    >
                        <CheckCheck aria-hidden="true" className="size-4" />
                        Marcar todas
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-[#161b22] px-4 py-12 text-center">
                    <BellOff aria-hidden="true" className="size-6 text-neutral-600" />
                    <p className="text-sm text-neutral-400">Todavía no tienes notificaciones.</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item.id}>
                            <Link
                                className={`block rounded-xl border px-4 py-3 transition-colors ${item.readAt === null
                                    ? 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10'
                                    : 'border-neutral-800 bg-[#161b22] hover:bg-neutral-800/40'
                                    }`}
                                href={item.link ?? '/dashboard/notificaciones'}
                                onClick={() => void handleOpen(item)}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className={`size-2 shrink-0 rounded-full ${NOTIFICATION_PRIORITY_STYLES[item.priority]}`}
                                    />
                                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{item.title}</p>
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                        {NOTIFICATION_PRIORITY_LABELS[item.priority]}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm leading-snug text-neutral-400">{item.body}</p>
                                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                                    {formatNotificationRelative(item.createdAt)}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {nextCursor && (
                <div className="mt-4 flex justify-center">
                    <button
                        className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-bold text-neutral-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
                        disabled={loadingMore}
                        onClick={handleLoadMore}
                        type="button"
                    >
                        {loadingMore ? 'Cargando…' : 'Cargar más'}
                    </button>
                </div>
            )}
        </div>
    )
}
