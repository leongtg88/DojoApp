'use client'

import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ConditionalFooter from '@/components/conditionalFooter'
import ScrollToTop from '@/components/ScrollToTop'
import { InstallPrompt } from '@/components/InstallPrompt'

export function AppChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard')
    const isAuth = pathname === '/login' || pathname === '/registro'

    return (
        <>
            {!isDashboard && !isAuth && <Navbar />}
            <Suspense>
                <ScrollToTop />
            </Suspense>
            <main className={isDashboard || isAuth ? 'flex-grow' : 'flex-grow pt-20 md:pb-20'}>{children}</main>
            {!isDashboard && !isAuth && <ConditionalFooter />}
            {!isDashboard && !isAuth && <InstallPrompt />}
        </>
    )
}