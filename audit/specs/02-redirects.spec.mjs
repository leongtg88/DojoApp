import { test, expect } from '@playwright/test'
import { contextFor, writeJson } from '../fixtures/helpers.mjs'
import fs from 'node:fs'

const fixtures = JSON.parse(fs.readFileSync('reports/fixtures.json', 'utf8'))
const oldRoutes = [
  '/dashboard/estudiante/horario',
  '/estudiante/horario',
  '/dashboard/estudiante/asistencia',
  '/estudiante/asistencia',
]

test.describe('Redirecciones de rutas antiguas', () => {
  test('código HTTP de la redirección permanente', async ({ browser }, testInfo) => {
    const project = testInfo.project.name
    const ctx = await contextFor(browser, project, 'student', testInfo.project.use.baseURL)
    const rows = []
    for (const path of oldRoutes) {
      const res = await ctx.request.get(path, { maxRedirects: 0, failOnStatusCode: false })
      const row = {
        project,
        path,
        status: res.status(),
        location: res.headers()['location'] ?? null,
        permanent: [301, 308].includes(res.status()),
      }
      rows.push(row)
      if (project === 'new') {
        expect.soft(row.status, `Se esperaba 308 permanente en ${path}`).toBe(308)
        expect.soft(row.location, `Se esperaba cabecera Location en ${path}`).not.toBeNull()
      } else {
        expect.soft(row.status, `Producción sirve la página antigua en ${path}`).toBe(200)
      }
    }
    writeJson(`redirects-http-${project}.json`, rows)
    console.log(`\nRedirecciones HTTP ${project}:`, JSON.stringify(rows, null, 2))
    await ctx.close()
  })

  test('la página antigua termina en Clases tras el JavaScript', async ({ browser }, testInfo) => {
    const project = testInfo.project.name
    const ctx = await contextFor(browser, project, 'student', testInfo.project.use.baseURL)
    const page = await ctx.newPage()
    const rows = []
    for (const path of oldRoutes) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      if (project === 'new') {
        await page.waitForURL(/\/dashboard\/estudiante\/clases/, { timeout: 15_000 }).catch(() => {})
        const h1 = await page.locator('h1').allTextContents()
        rows.push({ project, path, httpStatus: response?.status() ?? null, finalUrl: page.url(), h1 })
        expect.soft(page.url(), `Destino final de ${path}`).toContain('/dashboard/estudiante/clases')
        expect.soft(h1).toContain('Mis clases')
      } else {
        const h1 = await page.locator('h1').allTextContents()
        rows.push({ project, path, httpStatus: response?.status() ?? null, finalUrl: page.url(), h1 })
        expect.soft(page.url(), `Producción no debe redirigir ${path}`).toContain(path)
      }
    }
    writeJson(`redirects-browser-${project}.json`, rows)
    console.log(`\nRedirecciones navegador ${project}:`, JSON.stringify(rows, null, 2))
    await ctx.close()
  })

  test('el tutor conserva el hijo seleccionado al seguir un enlace viejo', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const ctx = await contextFor(browser, 'new', 'guardian', testInfo.project.use.baseURL)
    const page = await ctx.newPage()
    const paths = [
      `/dashboard/estudiante/horario?estudiante=${fixtures.anaStudentId}`,
      `/dashboard/estudiante/asistencia?estudiante=${fixtures.anaStudentId}`,
      `/estudiante/horario?estudiante=${fixtures.anaStudentId}`,
    ]
    const rows = []
    for (const path of paths) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForURL(/\/dashboard\/estudiante\/clases/, { timeout: 15_000 }).catch(() => {})
      const switcher = page.locator('[aria-label^="Viendo el expediente de:"]').first()
      const label = await switcher.getAttribute('aria-label').catch(() => null)
      const row = { path, finalUrl: page.url(), switcherLabel: label }
      rows.push(row)
      expect.soft(row.finalUrl, `La query del hijo se perdió en ${path}`).toContain(`estudiante=${fixtures.anaStudentId}`)
      expect.soft(label ?? '', `El selector debe seguir mostrando a Ana en ${path}`).toContain('Ana')
    }
    writeJson('redirects-guardian.json', rows)
    console.log('\nRedirecciones tutor:', JSON.stringify(rows, null, 2))
    await ctx.close()
  })

  test('barra final en la ruta antigua', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const ctx = await contextFor(browser, 'new', 'student', testInfo.project.use.baseURL)
    const res = await ctx.request.get('/dashboard/estudiante/horario/', { maxRedirects: 0, failOnStatusCode: false })
    const row = { path: '/dashboard/estudiante/horario/', status: res.status(), location: res.headers()['location'] ?? null }
    writeJson('redirects-trailing.json', [row])
    console.log('\nBarra final:', row)
    expect.soft(row.status).toBe(308)
    await ctx.close()
  })
})
