/**
 * Las páginas viven en `app/(dashboard)/...`, así que su URL canónica es
 * `/estudiante/...`, pero la app enlaza con el alias `/dashboard/estudiante/...`.
 * Normalizar el prefijo permite que ambos caminos compartan estado activo,
 * selector familiar y contexto `?estudiante=`.
 */
export function normalizeDashboardPath(pathname: string): string {
  if (pathname === '/dashboard') return '/'
  return pathname.startsWith('/dashboard/') ? pathname.slice('/dashboard'.length) : pathname
}

/** ¿La ruta actual pertenece al panel indicado, en cualquiera de sus dos formas? */
export function isPathWithinPanel(pathname: string, panelHref: string): boolean {
  const current = normalizeDashboardPath(pathname)
  const panel = normalizeDashboardPath(panelHref)
  return current === panel || current.startsWith(`${panel}/`)
}

/** ¿El enlace de navegación debe marcarse como activo para la ruta actual? */
export function isActiveNavHref(pathname: string, href: string): boolean {
  const path = href.split('?')[0] ?? href
  const current = normalizeDashboardPath(pathname)
  const target = normalizeDashboardPath(path)
  return current === target || current.startsWith(`${target}/`)
}
