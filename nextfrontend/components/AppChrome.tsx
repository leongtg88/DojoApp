'use client'

import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ConditionalFooter from '@/components/conditionalFooter'
import ScrollToTop from '@/components/ScrollToTop'

export function AppChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isDashboard = pathname.startsWith('/dashboard')

    return (
        <>
            {!isDashboard && <Navbar />}
            <Suspense>
                <ScrollToTop />
            </Suspense>
            <main className={isDashboard ? 'flex-grow' : 'flex-grow pt-20 md:pb-20'}>{children}</main>
            {!isDashboard && <ConditionalFooter />}
        </>
    )
}