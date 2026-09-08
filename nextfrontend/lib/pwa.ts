'use client';

import { useEffect, useState } from 'react';

export const INSTALL_REQUEST_EVENT = 'tosei:request-install';

const APP_INSTALLED_KEY = 'tosei:pwa-installed';
const INSTALL_PROMPT_DISMISSED_KEY = 'tosei:install-prompt-dismissed';

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

export function isAppInstalled(): boolean {
    if (isStandalone()) return true;
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(APP_INSTALLED_KEY) === '1';
    } catch {
        return false;
    }
}

export function markAppInstalled(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(APP_INSTALLED_KEY, '1');
    } catch {
        // storage no disponible: la detección en sesión sigue funcionando
    }
}

export function isInstallPromptDismissed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

export function markInstallPromptDismissed(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1');
    } catch {
        // storage no disponible
    }
}

export function useIsInstalledPwa(): boolean {
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const update = () => setInstalled(isAppInstalled());

        const onInstalled = () => {
            markAppInstalled();
            update();
        };

        update();

        const mq = window.matchMedia('(display-mode: standalone)');
        const onChange = () => update();
        mq.addEventListener('change', onChange);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            mq.removeEventListener('change', onChange);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    return installed;
}