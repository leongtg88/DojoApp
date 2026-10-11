'use client'

import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ConditionalFooter from '@/components/conditionalFooter'
import ScrollToTop from '@/components/ScrollToTop'
import { InstallPrompt } from '@/components/InstallPrompt'
import { NavigationLoadingProvider } from '@/components/navigation/NavigationLoadingProvider'
import { NavigationOverlay } from '@/components/navigation/NavigationOverlay'

export function AppChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard')
    const isAuth = pathname.startsWith('/registro') || pathname === '/login'
    const showPublicChrome = !isDashboard && !isAuth

    return (
        <NavigationLoadingProvider>
            {showPublicChrome && <Navbar />}
            <Suspense>
                <ScrollToTop />
            </Suspense>
            <main className={isDashboard || isAuth ? 'flex-grow' : 'flex-grow pt-17 md:pb-20'}>{children}</main>
            {showPublicChrome && <ConditionalFooter />}
            {showPublicChrome && <InstallPrompt />}
            <NavigationOverlay />
        </NavigationLoadingProvider>
    )
}