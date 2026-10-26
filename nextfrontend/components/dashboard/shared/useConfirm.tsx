'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmModal } from './ConfirmModal'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  isDestructive?: boolean
}

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

/**
 * UX-A2 · Confirmación con el `ConfirmModal` único del proyecto.
 *
 * Sustituye a la confirmación nativa del navegador sin repetir el estado del
 * diálogo en cada componente:
 *
 * ```tsx
 * const { confirm, dialog } = useConfirm()
 * const confirmed = await confirm({ title, message, confirmLabel, isDestructive: true })
 * // ... y renderizar {dialog} dentro del JSX del componente
 * ```
 *
 * Si el componente se desmonta con una confirmación abierta, la promesa se
 * resuelve con `false` para que el llamador no quede esperando.
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  useEffect(
    () => () => {
      pendingRef.current?.resolve(false)
      pendingRef.current = null
    },
    [],
  )

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ options, resolve })
      }),
    [],
  )

  const finish = useCallback((value: boolean) => {
    pendingRef.current?.resolve(value)
    pendingRef.current = null
    setPending(null)
  }, [])

  const dialog = pending ? (
    <ConfirmModal
      open
      {...pending.options}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  ) : null

  return { confirm, dialog }
}
