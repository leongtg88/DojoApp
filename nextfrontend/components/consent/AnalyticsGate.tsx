'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { MetaPixel } from '@adkit/meta-pixel-next'
import { useConsent } from './ConsentProvider'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

/**
 * Carga scripts de terceros SOLO cuando el usuario otorgó el consentimiento
 * correspondiente:
 * - Google Analytics → categoría "analytics".
 * - Meta Pixel → categoría "marketing".
 *
 * Sin consentimiento no se descarga ningún script de terceros ni se crean sus
 * cookies. Hasta que se lee la decisión guardada (`isReady`) tampoco se cargan,
 * para no adelantarnos a la elección del usuario.
 */
export function AnalyticsGate() {
  const { isReady, hasConsent } = useConsent()

  if (!isReady) return null

  const analyticsAllowed = hasConsent('analytics') && GA_ID.length > 0
  const marketingAllowed = hasConsent('marketing')

  return (
    <>
      {analyticsAllowed && <GoogleAnalytics gaId={GA_ID} />}
      {marketingAllowed && <MetaPixel />}
    </>
  )
}
