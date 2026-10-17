'use client'

import { useConsent } from './ConsentProvider'

/**
 * Botón para reabrir el banner de consentimiento y cambiar la elección.
 * Pensado para el footer y la Política de Cookies.
 */
export function ManageCookiesButton({ className }: { className?: string }) {
  const { openBanner } = useConsent()

  return (
    <button type="button" onClick={openBanner} className={className}>
      Gestionar cookies
    </button>
  )
}
