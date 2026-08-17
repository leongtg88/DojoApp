'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFoooter() {
    const pathname = usePathname();
    if (pathname === '/asistente')
        return null;
    return <Footer/>;
}
