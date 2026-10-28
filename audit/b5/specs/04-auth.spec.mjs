import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { contextFor, fixtures, writeJson } from '../fixtures/helpers.mjs'

const f = fixtures()
const adminPages = [
  '/dashboard/admin',
  '/dashboard/admin/alumnos',
  '/dashboard/admin/operacion',
  '/dashboard/admin/configuracion',
  '/dashboard/admin/comunicacion',
  '/dashboard/admin/asistencia',
  '/dashboard/admin/horarios',
]
const adminMarkers = [
  'Inscripciones pendientes',
  'Documentos por revisar',
  'Alumnos sin plan',
  'Alumnos sin horario',
  'Pendientes de hoy',
  'Pendiente A',
  'documento-a.pdf',
  'Sin Plan Con Horario',
  'Sin Horario Con Plan',
  'Inactivo Auditoría',
  'Beto Escuela B',
  'Dojo Auditoría B',
  'Sensei Tosei Gusoku',
]

function adminApiRoutes() {
  const source = fs.readFileSync(path.resolve('../../nextfrontend/tests/integration/route-auth-matrix.test.ts'), 'utf8')
  const entries = []
  const re = /e\('([^']+)',\s*'(GET|POST|PATCH|PUT|DELETE)',\s*'admin',\s*\(\)\s*=>\s*import\('([^']+)'\)/g
  for (const match of source.matchAll(re)) {
    const route = match[1].replace(/\[[^\]]+\]/g, 'x')
    entries.push({ route, method: match[2], importPath: match[3] })
  }
  return entries
}

test.describe('Autorización del admin e INV-06', () => {
  test('páginas nuevas: sin sesión, roles incorrectos y HTML inicial', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Se valida contra la versión nueva')
    const baseURL = testInfo.project.use.baseURL
    const results = []

    const anonymous = await browser.newContext({ baseURL })
    for (const route of adminPages) {
      const res = await anonymous.request.get(route, { maxRedirects: 0, failOnStatusCode: false })
      results.push({ route, role: 'anonymous', httpStatus: res.status(), location: res.headers()['location'] ?? null })
      expect.soft(res.status(), `${route} sin sesión`).toBe(307)
      expect.soft(res.headers()['location'] ?? '', `${route} sin sesión debe ir a login`).toContain('/login')
    }
    await anonymous.close()

    for (const role of ['student', 'instructor', 'guardian']) {
      const ctx = await contextFor(browser, 'new', role, baseURL)
      const page = await ctx.newPage()
      page.setDefaultTimeout(10_000)
      for (const route of adminPages) {
        const raw = await ctx.request.get(route, { maxRedirects: 0, failOnStatusCode: false })
        const rawBody = await raw.text()
        const leaks = adminMarkers.filter((marker) => rawBody.includes(marker))
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await page.waitForURL(/\/no-autorizado/, { timeout: 15_000 }).catch(() => {})
        const row = {
          route,
          role,
          initialHttpStatus: raw.status(),
          initialLeaks: leaks,
          finalUrl: page.url(),
          finalH1: await page.locator('h1').allTextContents(),
        }
        results.push(row)
        expect.soft(row.finalUrl, `${role} en ${route}`).toContain('/no-autorizado')
        expect.soft(row.initialLeaks, `${role} no debe recibir datos del admin en el HTML inicial de ${route}`).toEqual([])
      }
      await ctx.close()
    }

    writeJson('auth-pages.json', results)
    console.log('\nAuth páginas:', JSON.stringify(results, null, 2))
  })

  test('INV-06: admin B no ve datos de la escuela A', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Se valida contra la versión nueva')
    const baseURL = testInfo.project.use.baseURL
    const ctx = await contextFor(browser, 'new', 'adminB', baseURL)
    const page = await ctx.newPage()
    page.setDefaultTimeout(10_000)
    const results = []
    const checks = [
      { path: '/dashboard/admin', allowed: ['Beto Escuela B', 'Pendiente B'], forbidden: ['Pendiente A', 'Sin Plan Con Horario', 'Sin Horario Con Plan', 'Inactivo Auditoría', 'documento-a.pdf', 'Sensei Tosei Gusoku'] },
      { path: '/dashboard/admin/alumnos', allowed: ['Beto Escuela B'], forbidden: ['Juan Pérez', 'Sin Plan Con Horario', 'Sin Horario Con Plan', 'Inactivo Auditoría', 'Sensei Tosei Gusoku'] },
      { path: '/dashboard/admin/alumnos?docs=pending', allowed: ['Beto Escuela B'], forbidden: ['documento-a.pdf', 'Juan Pérez'] },
      { path: '/dashboard/admin/asistencia', allowed: ['Karate B'], forbidden: ['Karate general', 'Juan Pérez', 'Sensei Tosei Gusoku'] },
      { path: '/dashboard/admin/horarios', allowed: ['Karate B'], forbidden: ['Adultos Noche', 'Karate general', 'Juan Pérez'] },
    ]
    for (const check of checks) {
      const res = await page.goto(check.path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(900)
      const body = await page.locator('body').innerText()
      const forbiddenFound = check.forbidden.filter((text) => body.includes(text))
      const allowedFound = check.allowed.filter((text) => body.includes(text))
      results.push({ path: check.path, status: res?.status() ?? null, forbiddenFound, allowedFound })
      expect.soft(forbiddenFound, `INV-06: ${check.path} no debe mostrar datos de A`).toEqual([])
    }

    const studentDetail = await page.goto(`/dashboard/admin/alumnos/${f.juanStudentId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    const detailBody = await page.locator('body').innerText()
    const detailLeak = ['Juan Pérez', 'Sensei Tosei Gusoku'].filter((text) => detailBody.includes(text))
    results.push({ path: `/dashboard/admin/alumnos/${f.juanStudentId}`, status: studentDetail?.status() ?? null, forbiddenFound: detailLeak })
    expect.soft(detailLeak, 'INV-06: admin B no debe ver el expediente de Juan').toEqual([])

    const api = await ctx.request.get('/api/dashboard/admin/students', { failOnStatusCode: false })
    const apiBody = await api.text()
    const apiLeak = ['Juan Pérez', 'Sensei Tosei Gusoku', 'Sin Plan Con Horario'].filter((text) => apiBody.includes(text))
    results.push({ path: '/api/dashboard/admin/students', status: api.status(), forbiddenFound: apiLeak })
    expect.soft(apiLeak, 'INV-06: la API de alumnos de B no debe incluir alumnos de A').toEqual([])

    writeJson('auth-inv06.json', results)
    console.log('\nINV-06:', JSON.stringify(results, null, 2))
    await ctx.close()
  })

  test('matriz API ampliada: alumno, instructor, tutor y admin', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Se valida contra la versión nueva')
    const baseURL = testInfo.project.use.baseURL
    const routes = adminApiRoutes()
    const roleContexts = {
      anonymous: await browser.newContext({ baseURL }),
      student: await contextFor(browser, 'new', 'student', baseURL),
      instructor: await contextFor(browser, 'new', 'instructor', baseURL),
      guardian: await contextFor(browser, 'new', 'guardian', baseURL),
      admin: await contextFor(browser, 'new', 'admin', baseURL),
    }
    const rows = []
    for (const item of routes) {
      const url = `/api/dashboard/${item.route}`
      for (const [role, ctx] of Object.entries(roleContexts)) {
        const res = await ctx.request.fetch(url, {
          method: item.method,
          maxRedirects: 0,
          failOnStatusCode: false,
          headers: { Origin: baseURL, Referer: `${baseURL}/` },
          data: item.method === 'GET' ? undefined : {},
        })
        rows.push({ route: item.route, url, method: item.method, role, status: res.status() })
      }
    }
    for (const ctx of Object.values(roleContexts)) await ctx.close()

    for (const row of rows) {
      if (row.role === 'anonymous') {
        expect.soft([401, 403], `${row.method} ${row.url} sin sesión`).toContain(row.status)
      } else if (row.role === 'student' || row.role === 'instructor' || row.role === 'guardian') {
        expect.soft(row.status, `${row.role} no debe acceder a ${row.method} ${row.url}`).toBe(403)
      } else {
        expect.soft(row.status, `admin no debería recibir 403 en ${row.method} ${row.url}`).not.toBe(403)
      }
    }

    writeJson('api-auth-matrix.json', rows)
    console.log(`\nMatriz API: ${rows.length} combinaciones`)
    const failures = rows.filter((row) => {
      if (row.role === 'anonymous') return ![401, 403].includes(row.status)
      if (row.role === 'admin') return row.status === 403
      return row.status !== 403
    })
    console.log('Combinaciones no esperadas:', JSON.stringify(failures, null, 2))
  })
})
