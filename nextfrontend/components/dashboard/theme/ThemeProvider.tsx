'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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

function getInitialTheme(): DashboardTheme {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [theme, setThemeState] = useState<DashboardTheme>(getInitialTheme)

    useEffect(() => {
        const root = document.documentElement
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