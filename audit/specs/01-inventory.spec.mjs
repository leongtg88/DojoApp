import { test, expect } from '@playwright/test'
import { contextFor, writeJson } from '../fixtures/helpers.mjs'

const paths = [
  '/dashboard/estudiante',
  '/estudiante',
  '/dashboard/estudiante/perfil',
  '/estudiante/perfil',
  '/dashboard/estudiante/progreso',
  '/estudiante/progreso',
  '/dashboard/estudiante/horario',
  '/estudiante/horario',
  '/dashboard/estudiante/asistencia',
  '/estudiante/asistencia',
  '/dashboard/estudiante/clases',
  '/estudiante/clases',
  '/dashboard/estudiante/entrenar',
  '/estudiante/entrenar',
  '/dashboard/estudiante/entrenar/katas',
  '/estudiante/entrenar/katas',
  '/dashboard/ajustes',
]

const expected = {
  prod: {
    '/dashboard/estudiante': 200,
    '/estudiante': 200,
    '/dashboard/estudiante/perfil': 200,
    '/estudiante/perfil': 200,
    '/dashboard/estudiante/progreso': 200,
    '/estudiante/progreso': 200,
    '/dashboard/estudiante/horario': 200,
    '/estudiante/horario': 200,
    '/dashboard/estudiante/asistencia': 200,
    '/estudiante/asistencia': 200,
    '/dashboard/estudiante/clases': 404,
    '/estudiante/clases': 404,
    '/dashboard/estudiante/entrenar': 404,
    '/estudiante/entrenar': 404,
    '/dashboard/estudiante/entrenar/katas': 404,
    '/estudiante/entrenar/katas': 404,
    '/dashboard/ajustes': 200,
  },
  new: {
    '/dashboard/estudiante': 200,
    '/estudiante': 200,
    '/dashboard/estudiante/perfil': 200,
    '/estudiante/perfil': 200,
    '/dashboard/estudiante/progreso': 200,
    '/estudiante/progreso': 200,
    '/dashboard/estudiante/horario': 200,
    '/estudiante/horario': 200,
    '/dashboard/estudiante/asistencia': 200,
    '/estudiante/asistencia': 200,
    '/dashboard/estudiante/clases': 200,
    '/estudiante/clases': 200,
    '/dashboard/estudiante/entrenar': 200,
    '/estudiante/entrenar': 200,
    '/dashboard/estudiante/entrenar/katas': 404,
    '/estudiante/entrenar/katas': 404,
    '/dashboard/ajustes': 200,
  },
}

test.describe('Inventario HTTP de rutas del alumno', () => {
  test('matriz ruta antigua / nueva / alias', async ({ browser }, testInfo) => {
    const project = testInfo.project.name
    const ctx = await contextFor(browser, project, 'student', testInfo.project.use.baseURL)
    const rows = []
    for (const path of paths) {
      const res = await ctx.request.get(path, { maxRedirects: 0, failOnStatusCode: false })
      const row = {
        project,
        path,
        status: res.status(),
        location: res.headers()['location'] ?? null,
        note:
          project === 'new' && ['/dashboard/estudiante/horario', '/estudiante/horario', '/dashboard/estudiante/asistencia', '/estudiante/asistencia'].includes(path)
            ? 'redirección cliente observada; el HTTP no trae Location'
            : undefined,
      }
      rows.push(row)
      expect.soft(row.status, `${project} ${path}`).toBe(expected[project][path])
    }
    writeJson(`inventory-${project}.json`, rows)
    console.log(`\nInventario ${project}:`)
    for (const row of rows) console.log(`${row.status}\t${row.path}\t${row.location ?? ''}`)
    await ctx.close()
  })
})
