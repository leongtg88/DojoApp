'use client'

import Image from 'next/image'
import { useTheme } from '../theme/ThemeProvider'

interface DashboardLogoProps {
    className?: string
}

export function DashboardLogo({ className = 'h-7 w-auto' }: DashboardLogoProps) {
    const { theme } = useTheme()

    return (
        <Image
            src={theme === 'dark' ? '/assets/LogoRectangularblanco.svg' : '/assets/LogoRectangularNegro.svg'}
            alt="Tosei Gusoku Dojo"
            width={810}
            height={165}
            priority
            className={className}
        />
    )
}