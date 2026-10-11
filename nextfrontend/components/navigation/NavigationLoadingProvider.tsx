'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const SHOW_DELAY_MS = 250
const SAFETY_TIMEOUT_MS = 8000
const POLL_INTERVAL_MS = 120

interface NavigationLoadingContextValue {
  isLoading: boolean
  pendingToken: string | null
  startLoading: (href: string, token?: string) => void
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null)

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startLocationRef = useRef('')
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const clearTimers = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current)
      safetyTimer.current = null
    }
  }, [])

  const stopLoading = useCallback(() => {
    clearTimers()
    setPendingToken(null)
    setIsLoading(false)
  }, [clearTimers])

  const startLoading = useCallback(
    (href: string, token: string = href) => {
      clearTimers()
      startLocationRef.current = window.location.pathname + window.location.search
      setPendingToken(token)
      showTimer.current = setTimeout(() => setIsLoading(true), SHOW_DELAY_MS)
      safetyTimer.current = setTimeout(() => {
        setPendingToken(null)
        setIsLoading(false)
      }, SAFETY_TIMEOUT_MS)
    },
    [clearTimers],
  )

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    stopLoading()
  }, [pathname, stopLoading])

  useEffect(() => {
    if (!isLoading) return
    const id = setInterval(() => {
      if (window.location.pathname + window.location.search !== startLocationRef.current) {
        stopLoading()
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isLoading, stopLoading])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as Element | null
      const anchor = target?.closest?.('a') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.dataset.navlink === 'true') return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      const rawHref = anchor.getAttribute('href')
      if (!rawHref || rawHref.startsWith('#')) return
      let url: URL
      try {
        url = new URL(anchor.href, window.location.origin)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return
      if (url.pathname === pathnameRef.current) return
      startLoading(url.pathname + url.search + url.hash, 'global')
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [startLoading])

  useEffect(() => clearTimers, [clearTimers])

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, pendingToken, startLoading }}>
      {children}
    </NavigationLoadingContext.Provider>
  )
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext)
  if (!context) {
    throw new Error('useNavigationLoading must be used within a NavigationLoadingProvider')
  }
  return context
}
