import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { contextFor, screenshotsDir, writeJson } from '../fixtures/helpers.mjs'

const pagesByProject = {
  prod: [
    ['hoy', '/dashboard/admin'],
    ['alumnos', '/dashboard/admin/alumnos'],
    ['operacion-asistencia', '/dashboard/admin/asistencia'],
    ['configuracion-horarios', '/dashboard/admin/horarios'],
    ['comunicacion-mensajes', '/dashboard/admin/mensajes'],
  ],
  new: [
    ['hoy', '/dashboard/admin'],
    ['alumnos', '/dashboard/admin/alumnos'],
    ['operacion-hub', '/dashboard/admin/operacion'],
    ['operacion-asistencia', '/dashboard/admin/asistencia'],
    ['configuracion-hub', '/dashboard/admin/configuracion'],
    ['configuracion-horarios', '/dashboard/admin/horarios'],
    ['comunicacion-hub', '/dashboard/admin/comunicacion'],
    ['comunicacion-mensajes', '/dashboard/admin/mensajes'],
  ],
}

test.describe('Capturas del admin', () => {
  test('375 y 1440', async ({ browser }, testInfo) => {
    test.setTimeout(180_000)
    const project = testInfo.project.name
    const ctx = await contextFor(browser, project, 'admin', testInfo.project.use.baseURL)
    const page = await ctx.newPage()
    const rows = []

    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      for (const [name, route] of pagesByProject[project]) {
        const errors = []
        const onError = (error) => errors.push(`pageerror: ${error.message}`)
        const onConsole = (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) }
        page.on('pageerror', onError)
        page.on('console', onConsole)
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1000)
        const outDir = path.join(screenshotsDir, project, String(viewport.width))
        fs.mkdirSync(outDir, { recursive: true })
        const file = path.join(outDir, `${name}.png`)
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
        let viewportFile = null
        if (viewport.width === 375) {
          viewportFile = path.join(outDir, `${name}-viewport.png`)
          await page.screenshot({ path: viewportFile, fullPage: false, animations: 'disabled' })
        }
        const row = {
          project,
          viewport,
          name,
          route,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          h1: await page.locator('h1').allTextContents(),
          screenshot: path.relative(process.cwd(), file).replaceAll('\\', '/'),
          viewportScreenshot: viewportFile ? path.relative(process.cwd(), viewportFile).replaceAll('\\', '/') : null,
          errors: [...errors],
        }
        rows.push(row)
        expect.soft(row.status, `${route} a ${viewport.width}px`).toBe(200)
        page.off('pageerror', onError)
        page.off('console', onConsole)
      }
    }

    writeJson(`screenshots-${project}.json`, rows)
    console.log(`\nCapturas ${project}: ${rows.length}`)
    await ctx.close()
  })
})
