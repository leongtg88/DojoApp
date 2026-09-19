'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, BellRing, CheckCheck } from 'lucide-react'
import type { NotificationView } from '@/lib/notifications/queries'
import { NOTIFICATION_PRIORITY_STYLES, formatNotificationRelative } from '@/lib/notifications/format'

interface NotificationBellProps {
    initialUnreadCount?: number
}

interface NotificationResponse {
    items: NotificationView[]
    nextCursor: string | null
    unreadCount: number
}

type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

function resolvePushState(): PushState {
    if (typeof window === 'undefined') return 'loading'
    if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
    if (Notification.permission === 'denied') return 'denied'
    return 'loading'
}

export function NotificationBell({ initialUnreadCount = 0 }: NotificationBellProps) {
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
    const [items, setItems] = useState<NotificationView[]>([])
    const [pushState, setPushState] = useState<PushState>(resolvePushState)
    const [pushBusy, setPushBusy] = useState(false)
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
                setUnreadCount(data.unreadCount)
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
        if (pushState !== 'loading') return
        if (!VAPID_PUBLIC_KEY) return

        let active = true
        navigator.serviceWorker.ready
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => {
                if (active) setPushState(subscription ? 'subscribed' : 'unsubscribed')
            })
            .catch(() => {
                if (active) setPushState('unsupported')
            })

        return () => {
            active = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [VAPID_PUBLIC_KEY])

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

    async function subscribePush() {
        if (!VAPID_PUBLIC_KEY) return
        setPushBusy(true)
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                setPushState(permission === 'denied' ? 'denied' : 'unsubscribed')
                return
            }

            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
            })

            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
            })

            if (!response.ok) throw new Error('No fue posible guardar la suscripción')
            setPushState('subscribed')
        } catch (error) {
            console.error('[push] Error al activar las notificaciones', error)
        } finally {
            setPushBusy(false)
        }
    }

    async function unsubscribePush() {
        setPushBusy(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                })
                await subscription.unsubscribe()
            }
            setPushState('unsubscribed')
        } catch (error) {
            console.error('[push] Error al desactivar las notificaciones', error)
        } finally {
            setPushBusy(false)
        }
    }

    const showPushRow = pushState !== 'loading' && pushState !== 'unsupported'
    const pushSubscribed = pushState === 'subscribed'
    const pushDisabled = pushBusy || pushState === 'denied'
    const pushLabel =
        pushState === 'denied'
            ? 'Notificaciones push bloqueadas en el navegador'
            : pushSubscribed
                ? 'Desactivar notificaciones push'
                : 'Activar notificaciones push'

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
                                href={item.link ?? '/dashboard/notificaciones'}
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

                    {showPushRow && (
                        <button
                            className="flex w-full items-center gap-2 border-t border-neutral-800 px-3 py-2 text-left text-[11px] font-semibold text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pushDisabled}
                            onClick={() => void (pushSubscribed ? unsubscribePush() : subscribePush())}
                            type="button"
                        >
                            {pushState === 'denied' ? (
                                <BellOff aria-hidden="true" className="size-3.5 shrink-0" />
                            ) : pushSubscribed ? (
                                <BellRing aria-hidden="true" className="size-3.5 shrink-0 text-cyan-400" />
                            ) : (
                                <Bell aria-hidden="true" className="size-3.5 shrink-0" />
                            )}
                            <span>{pushLabel}</span>
                        </button>
                    )}

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
