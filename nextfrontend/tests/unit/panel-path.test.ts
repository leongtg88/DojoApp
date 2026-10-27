import { describe, expect, it } from 'vitest'
import {
  isActiveNavHref,
  isPathWithinPanel,
  normalizeDashboardPath,
} from '@/lib/navigation/panel-path'

describe('UX-B1 · rutas canónicas y alias /dashboard', () => {
  it('normaliza el alias sin tocar rutas que solo empiezan parecido', () => {
    expect(normalizeDashboardPath('/dashboard/estudiante')).toBe('/estudiante')
    expect(normalizeDashboardPath('/dashboard/estudiante/perfil')).toBe('/estudiante/perfil')
    expect(normalizeDashboardPath('/estudiante')).toBe('/estudiante')
    expect(normalizeDashboardPath('/dashboard')).toBe('/')
    expect(normalizeDashboardPath('/dashboard-admin')).toBe('/dashboard-admin')
  })

  it('reconoce el panel del alumno en sus dos formas', () => {
    expect(isPathWithinPanel('/estudiante', '/dashboard/estudiante')).toBe(true)
    expect(isPathWithinPanel('/estudiante/clases', '/dashboard/estudiante')).toBe(true)
    expect(isPathWithinPanel('/dashboard/estudiante', '/dashboard/estudiante')).toBe(true)
    expect(isPathWithinPanel('/dashboard/estudiante/perfil', '/dashboard/estudiante')).toBe(true)
    expect(isPathWithinPanel('/dashboard/admin', '/dashboard/estudiante')).toBe(false)
  })

  it('reconoce los paneles de instructor y admin en sus dos formas', () => {
    expect(isPathWithinPanel('/instructor', '/dashboard/instructor')).toBe(true)
    expect(isPathWithinPanel('/dashboard/instructor/asistencia', '/dashboard/instructor')).toBe(true)
    expect(isPathWithinPanel('/admin', '/dashboard/admin')).toBe(true)
    expect(isPathWithinPanel('/dashboard/admin/alumnos', '/dashboard/admin')).toBe(true)
  })

  it('marca el enlace activo aunque la URL sea la canónica', () => {
    expect(isActiveNavHref('/estudiante', '/dashboard/estudiante')).toBe(true)
    expect(isActiveNavHref('/estudiante/perfil', '/dashboard/estudiante/perfil')).toBe(true)
    expect(isActiveNavHref('/estudiante/perfil', '/dashboard/estudiante')).toBe(true)
    expect(isActiveNavHref('/estudiante', '/dashboard/estudiante/perfil')).toBe(false)
    expect(isActiveNavHref('/dashboard/ajustes', '/dashboard/ajustes')).toBe(true)
  })
})
