import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  INSTALL_REQUEST_EVENT,
  isAppInstalled,
  isInstallPromptDismissed,
  isStandalone,
  markAppInstalled,
  markInstallPromptDismissed,
  requestAppInstall,
  useIsInstalledPwa,
} from '@/lib/pwa'

beforeEach(() => {
  window.localStorage.clear()
})

// PWA (cliente, jsdom).
describe('utilidades PWA', () => {
  it('detecta la app instalada por localStorage', () => {
    expect(isAppInstalled()).toBe(false)
    markAppInstalled()
    expect(isAppInstalled()).toBe(true)
  })

  it('recuerda que el prompt de instalación fue descartado', () => {
    expect(isInstallPromptDismissed()).toBe(false)
    markInstallPromptDismissed()
    expect(isInstallPromptDismissed()).toBe(true)
  })

  it('requestAppInstall emite el evento de instalación', () => {
    const listener = vi.fn()
    window.addEventListener(INSTALL_REQUEST_EVENT, listener)
    requestAppInstall()
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(INSTALL_REQUEST_EVENT, listener)
  })

  it('isStandalone respeta display-mode: standalone', () => {
    const original = window.matchMedia
    window.matchMedia = (() => ({ matches: true, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
    expect(isStandalone()).toBe(true)
    window.matchMedia = original
  })

  it('useIsInstalledPwa refleja el estado guardado al montar', () => {
    markAppInstalled()
    function Probe() {
      return <span>{useIsInstalledPwa() ? 'instalada' : 'no instalada'}</span>
    }
    render(<Probe />)
    expect(screen.getByText('instalada')).toBeInTheDocument()
  })
})
