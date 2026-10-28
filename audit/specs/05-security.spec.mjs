import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { contextFor, writeJson } from '../fixtures/helpers.mjs'

const fixtures = JSON.parse(fs.readFileSync('reports/fixtures.json', 'utf8'))

test.describe('Seguridad básica del portal', () => {
  test('sin sesión todas las rutas nuevas llevan a /login', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Se valida contra la versión nueva')
    const ctx = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const paths = [
      '/estudiante',
      '/dashboard/estudiante',
      '/estudiante/clases',
      '/dashboard/estudiante/clases',
      '/estudiante/entrenar',
      '/dashboard/estudiante/entrenar',
      '/dashboard/estudiante/horario',
      '/dashboard/estudiante/asistencia',
      '/dashboard/ajustes',
      '/dashboard/admin',
      '/dashboard/instructor/asistencia',
    ]
    const rows = []
    for (const path of paths) {
      const res = await ctx.request.get(path, { maxRedirects: 0, failOnStatusCode: false })
      const location = res.headers()['location'] ?? ''
      rows.push({ path, status: res.status(), location })
      expect.soft(res.status(), `${path} sin sesión`).toBe(307)
      expect.soft(location, `${path} debe apuntar a /login`).toContain('/login')
    }
    writeJson('security-anon.json', rows)
    console.log('\nSin sesión:', JSON.stringify(rows, null, 2))
    await ctx.close()
  })

  test('otro rol termina en /no-autorizado', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Se valida contra la versión nueva')
    const cases = [
      { role: 'instructor', paths: ['/dashboard/estudiante', '/dashboard/estudiante/clases', '/estudiante/clases', '/estudiante/entrenar'] },
      { role: 'admin', paths: ['/dashboard/estudiante', '/dashboard/estudiante/clases', '/estudiante/clases'] },
      { role: 'student', paths: ['/dashboard/admin', '/dashboard/instructor/asistencia', '/dashboard/instructor'] },
    ]
    const rows = []
    for (const item of cases) {
      const ctx = await contextFor(browser, 'new', item.role, testInfo.project.use.baseURL)
      const page = await ctx.newPage()
      for (const path of item.paths) {
        const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1200)
        const row = {
          role: item.role,
          path,
          httpStatus: res?.status() ?? null,
          finalUrl: page.url(),
          h1: await page.locator('h1').allTextContents(),
        }
        rows.push(row)
        expect.soft(row.finalUrl, `${item.role} en ${path}`).toContain('/no-autorizado')
      }
      await ctx.close()
    }
    writeJson('security-roles.json', rows)
    console.log('\nRoles:', JSON.stringify(rows, null, 2))
  })

  test('?estudiante= de un hijo ajeno no muestra datos', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Se valida contra la versión nueva')
    const rows = []
    for (const role of ['guardian', 'student']) {
      const ctx = await contextFor(browser, 'new', role, testInfo.project.use.baseURL)
      const page = await ctx.newPage()
      for (const path of [
        `/dashboard/estudiante?estudiante=${fixtures.ownerStudentId}`,
        `/dashboard/estudiante/clases?estudiante=${fixtures.ownerStudentId}`,
        `/dashboard/estudiante/perfil?estudiante=${fixtures.ownerStudentId}`,
        `/estudiante/clases?estudiante=${fixtures.ownerStudentId}`,
      ]) {
        const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1200)
        const body = await page.locator('body').innerText()
        const row = {
          role,
          path,
          httpStatus: res?.status() ?? null,
          finalUrl: page.url(),
          h1: await page.locator('h1').allTextContents(),
          leaksOwnerName: body.includes('Sensei Tosei Gusoku'),
        }
        rows.push(row)
        expect.soft(row.finalUrl, `${role} con hijo ajeno en ${path}`).toContain('/no-autorizado')
        expect.soft(row.leaksOwnerName, `${role} no debe ver datos del hijo ajeno en ${path}`).toBe(false)
      }
      await ctx.close()
    }

    const guardian = await contextFor(browser, 'new', 'guardian', testInfo.project.use.baseURL)
    const api = await guardian.request.get(`/api/dashboard/student/documents?estudiante=${fixtures.ownerStudentId}`, { failOnStatusCode: false })
    const apiRow = { endpoint: '/api/dashboard/student/documents', status: api.status(), body: await api.text() }
    writeJson('security-foreign.json', { pages: rows, api: apiRow })
    console.log('\nHijo ajeno:', JSON.stringify({ pages: rows, api: apiRow }, null, 2))
    expect.soft(apiRow.status, 'La API debe rechazar el hijo ajeno').toBe(403)
    await guardian.close()
  })
})
