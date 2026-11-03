import 'server-only'

// Marcador de módulo de servidor. La implementación vive en
// `document-storage-core.ts` para que los scripts de diagnóstico puedan
// reutilizarla con `tsx` (que no resuelve el paquete `server-only`).
export * from './document-storage-core'
