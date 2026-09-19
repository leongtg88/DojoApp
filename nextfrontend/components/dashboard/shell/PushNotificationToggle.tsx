'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

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

export function PushNotificationToggle() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  const [state, setState] = useState<PushState>(() => {
    if (typeof window === 'undefined') return 'loading'
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
    if (Notification.permission === 'denied') return 'denied'
    return 'loading'
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state !== 'loading') return
    if (!publicKey) return

    let active = true
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (active) setState(subscription ? 'subscribed' : 'unsubscribed')
      })
      .catch(() => {
        if (active) setState('unsupported')
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey])

  async function subscribe() {
    if (!publicKey) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'unsubscribed')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) throw new Error('No fue posible guardar la suscripción')
      setState('subscribed')
    } catch (error) {
      console.error('[push] Error al activar las notificaciones', error)
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
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
      setState('unsubscribed')
    } catch (error) {
      console.error('[push] Error al desactivar las notificaciones', error)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading' || state === 'unsupported') return null

  const subscribed = state === 'subscribed'
  const disabled = busy || state === 'denied'
  const title = state === 'denied' ? 'Notificaciones bloqueadas en el navegador' : subscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'

  return (
    <button
      aria-label={title}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={subscribed ? unsubscribe : subscribe}
      title={title}
      type="button"
    >
      {state === 'denied' ? (
        <BellOff aria-hidden="true" className="size-4" />
      ) : subscribed ? (
        <BellRing aria-hidden="true" className="size-4 text-cyan-400" />
      ) : (
        <Bell aria-hidden="true" className="size-4" />
      )}
    </button>
  )
}
