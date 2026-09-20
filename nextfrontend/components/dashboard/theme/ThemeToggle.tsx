'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            type="button"
        >
            {isDark ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
        </button>
    )
}