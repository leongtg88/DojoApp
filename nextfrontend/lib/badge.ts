'use client';

interface BadgingNavigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
}

/**
 * Actualiza el contador de notificaciones no leídas en el ícono de la app
 * instalada (Badging API). Soportado en Chrome Android y desktop.
 * En iOS Safari no existe la API: la llamada se ignora en silencio.
 */
export function setUnreadBadge(count: number): void {
    if (typeof navigator === 'undefined') return;

    const nav = navigator as Navigator & BadgingNavigator;
    if (typeof nav.setAppBadge !== 'function') return;

    try {
        if (count > 0) {
            void nav.setAppBadge(count);
        } else {
            void nav.clearAppBadge();
        }
    } catch {
        // API no disponible en este contexto (p. ej. app no instalada): se ignora.
    }
}