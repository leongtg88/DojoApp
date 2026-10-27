import { describe, expect, it } from 'vitest'
import {
  buildLegacyStudentRedirect,
  getLegacyStudentRedirect,
} from '@/lib/navigation/legacy-redirects'

describe('UX-B1 · redirecciones de rutas antiguas', () => {
  it.each([
    ['/estudiante/horario', '/dashboard/estudiante/clases'],
    ['/estudiante/asistencia', '/dashboard/estudiante/clases'],
    ['/dashboard/estudiante/horario', '/dashboard/estudiante/clases'],
    ['/dashboard/estudiante/asistencia', '/dashboard/estudiante/clases'],
  ])('%s → %s', (pathname, expected) => {
    expect(getLegacyStudentRedirect(pathname)).toBe(expected)
    expect(buildLegacyStudentRedirect(pathname, '')).toBe(expected)
  })

  it('conserva la query del hijo seleccionado', () => {
    expect(buildLegacyStudentRedirect('/estudiante/horario', '?estudiante=ana')).toBe(
      '/dashboard/estudiante/clases?estudiante=ana',
    )
    expect(buildLegacyStudentRedirect('/dashboard/estudiante/asistencia', '?estudiante=ana&x=1')).toBe(
      '/dashboard/estudiante/clases?estudiante=ana&x=1',
    )
  })

  it('tolera una query sin el signo ?', () => {
    expect(buildLegacyStudentRedirect('/estudiante/asistencia', 'estudiante=ana')).toBe(
      '/dashboard/estudiante/clases?estudiante=ana',
    )
  })

  it('no redirige rutas nuevas ni desconocidas', () => {
    expect(getLegacyStudentRedirect('/dashboard/estudiante/clases')).toBeNull()
    expect(buildLegacyStudentRedirect('/dashboard/estudiante/entrenar', '?x=1')).toBeNull()
    expect(buildLegacyStudentRedirect('/otra', '')).toBeNull()
  })
})
