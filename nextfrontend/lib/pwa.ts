'use client';

import { useEffect, useState } from 'react';

export const INSTALL_REQUEST_EVENT = 'tosei:request-install';

export function requestAppInstall() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(INSTALL_REQUEST_EVENT));
}

export function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    const nav = navigator as Navigator & { standalone?: boolean };
    return typeof nav.standalone === 'boolean' && nav.standalone;
}

export function useIsInstalledPwa(): boolean {
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const update = () => setInstalled(isStandalone());
        update();

        const mq = window.matchMedia('(display-mode: standalone)');
        const onChange = () => update();
        mq.addEventListener('change', onChange);
        window.addEventListener('appinstalled', update);

        return () => {
            mq.removeEventListener('change', onChange);
            window.removeEventListener('appinstalled', update);
        };
    }, []);

    return installed;
}