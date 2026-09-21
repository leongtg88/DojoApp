'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export type DashboardTheme = 'dark' | 'light'

interface ThemeContextValue {
    theme: DashboardTheme
    setTheme: (theme: DashboardTheme) => void
    toggleTheme: () => void
}

const STORAGE_KEY = 'tgd-dashboard-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function isDashboardRoute(pathname: string): boolean {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

// El estado inicial es fijo para que SSR y la primera hidratación coincidan
// (evita hydration mismatch). La preferencia guardada se aplica en un efecto
// posterior; el script inline de layout.tsx ya aplica el tema al <html> antes
// de que React hidrate.
function getInitialTheme(): DashboardTheme {
    return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [theme, setThemeState] = useState<DashboardTheme>(getInitialTheme)
    const isFirstRender = useRef(true)

    useEffect(() => {
        const root = document.documentElement

        // Tras la primera hidratación se aplica la preferencia guardada.
        if (isFirstRender.current) {
            isFirstRender.current = false
            let stored: DashboardTheme = 'dark'
            try {
                const saved = window.localStorage.getItem(STORAGE_KEY)
                if (saved === 'light' || saved === 'dark') stored = saved
            } catch {
                /* almacenamiento no disponible */
            }
            if (stored !== theme) {
                setThemeState(stored)
                return
            }
        }

        if (!isDashboardRoute(pathname)) {
            root.removeAttribute('data-theme')
            root.style.colorScheme = ''
            return
        }
        root.setAttribute('data-theme', theme)
        root.style.colorScheme = theme
        try {
            window.localStorage.setItem(STORAGE_KEY, theme)
        } catch {
            /* almacenamiento no disponible */
        }
    }, [theme, pathname])

    const setTheme = useCallback((next: DashboardTheme) => setThemeState(next), [])
    const toggleTheme = useCallback(() => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')), [])

    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
    return context
}